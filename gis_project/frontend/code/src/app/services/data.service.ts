import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FeatureCollection } from 'geojson';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}

  /**
   * Get Pubs from Backend
   */
  public getBarDistribution(date:number, normDec:string, rateDec:string): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/numbars';

    var dataAbs: any;
    var dataRate: any;
    var dataDate: any;

    // handle undefined case

    if (!normDec) { //if undefined
      dataAbs = {'relative':true, 'absolute' : false };
    }
    else if (normDec=="abs") {
      dataAbs = {'relative':false, 'absolute' : true };
    }
    else {
      dataAbs = {'relative':true, 'absolute' : false };
    }

    if (!rateDec) { //if undefined
      dataRate = {'birth' : true, 'death' : false};
    }
    else if (rateDec=="fert") {
      dataRate = {'birth' : true, 'death' : false};
    }
    else if (rateDec=="mort"){
      dataRate = {'birth' : false, 'death' : true};
    }
    else {
      dataRate = {'birth' : true, 'death' : true};
    }

    dataDate = {'year': date};

    let data = {
      ...dataRate,
      ...dataDate,
      ...dataAbs
    };

    //console.log(dataRate);
    //console.log(data);
    //let data = {'birth' : true, 'death' : false, 'year' : date, 'relative' : true , 'absolute' : false}
       return this.http.post<FeatureCollection>(url, data, httpOptions);
  }
}
