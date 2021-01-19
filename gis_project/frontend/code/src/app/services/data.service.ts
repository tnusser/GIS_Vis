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
  public getBarDistribution(): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/numbars';

    // hard coded data
    let data = {'birth' : true, 'death' : false, 'year' : 2007, 'relative' : true , 'absolute' : false}
        return this.http.post<FeatureCollection>(url, data, httpOptions);
  }
}
