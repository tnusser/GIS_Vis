import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FeatureCollection } from 'geojson';
import { MapComponent } from './map/map.component';
import { DataService } from './services/data.service';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {

  @ViewChild(MapComponent) mapcomponent!: MapComponent;

  /*
   * Services or other dependencies are often imported via dependency injection.
   * See https://angular.io/guide/dependency-injection for more details.
   */
  constructor(private dataservice: DataService) {}

  ngAfterViewInit(): void {
    console.log('ViewInit');
    
    (<HTMLInputElement>document.getElementById("bubbles")).innerHTML = "2007";

    this.dataservice.getBarDistribution(2007, "norm" ,"fert").subscribe((geojson: FeatureCollection) => {
      console.log("Data retrieved from backend")
      this.mapcomponent.addGeoJSON(geojson);
    });
  }

  updateView(): void {
    console.log('updateView with: ');

    let dateValue=(<HTMLInputElement>document.getElementById("myRange")).value;
    console.log('date' + dateValue);

    console.log("norm " + globalThis.norm4Back);
    console.log('rate is ' + globalThis.rate4Back);
  
    this.dataservice.getBarDistribution(+dateValue, globalThis.norm4Back, globalThis.rate4Back).subscribe((geojson: FeatureCollection) => {
      console.log("Data retrieved from backend");
      this.mapcomponent.addGeoJSON(geojson);
    });
  }
}
