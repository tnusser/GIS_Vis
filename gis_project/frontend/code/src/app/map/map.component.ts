import { Component, Input, OnInit, EventEmitter, Output  } from '@angular/core';
import { Feature, FeatureCollection, Geometry, MultiPolygon } from 'geojson';
import * as L from 'leaflet';
import * as d3 from 'd3';
import { svg } from 'd3';

declare global {
  var oldGEOJSON: any;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {

  private color_class : {[index: string]:string} = {"A3": "#5ac8c8", "B3" : "#5698b9", "C3" : "#3b4994",
    "A2": "#ace4e4", "B2" : "#a5add3", "C2" : "#8c62aa",
    "A1": "#c7bebe", "B1" : "#dfb0d6", "C1" : "#be64ac"}

  private geometry_list: Array<Geometry> = [];
  private initialized: boolean = false;

  private map!: L.Map;
  private amenitiesLayer: L.LayerGroup<any> = L.layerGroup();

  private _amenities: {
    name: string;
    latitude: number;
    longitude: number;
  }[] = [];

  get amenities(): { name: string; latitude: number; longitude: number }[] {
    return this._amenities;
  }

  @Output()
  viewUpdate: EventEmitter<boolean> = new EventEmitter<boolean>();

  updateSlider(): void {
    //console.log(this.mySlider1.nativeElement.innerHTML);
    //console.log(document.getElementById("myRange").value);
    console.log((<HTMLInputElement>document.getElementById("myRange")).value);
    //TBC
    this.viewUpdate.emit(true);
  }

  displayValue(): void {
    //console.log(document.getElementById("myRange").value);
    //TBC
    //document.getElementById("bubbles").innerHTML = document.getElementById("myRange").value;
    (<HTMLInputElement>document.getElementById("bubbles")).innerHTML = (<HTMLInputElement>document.getElementById("myRange")).value
  }

  /**
   * Often divs and other HTML element are not available in the constructor. Thus we use onInit()
   */
  ngOnInit(): void {
    // some settings for a nice shadows, etc.
    const iconRetinaUrl = './assets/marker-icon-2x.png';
    const iconUrl = './assets/marker-icon.png';
    const shadowUrl = './assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });

    L.Marker.prototype.options.icon = iconDefault;

    // basic setup, create a map in the div with the id "map"
    this.map = L.map('map').setView([ 51.1642, 10.4541], 6.5);

    // set a tilelayer, e.g. a world map in the background
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);



    let color_class_arr : string[] = []
    for (var key in this.color_class) {
      color_class_arr.push(this.color_class[key])
    }
    console.log(color_class_arr);
    // #be64ac #8c62aa #3b4994
    // #dfb0d6 #a5add3 #5698b9
    // #e8e8e8 #ace4e4 #5ac8c8


    var legend = new (L.Control.extend({
      options: { position: 'bottomright' }
    }));

    legend.onAdd = function () {

      var div = L.DomUtil.create('div', 'info legend_bivariate')
      let legend_str = "<table class='paddingBetweenCol'>"
      let c = 0
      for (var i = 0; i < 3; i++) {
        legend_str += "<tr>"
        for (var j = 0; j < 3; j++) {
          legend_str += "<th style='background: " + color_class_arr[c] + "'></th>"
          c += 1
        }
        legend_str += "</tr>"
      }
      legend_str += "</table>"

      div.innerHTML = legend_str
      return div;
    };


    legend.addTo(this.map);
  }

  /**
   * Add a GeoJSON FeatureCollection to this map
   * @param latitude
   */
  public addGeoJSON(geojson: FeatureCollection): void {

    // find maximum numbars value in array
    // console.log(geojson["features"][0]["type"])
    if (!this.initialized || this.geometry_list.length == 0) {
      for (let item of geojson["features"]) {
        this.geometry_list.push(item["geometry"])
      }
      console.log("initialized")
      this.initialized = true;
    } else {
      console.log("load geom from stored list")
      for (let i=0; i < geojson["features"].length; i++) {
        geojson["features"][i]["geometry"] = this.geometry_list[i];
      }
    }

    console.log("checkpoint remove old");
    if (globalThis.oldGEOJSON) {
      globalThis.oldGEOJSON.removeFrom(this.map);
    }
    else  {
      console.log("checkpoint undefined")
    }


    let max = d3.max(
      geojson.features.map((f: Feature<Geometry, any>) => +f.properties.numbars)
    );

    // if max is undefined, enforce max = 1
    if (!max) {
      max = 1;
    }

    const colorscale = d3
      .scaleSequential()
      .domain([0, max])
      .interpolator(d3.interpolateViridis);

    // each feature has a custom style
    const style = (feature: Feature<Geometry, any> | undefined) => {
      const numbars = feature?.properties?.numbars
        ? feature.properties.numbars
        : 0;

      // console.log(numbars);
      if(numbars == -1) {
        return {
          fillColor: 'white',
          weight: 2,
          opacity: 1,
          color: 'grey',
          dashArray: '3',
          fillOpacity: 0.7,
        };
      }
      else {
        return {
          fillColor: this.color_class[feature?.properties.dual],
          weight: 2,
          opacity: 1,
          color: 'grey',
          dashArray: '3',
          fillOpacity: 0.7,
        };
      }
    };

    // each feature gets an additional popup!
    const onEachFeature = (feature: Feature<Geometry, any>, layer: L.Layer) => {
      if (
        feature.properties &&
        feature.properties.name &&
        typeof feature.properties.numbars !== 'undefined'
      ) {
        var div = `<h1>${feature.properties.name}</h1>
                   <p>${feature.properties.name} had ${feature.properties.numbars} birth${feature.properties.numbars > 0 ? 's' : ''}</p>
                   <div id="try"></div>`;

        var svg = d3.select('[id="try"]')
            .append("svg")
            .attr("width", 200)
            .attr("height", 200);

            svg.append('circle')
            .attr('cx', 100)
            .attr('cy', 100)
            .attr('r', 50)
            .attr('stroke', 'black')
            .attr('fill', '#69a3b2');


            layer.bindPopup(div);
      }
    };



    // create one geoJSON layer and add it to the map
    const geoJSON = L.geoJSON(geojson, {
      onEachFeature,
      style,
    });
    globalThis.oldGEOJSON = geoJSON;
    console.log("checkpoint add new");
    geoJSON.addTo(this.map);

    //console.log(globalThis.oldGEOJSON);
  }

  public removeOldGeo(geojson: FeatureCollection): void {
    console.log('tried remove');
  //  this.map.removeLayer(geojson);
  }
}
