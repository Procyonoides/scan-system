import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Stock, WarehouseStats } from '../models/stock.model';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = `${environment.apiUrl}/stocks`;

  constructor(private http: HttpClient) { }

  /**
   * Get warehouse statistics
   */
  getStats() {
    console.log('📡 Calling:', `${this.apiUrl}/warehouse-stats`);
    return this.http.get<WarehouseStats>(`${this.apiUrl}/warehouse-stats`).pipe(
      tap(data => console.log('✅ Stats received:', data)),
      catchError(err => {
        console.error('❌ Stats error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Get chart data for last 7 days
   */
  getChartData() {
    console.log('📡 Calling:', `${this.apiUrl}/chart-data`);
    return this.http.get(`${this.apiUrl}/chart-data`).pipe(
      tap(data => console.log('✅ Chart data received:', data)),
      catchError(err => {
        console.error('❌ Chart data error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Get all stocks with pagination and filters
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @param search - Search term (optional)
   * @param status - Status filter (optional): AVAILABLE, LOW_STOCK, OUT_OF_STOCK
   */
  getAll(page = 1, limit = 10, search = '', status = '') {
    console.log('📡 Calling getAll:', this.apiUrl, { page, limit, search, status });
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    
    if (status && status.trim() !== '') {
      params = params.set('status', status.trim());
    }

    console.log('📋 Request params:', params.toString());

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap(data => {
        const count = data.data ? data.data.length : (Array.isArray(data) ? data.length : 0);
        const total = data.pagination ? data.pagination.total : count;
        console.log('✅ Stocks received:', count, 'items (Total:', total, ')');
      }),
      catchError(err => {
        console.error('❌ Get stocks error:', {
          status: err.status,
          message: err.message,
          error: err.error
        });
        return throwError(() => err);
      })
    );
  }

  /**
   * Get specific stock by no (primary key)
   */
  getByNo(no: number) {
    console.log('📡 Calling:', `${this.apiUrl}/${no}`);
    return this.http.get<Stock>(`${this.apiUrl}/${no}`).pipe(
      tap(data => console.log('✅ Stock detail received:', data)),
      catchError(err => {
        console.error('❌ Get stock detail error:', err);
        return throwError(() => err);
      })
    );
  }
}