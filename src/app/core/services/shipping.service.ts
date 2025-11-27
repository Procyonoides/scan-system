import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ScanShipping } from '../models/scan.model';


@Injectable({
  providedIn: 'root'
})
export class ShippingService {
  private apiUrl = `${environment.apiUrl}/shipping`;

  constructor(private http: HttpClient) { }
  getList(page = 1, limit = 10) {
    return this.http.get<ScanShipping[]>(this.apiUrl, {
      params: { page, limit }
    });
  }

  recordScan(data: ScanShipping) {
    return this.http.post(`${this.apiUrl}/scan`, data);
  }
}
