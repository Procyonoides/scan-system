import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ScanShipping } from '../models/scan.model';
import { Observable } from 'rxjs';


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

  /**
   * ✅ NEW: Move Data Shipping (Pindahkan data dari shipping ke data_shipping)
   */
  moveData(): Observable<any> {
    return this.http.post(`${this.apiUrl}/move`, {});
  }

  /**
   * ✅ NEW: Print Detail (Download Excel detail)
   */
  printDetail(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/print-detail`, {
      responseType: 'blob'
    });
  }

  /**
   * ✅ NEW: Print Summary (Download Excel summary)
   */
  printSummary(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/print-summary`, {
      responseType: 'blob'
    });
  }
}
