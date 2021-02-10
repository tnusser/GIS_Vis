from flask import Flask, jsonify, escape, request
from flask_cors import CORS
import json
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
app.config.from_object(__name__)
CORS(app)


@app.route('/numbars', methods=["GET", "POST"])
def get_Boundaries():
    app.logger.info(request.json)

    birth, death, relative, absolute = True, False, True, False
    year = 2019

    try:
        birth = request.get_json().get('birth')
        death = request.get_json().get('death')
        year = request.get_json().get('year')
        relative = request.get_json().get('relative')
        absolute = request.get_json().get('absolute')

    except AttributeError:
        app.logger.info("event not there")

    app.logger.info(relative)

    if birth and not death and str(year) == "2007" and relative and not absolute:
        init = True
    else:
        init = False

    if birth and death:
        dual = True
    else:
        dual = False
        if birth:
            numbars = "birth"
        if death:
            numbars = "death"

    normalize = relative if relative else False

    app.logger.info("normalize: " + str(normalize))

    with psycopg2.connect(host="database", port=5432, dbname="gis", user="testuser", password="testpw") as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(build_query(year))
            results = cursor.fetchall()

    # return jsonify([{'name': r[0], 'way': r[1]} for r in results]), 200

    app.logger.info(jsonify(results))
    # convert results to a GeoJSON

    norm_val = 100000

    births = []
    deaths = []
    population = []
    combined = []
    dual = True
    if dual:
        for res in results:
            births.append(res["birth"])
            deaths.append(res["death"])
            population.append(res["population"])

        birth_class = calc_class(births, population, norm_val, ident=["A", "B", "C"])
        death_class = calc_class(deaths, population, norm_val, ident=["1", "2", "3"])
        for a, b in zip(birth_class, death_class):
            combined.append(a + b)

    line_result = linechart()

    geojsons = prep_result(init, norm_val, results, normalize, numbars, combined, line_result)

    app.logger.info("Geojson built")

    # return all results as a feature collection
    return jsonify({
        "type": "FeatureCollection", "features": geojsons
    }), 200


def prep_result(with_geometry, norm_val, results, normalize, numbars, combined, line_result):
    geojsons = []

    for i, result in enumerate(results):
        if normalize:
            if int(result[numbars]) < 0 or int(result['population']) < 1:
                result[numbars] = -1
            else:
                result[numbars] = int((int(result[numbars]) / int(result['population'])) * norm_val)
        else:
            if int(result[numbars]) < 0:
                result[numbars] = -1
        if not with_geometry:
            geom = None
        else:
            geom = json.loads(result['geometry'])

        geojsons.append({
            "type": "Feature",
            "id": result['osm_id'],
            "properties": {
                "name": result['name'],
                "numbars": int(result[numbars]),
                "dual": combined[i],
                "birth": line_result[0][result["osm_id"]],
                "death": line_result[1][result["osm_id"]],
                "pop": line_result[2][result["osm_id"]],
                "bip": line_result[3][result["osm_id"]]
            },
            "geometry": geom
        })
    return geojsons


def build_query(year):
    app.logger.info("Build Query with year: " + str(year))

    query = """WITH bezirke AS (SELECT osm_id, name, geometry AS geom FROM polygon_cropped pop), 
    q_data AS ( SELECT osm_id, year, birth, death, population FROM public.pop_stat where year = %s)
    SELECT c.osm_id, c.name, c.geom AS geometry, birth, death, population
    FROM bezirke c LEFT JOIN q_data q ON c.osm_id = q.osm_id
""" % year
    return query


def temp_query():
    query = """
        WITH bezirke AS (
	SELECT osm_id, name, way AS geom, tags
	FROM planet_osm_polygon pop
	WHERE pop.admin_level = '4' and name in ('Berlin', 'Hamburg')
	UNION
	SELECT osm_id, name, ST_Union(way) AS geom, tags
	FROM planet_osm_polygon pop
	WHERE admin_level = '6'
	GROUP BY osm_id, name, tags
), birth AS (
	SELECT osm_id, CAST(CAST(birth AS float) / CAST(population AS float) * 100000 AS INT) as birth_ratio, year, population
	FROM public.pop_stat
	where year = 2018
)
SELECT c.osm_id, c.name, ST_AsGeoJSON(c.geom) AS geometry, c.tags, CAST(b.birth_ratio AS BIGINT) as numbars --count(b.*) AS numbars
FROM bezirke c LEFT JOIN birth b ON c.osm_id = b.osm_id
GROUP BY c.osm_id, c.name, c.geom, c.tags, b.birth_ratio order by name"""
    return query

def linechart_query():
    query= """
    SELECT
    osm_id, lkr_id, name, year, birth, death, population, bip
    FROM
    public.pop_stat
    order
    by
    osm_id, year"""
    return query

def linechart():
    with psycopg2.connect(host="database", port=5432, dbname="gis", user="testuser", password="testpw") as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(linechart_query())
            results = cursor.fetchall()

    birth_dict, death_dict, pop_dict, bip_dict = {}, {}, {}, {}
    for res in results:
        if res["osm_id"] not in birth_dict:
            birth_dict[res["osm_id"]] = [res["birth"]]
        else:
            birth_dict[res["osm_id"]].append(res["birth"])
        if res["osm_id"] not in death_dict:
            death_dict[res["osm_id"]] = [res["death"]]
        else:
            death_dict[res["osm_id"]].append(res["death"])
        if res["osm_id"] not in pop_dict:
            pop_dict[res["osm_id"]] = [res["population"]]
        else:
            pop_dict[res["osm_id"]].append(res["population"])
        if res["osm_id"] not in bip_dict:
            if res["bip"] > 0:
                bip_dict[res["osm_id"]] = [res["bip"]*1000]
            else:
                bip_dict[res["osm_id"]] = [res["bip"]]
        else:
            if res["bip"] > 0:
                bip_dict[res["osm_id"]].append(res["bip"]*1000)
            else:
                bip_dict[res["osm_id"]].append(res["bip"])

    return (birth_dict, death_dict, pop_dict, bip_dict)

def calc_class(values, normalize_values, norm_val, ident):
    min_max = []
    for i, (b, p) in enumerate(zip(values, normalize_values)):
        if b > 0 and p > 0:
            min_max.append(int((b / p) * norm_val))
        else:
            min_max.append(-1)
    max_b, min_b = 1, 99999
    for el in min_max:
        if el > max_b:
            max_b = el
        if min_b > el > 0:
            min_b = el
    class_bound = int((max_b - min_b) / 3)
    class_bound_a = min_b + class_bound
    class_bound_b = min_b + (2 * class_bound)

    b_classes = []
    for el in min_max:
        if el != -1:
            if el < class_bound_a:
                b_classes.append(ident[0])
            elif el < class_bound_b:
                b_classes.append(ident[1])
            else:
                b_classes.append(ident[2])
        else:
            b_classes.append("0")
    return b_classes
