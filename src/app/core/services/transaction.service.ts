import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap, catchError } from 'rxjs';
import { throwError } from 'rxjs';

export interface Transaction {
  no: number;
  stock_awal: number;
  receiving: number;
  shipping: number;
  stock_akhir: number;
  date: string;
}

export interface PaginationResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) { }

  /**
   * Get all transactions with pagination
   */
  getAll(page: number = 1, limit: number = 10, search: string = ''): Observable<PaginationResponse<Transaction>> {
    console.log('📡 Fetching transactions from:', this.apiUrl, { page, limit, search });
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginationResponse<Transaction>>(this.apiUrl, { params }).pipe(
      tap(response => console.log('✅ Transactions received:', response)),
      catchError(err => {
        console.error('❌ Get transactions error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Get single transaction detail
   */
  getById(no: number): Observable<{ success: boolean; data: Transaction }> {
    console.log('📡 Fetching transaction:', no);
    return this.http.get<{ success: boolean; data: Transaction }>(`${this.apiUrl}/${no}`).pipe(
      tap(response => console.log('✅ Transaction detail received:', response)),
      catchError(err => {
        console.error('❌ Get transaction detail error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Update transaction (IT only)
   */
  update(no: number, data: Partial<Transaction>): Observable<any> {
    console.log('📤 Updating transaction:', no, data);
    return this.http.put(`${this.apiUrl}/${no}`, data).pipe(
      tap(response => console.log('✅ Transaction updated:', response)),
      catchError(err => {
        console.error('❌ Update transaction error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Delete transaction (IT only)
   */
  delete(no: number): Observable<any> {
    console.log('📤 Deleting transaction:', no);
    return this.http.delete(`${this.apiUrl}/${no}`).pipe(
      tap(response => console.log('✅ Transaction deleted:', response)),
      catchError(err => {
        console.error('❌ Delete transaction error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Export transactions to Excel
   */
  exportExcel(): Observable<Blob> {
    console.log('📤 Exporting transactions to Excel...');
    return this.http.get(`${this.apiUrl}/export/excel`, { 
      responseType: 'blob' 
    }).pipe(
      tap(() => console.log('✅ Excel export completed')),
      catchError(err => {
        console.error('❌ Export error:', err);
        return throwError(() => err);
      })
    );
  }
}