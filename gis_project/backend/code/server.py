from flask import Flask, jsonify, escape, request
from flask_cors import CORS
import json
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
CORS(app)



@app.route('/numbars', methods=["GET", "POST"])
def get_Boundaries():
    app.logger.info(request.json)

    # GET VALUES FROM FRONTEND VIA
    # request.get_json().get('$event')

    normalize = False
    year = 2019
    birth = True
    death = False

    numbars = 'birth' if birth else 'death'

    with psycopg2.connect(host="database", port=5432, dbname="gis", user="testuser", password="testpw") as conn:
        with conn.cursor() as cursor:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(build_query(year))
                results = cursor.fetchall()

    # return jsonify([{'name': r[0], 'way': r[1]} for r in results]), 200

    app.logger.info(jsonify(results))

    # convert results to a GeoJSON
    geojsons = []
    for result in results:
        geojsons.append({
            "type": "Feature",
            "id": result['osm_id'],
            "properties": {
                "name": result['name'],
                "numbars": float(result[numbars])
            },
            "geometry": json.loads(result['geometry'])
        })
    app.logger.info("Geojson built")

    # return all results as a feature collection
    return jsonify({
        "type": "FeatureCollection", "features": geojsons
    }), 200


def build_query(year):
    app.logger.info("Build Query")

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
