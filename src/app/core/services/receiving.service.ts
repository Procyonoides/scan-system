import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ScanReceiving } from '../models/scan.model';

@Injectable({
  providedIn: 'root'
})
export class ReceivingService {
  private apiUrl = `${environment.apiUrl}/receiving`;

  constructor(private http: HttpClient) { }
  getList(page = 1, limit = 10) {
    return this.http.get<ScanReceiving[]>(this.apiUrl, {
      params: { page, limit }
    });
  }

  recordScan(data: ScanReceiving) {
    return this.http.post(`${this.apiUrl}/scan`, data);
  }
}
