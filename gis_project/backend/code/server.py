from flask import Flask, jsonify, escape, request, session
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

    numbars = 'birth' if birth else 'death'
    normalize = relative if relative else False

    app.logger.info("normalize: " + str(normalize))

    with psycopg2.connect(host="database", port=5432, dbname="gis", user="testuser", password="testpw") as conn:
        with conn.cursor() as cursor:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(build_query(year))
                results = cursor.fetchall()

    # return jsonify([{'name': r[0], 'way': r[1]} for r in results]), 200

    app.logger.info(jsonify(results))
    # convert results to a GeoJSON

    geojsons = []

    if init:
        for result in results:
            if normalize:
                if int(result[numbars]) < 0 or int(result['population']) < 1:
                    result[numbars] = -1
                else:
                    result[numbars] = int((int(result[numbars]) / int(result['population'])) * 100000)
            else:
                if int(result[numbars]) < 0:
                    result[numbars] = -1
            geojsons.append({
                "type": "Feature",
                "id": result['osm_id'],
                "properties": {
                    "name": result['name'],
                    "numbars": int(result[numbars])
                },
                "geometry": json.loads(result['geometry'])
            })
    else:
        for result in results:
            if normalize:
                if int(result[numbars]) < 0 or int(result['population']) < 1:
                    result[numbars] = -1
                else:
                    result[numbars] = int((int(result[numbars]) / int(result['population'])) * 100000)
            else:
                if int(result[numbars]) < 0:
                    result[numbars] = -1
            geojsons.append({
                "type": "Feature",
                "id": result['osm_id'],
                "properties": {
                    "name": result['name'],
                    "numbars": int(result[numbars])
                },
                "geometry": None
            })
    app.logger.info("Geojson built")

    # return all results as a feature collection
    return jsonify({
        "type": "FeatureCollection", "features": geojsons
    }), 200


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




# WITH konstanz AS (
#     SELECT way
#     FROM planet_osm_polygon
#     WHERE admin_level='8' and name = 'Konstanz'
# )
# SELECT points.name, ST_Y(points.way) as latitude , ST_X(points.way) as longitude
# from planet_osm_point points join konstanz on st_contains(konstanz.way, points.way)
# where points.amenity in ('bar', 'pub')


#     WITH bezirke AS (
# 	SELECT osm_id, name, way AS geom, tags
# 	FROM planet_osm_polygon pop
# 	WHERE pop.admin_level = '4' and name in ('Berlin', 'Hamburg')
# 	UNION
# 	SELECT osm_id, name, ST_Union(way) AS geom, tags
# 	FROM planet_osm_polygon pop
# 	WHERE admin_level = '6'
# 	GROUP BY osm_id, name, tags
# ), bars AS (
# 	SELECT osm_id, way as geom
# 	FROM planet_osm_polygon
# 	WHERE amenity IN ('bar', 'pub')
# 	UNION
# 	SELECT osm_id, way AS geom
# 	FROM planet_osm_point
# 	WHERE amenity IN ('bar', 'pub')
# )
# SELECT c.osm_id, c.name, ST_AsGeoJSON(c.geom) AS geometry, c.tags, count(b.*) AS numbars
# FROM bezirke c LEFT JOIN bars b ON ST_Contains(c.geom, b.geom)
# GROUP BY c.osm_id, c.name, c.geom, c.tags order by name
