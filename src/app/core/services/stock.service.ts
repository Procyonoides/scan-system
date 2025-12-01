import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Stock, WarehouseStats } from '../models/stock.model';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = `${environment.apiUrl}/stocks`;

  constructor(private http: HttpClient) { }

  getStats() {
    console.log('📡 Calling:', `${this.apiUrl}/warehouse-stats`);
    return this.http.get<WarehouseStats>(`${this.apiUrl}/warehouse-stats`).pipe(
      tap(data => console.log('✅ Stats received:', data))
    );
  }

  getChartData() {
    console.log('📡 Calling:', `${this.apiUrl}/chart-data`);
    return this.http.get(`${this.apiUrl}/chart-data`).pipe(
      tap(data => console.log('✅ Chart data received:', data))
    );
  }

  getAll() {
    console.log('📡 Calling:', this.apiUrl);
    return this.http.get<Stock[]>(this.apiUrl).pipe(
      tap(data => console.log('✅ Stocks received:', data.length, 'items'))
    );
  }
}