import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Stock, WarehouseStats } from '../models/stock.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = `${environment.apiUrl}/stocks`;

  constructor(private http: HttpClient) { }

  getStats() {
    return this.http.get<WarehouseStats>(`${this.apiUrl}/warehouse-stats`);
  }

  getChartData() {
    return this.http.get(`${this.apiUrl}/chart-data`);
  }

  getAll() {
    return this.http.get<Stock[]>(this.apiUrl);
  }
}
