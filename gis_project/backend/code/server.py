from flask import Flask, jsonify
from flask_cors import CORS

import psycopg2

app = Flask(__name__)
CORS(app)

@app.route('/pubs', methods=["GET", "POST"])
def pubs():
    query = """WITH konstanz AS (
    SELECT way
    FROM planet_osm_polygon
    WHERE admin_level='8' and name = 'Konstanz'
)
SELECT points.name, ST_Y(points.way) as latitude , ST_X(points.way) as longitude
from planet_osm_point points join konstanz on st_contains(konstanz.way, points.way)
where points.amenity in ('bar', 'pub')
"""
    
    with psycopg2.connect(host="database", port=5432, dbname="gis_db", user="gis_user", password="gis_pass") as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            results = cursor.fetchall()
    
    return jsonify([{'name': r[0], 'latitude': r[1], 'longitude': r[2]} for r in results]), 200
