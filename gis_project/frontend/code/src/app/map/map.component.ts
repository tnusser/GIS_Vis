import { Component, Input, OnInit, EventEmitter, Output  } from '@angular/core';
import { Feature, FeatureCollection, Geometry, MultiPolygon } from 'geojson';
import * as L from 'leaflet';
import * as d3 from 'd3';


declare global {
  var oldGEOJSON: any;
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {

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
          color: 'red',
          dashArray: '3',
          fillOpacity: 0.7,
        };
      }
      else {
        return {
          fillColor: colorscale(numbars),
          weight: 2,
          opacity: 1,
          color: 'red',
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
        layer.bindPopup(
          //TBC if
          `${feature.properties.name} has ${feature.properties.numbars} birth${
            feature.properties.numbars > 0 ? 's' : ''
          }`
        );
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
