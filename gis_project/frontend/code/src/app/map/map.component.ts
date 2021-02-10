import { Component, Input, OnInit, EventEmitter, Output  } from '@angular/core';
import { Feature, FeatureCollection, Geometry, MultiPolygon } from 'geojson';
import * as L from 'leaflet';
import * as d3 from 'd3';
import {nest} from 'd3-collection';
import { svg } from 'd3';

export type DataType = {year:any, zVal:any};
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

    let color_class = {"A1": "#e8e8e8", "B1" : "#dfb0d6", "C1" : "#be64ac",
                         "A2": "#ace4e4", "B2" : "#a5add3", "C2" : "#8c62aa",
                          "A3": "#5ac8c8", "B3" : "#5698b9", "C3" : "#3b4994"}

    // #be64ac #8c62aa #3b4994
    // #dfb0d6 #a5add3 #5698b9
    // #e8e8e8 #ace4e4 #5ac8c8


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
        var mainElement = <HTMLDivElement>(document.createElement('div'));
        var elem = <HTMLDivElement>(document.createElement('div'));

        let dateValue=(<HTMLInputElement>document.getElementById("myRange")).value;
        
        let timeRange : number[] = [1995,1996,1997,1998,1999,2000,
          2001,2002,2003,2004,2005,2006,
          2007,2008,2009,2010,2011,2012,
          2013,2014,2015,2016,2017,2018,2019];

        let dataDeath: number[] = feature.properties.death;
        let dataBirth: number[] = feature.properties.birth;
        let dataBIP  : number[] = feature.properties.bip;
        let dataPop  : number[] = feature.properties.pop;
        
        function checkIndex(age:any) {
          return age == dateValue;
        }
        //get Data out of Array to denote current Year
        let indexToSearch = timeRange.findIndex(checkIndex);

        let birthNumberDependingOnYear : number = dataBirth[indexToSearch]; 
        let deathNumberDependingOnYear : number = dataDeath[indexToSearch];
        let bipNumberDependingOnYear   : number = dataBIP[indexToSearch];
        let population                 : number = dataPop[indexToSearch]; 
        let bipPerCapita               : number = bipNumberDependingOnYear/population;
        
        //console.log(population);

        var div = `<h1>${feature.properties.name}</h1>
        <p>${birthNumberDependingOnYear == -1 ? `${feature.properties.name} had no birth-data available`:`${feature.properties.name} had ${birthNumberDependingOnYear} birth${birthNumberDependingOnYear > 0 ? 's' : ''}`}
        and ${deathNumberDependingOnYear ==-1 ? `there was no death-data` :`${deathNumberDependingOnYear} death${deathNumberDependingOnYear > 0 ? 's' : ''}`} in ${dateValue}.
        ${bipNumberDependingOnYear == -1? `GDP-Data for ${feature.properties.name} in ${dateValue} is not available.`
        : `The GDP per capita of ${feature.properties.name} in ${dateValue} accounted to ${bipPerCapita} Euros.`}</p>`;
        
        
        var data = [];
        for(var i=0;i<timeRange.length;i++){
          data.push({year:timeRange[i], yVal:"birth",zVal:dataBirth[i], color:"red"});
          data.push({year:timeRange[i], yVal:"death",zVal:dataDeath[i], color:"black"});
        }                          

        var leftMargin=70;
        var topMargin=30;

        /*var parseTime = d3.timeParse("%Y");

        data.forEach(function (d) {
           d.year = parseTime(d.year);
        });
*/
        // xAxis
        var xScale = d3.scaleTime().domain([1995 as number, 2019 as number]).range([leftMargin, 450])

        // yAxis
        var yMax=d3.max(data,d=>d.zVal as number)
        var yMin=d3.min(data,d=>d.zVal as number)
        var yScale = d3.scaleLinear().domain([yMin as number, yMax as number+200 as number]).range([400, 0])

        var xAxis = d3.axisBottom(xScale)
                      .tickValues(timeRange)
                      .tickFormat(d3.format("d"));

        var yAxis = d3.axisLeft(yScale)
                      .ticks(10);

        // create SVGs and append Axis
        var svg = d3.select(elem)
            .append("svg")
            .attr("width", 500)
            .attr("height", 500);

        svg.append("g")
           .attr("class", "axis")
           .attr("transform", `translate(0,420)`)
           .call(xAxis)
           .selectAll("text")
           .attr("y", 0)
           .attr("x", 9)
           .attr("dy", ".35em")
           .attr("transform", "rotate(90)")
           .style("text-anchor", "start");
        
        //label of x Axis  
        svg.append("text")
           .attr("transform", "translate(250,465)")
           .attr("text-anchor", "end")
           .text("Year");

        //append y-Axis
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(${leftMargin},20)`) //use variable in translate
            .call(yAxis);
            
        //var rotateTranslate = d3.svg.transform().rotate(-45).translate(200, 100);  
        //Append y-Axis Label
        svg.append("text")
            .attr("transform", "translate(25,300) rotate(-90)" )
            .style("text-anchor", "middle")
            .text("Number of Births/Deaths");
    
    
        interface getTheData {
              year: number;
              yVal: string;
              zVal: number;
              color: string;
          }
        //use .nest()function to group data so the line can be computed for each group
        var sumstat = nest<getTheData>() 
                      .key(function (d){return d.yVal;})
                      .entries(data);
        
                      //console.log(sumstat);

        //append line
        svg.selectAll(".line")
          .append("g")
          .attr("class", "line")
          .data(sumstat)
          .enter()
          .append("path")
          .attr("d", function (d) {
            return d3.line<getTheData>()
                .x(d => xScale(d.year))
                .y(d => yScale(d.zVal))
                .curve(d3.curveCardinal)
                (d['values'])
             })
          .attr("fill", "none")
          .attr("stroke", function(d:any){return d.key=="death" ? "black": "red"})
          .attr("stroke-width", 2);

        //append Legend Birth         
        svg.append("circle")
            .attr("cx", 440)
            .attr('cy', 10)
            .attr("r", 6)
            .style("fill", "red")//d => color(d.key

        svg.append("text")
            .attr("x", 450)
            .attr("y",15)
            .text("Birth")
        
            
        //append Legend Death
        svg.append("circle")
            .attr("cx", 440)
            .attr('cy', 25)
            .attr("r", 6)
            .style("fill", "black")//d => color(d.key
        svg.append("text")
            .attr("x", 450)
            .attr("y", 30)
            .text("Death")
  
  
            
        // cast the DOM-element for string "div" to be properly displayed
        var form = L.DomUtil.create('form', 'my-form');
        form.innerHTML = div;

        // put created elements into one div and visualize it
        mainElement.append(form);
        mainElement.append(elem);
        layer.bindPopup(mainElement, {maxWidth : 550, maxHeight: 570});
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
