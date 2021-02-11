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

declare global {
  var oldLegend: any;
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
    let color_class_arr : string[] = []
    for (var key in this.color_class) {
      color_class_arr.push(this.color_class[key])
    }
    //console.log(color_class_arr);
    // #be64ac #8c62aa #3b4994
    // #dfb0d6 #a5add3 #5698b9
    // #e8e8e8 #ace4e4 #5ac8c8


    console.log("checkpoint remove old Legend");
    if (globalThis.oldLegend) {
      globalThis.oldLegend.remove();
      console.log("Could Remove");
    }
    else  {
      console.log("Could not Remove");
    }


    globalThis.oldLegend = new (L.Control.extend({
      options: { position: 'bottomright' }
    }));

    globalThis.oldLegend.onAdd = function () {
      if (!globalThis.rate4Back || globalThis.rate4Back == "fert" ||globalThis.rate4Back == "mort") {
        //Headline Parameter 1.
        let appendStringLegend: string;
        if(globalThis.rate4Back == "mort" ) {
          appendStringLegend="Mortality";
        }
        else {
          appendStringLegend="Fertility";
        }


      // Legend via d3
      //
      // var size = 3;
      // dataset = [];
      // colors = ["#5ac8c8", "#5698b9", "#3b4994","#ace4e4", "#a5add3", "#8c62aa","#e8e8e8", "#dfb0d6", "#be64ac"]
      // for (var y = 0; y < size; y++) {
      //   for (var x = 0; x < size; x++) {
      //     dataset.push(5);
      //   };
      // };
      // console.log(d3.select("svg"))
      // var chart = d3.select(".chart")
      // var bar = chart.selectAll("g")
      //
      //
      //
      // var svg = d3.select("svg");
      //
      // svg.selectAll("rect")
      //   .data(dataset)
      //   .enter()
      //   .append("rect")
      //   .attr("x", function(d, i) {
      //     return (i%size)*50
      //   })
      //   .attr("y", function(d, i) {
      //     return parseInt(i/size) * 50;
      //   })
      //   .attr("height", function(d) {
      //     return 50;
      //   })
      //   .attr("width", 50)
      //   .attr("fill", function(d, i) {
      //     return colors[i];
      //   })
      //   //.attr("transform", "translate(100,150) rotate(315)") //rotate(315)
      //   .attr("transform", "translate(50,50)")


      // Legend via HTML Table

      //let legend_str = "<table class='paddingBetweenCol'>"
      // let c = 0
      // for (var i = 0; i < 3; i++) {
      //   legend_str += "<tr>"
      //   for (var j = 0; j < 3; j++) {
      //     legend_str += "<th style='background: " + color_class_arr[c] + "'></th>"
      //     c += 1
      //   }
      //   legend_str += "</tr>"
      // }
      // legend_str += "</table>"
        //Headline Parameter 2.
        let appendStringLegend2: string;
        if(globalThis.norm4Back == "abs" ) {
          appendStringLegend2="Absolute";
        }
        else {
          appendStringLegend2="Normalized";
        }

        //Get Max Value out of cuurent numbars
        let maxNumbars = d3.max(
          geojson.features.map((f: Feature<Geometry, any>) => +f.properties.numbars)
        );

        if (!maxNumbars) {
          maxNumbars = 1;
        }

        //TBC morgen
        let minNumbars = d3.min(
          geojson.features.map((f: Feature<Geometry, any>) => +f.properties.numbars)
        );
    
        
        console.log("Hier , schau mich an:" + minNumbars);
        if (!minNumbars) {
          minNumbars = 1;
        }

        const colorscaleLegend = d3.scaleSequential().domain([600, maxNumbars as number]).interpolator(d3.interpolateViridis);

        //1D Legend, stating Rate, Norm or Abs, Values and Colors
        var divLegendMain = L.DomUtil.create('div', 'info legend');
        var divLegend = L.DomUtil.create('div', 'info legend');

        var legendheight = 200,
            legendwidth = 80,
            margin = {top: 10, right: 60, bottom: 10, left: 2};

       var canvas:any;
       canvas =  d3.select(divLegend)
                  .style("height", legendheight + "px")
                  .style("width", legendwidth + "px")
                  .style("position", "relative")
                  .append("canvas")
                  .attr("height", legendheight - margin.top - margin.bottom)
                  .attr("width", 1)
                  .style("height", (legendheight - margin.top - margin.bottom) + "px")
                  .style("width", (legendwidth - margin.left - margin.right) + "px")
                  .style("border", "1px solid #000")
                  .style("position", "absolute")
                  .style("top", (margin.top) + "px")
                  .style("left", (margin.left) + "px")
                  .node();

        var ctx = canvas.getContext("2d");

        var legendscale = d3.scaleLinear()
                          .range([1, legendheight - margin.top - margin.bottom])
                          .domain(colorscaleLegend.domain());

        // image data hackery
        var image = ctx.createImageData(1, legendheight);

        d3.range(legendheight).forEach(function(i) {
          var c = d3.rgb(colorscaleLegend(legendscale.invert(i)));
          image.data[4*i] = c.r;
          image.data[4*i + 1] = c.g;
          image.data[4*i + 2] = c.b;
          image.data[4*i + 3] = 255;
        });
        ctx.putImageData(image, 0, 0);

        var legendaxis = d3.axisRight(legendscale)
                          .tickSize(6)
                          .ticks(8);

        //append legend to previously creted Div
        var svg = d3.select(divLegend)
          .append("svg")
          .attr("height", (legendheight) + "px")
          .attr("width", (legendwidth) + "px")
          .style("position", "absolute")
          .style("left", "0px")
          .style("top", "0px")

        svg
          .append("g")
          .attr("class", "axis")
          .attr("transform", "translate(" + (legendwidth - margin.left - margin.right + 3) + "," + (margin.top) + ")")
          .call(legendaxis);

        var divText = `<h2>${appendStringLegend2} <br>${appendStringLegend}-Rate</h2>
                      <p>${appendStringLegend2 =="Normalized" ? '(per 100 000 inhabitants)':''}</p>`;
        // return Div created
        // cast the DOM-element for string "div" to be properly displayed
        var forms = L.DomUtil.create('form', 'my-form');
        forms.innerHTML = divText;

        // put created elements into one div and visualize it
        divLegendMain.append(forms);
        divLegendMain.append(divLegend);
        divLegendMain.style.backgroundColor = "white";
        return divLegendMain;
      }
      else {
        //Tobias here. append pic to div. Else not removed
        //2D legend, stating vlaues and colors
        var div = L.DomUtil.create('div', 'info legend_bivariate')
        let legend_str = "<img src=assets/bivariate.png width='200' height='200' alt='Could not load legend'/>"
        div.innerHTML = legend_str;
        return div;
      }
    };
    globalThis.oldLegend.addTo(this.map);

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

    //TBC morgen -- ignore -1
    let min = d3.min(
      geojson.features.map((f: Feature<Geometry, any>) => +f.properties.numbars)
    );

    if (!min) {
      min = 1;
    }
    // if max is undefined, enforce max = 1
    if (!max) {
      max = 1;
    }
    if (!min) {
      min = 1;
    }

    const colorscale = d3
      .scaleSequential()
      .domain([600, max])
      .interpolator(d3.interpolateViridis);

    // each feature has a custom style
    const style = (feature: Feature<Geometry, any> | undefined) => {
      const numbars = feature?.properties?.numbars
        ? feature.properties.numbars
        : 0;
      if(!globalThis.rate4Back || globalThis.rate4Back == "fert" ||globalThis.rate4Back == "mort") {
        // console.log(numbars);
        if(numbars == -1) {
          return {
            fillColor: 'white',
            weight: 2,
            opacity: 1,
            color: 'grey',
            dashArray: '3',
            fillOpacity: 0.3,
          };
        }
        else {
          return {
            fillColor: colorscale(numbars),
            //fillColor: this.color_class[feature?.properties.dual],
            weight: 2,
            opacity: 1,
            color: 'grey',
            dashArray: '3',
            fillOpacity: 0.7,
          };
        }
      }
      else {
        if(numbars == -1) {
          return {
            fillColor: 'white',
            weight: 2,
            opacity: 1,
            color: 'grey',
            dashArray: '3',
            fillOpacity: 0.3,
          } }
          else {
            return {
              //fillColor: colorscale(numbars),
              fillColor: this.color_class[feature?.properties.dual],
              weight: 2,
              opacity: 1,
              color: 'grey',
              dashArray: '3',
              fillOpacity: 0.7,
            }
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
        let bipPerCapita               : number = Math.round(bipNumberDependingOnYear/population);
        //console.log(population);

        var div = `<h1>${feature.properties.name}</h1>
        <p>${birthNumberDependingOnYear == -1 ? `${feature.properties.name} had no birth-data available`:`${feature.properties.name} had ${birthNumberDependingOnYear} birth${birthNumberDependingOnYear > 0 ? 's' : ''}`}
        and ${deathNumberDependingOnYear ==-1 ? `there was no death-data` :`${deathNumberDependingOnYear} death${deathNumberDependingOnYear > 0 ? 's' : ''}`} in ${dateValue}.
        ${bipPerCapita < 0? `GDP-Data for ${feature.properties.name} in ${dateValue} is not available.`
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
                      .key(function (d : any){return d.yVal;})
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
