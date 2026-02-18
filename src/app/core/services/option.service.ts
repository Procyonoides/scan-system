import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap, catchError } from 'rxjs';
import { throwError } from 'rxjs';

// Interfaces
export interface Model {
  model_code: string;
  model: string;
}

export interface Size {
  size_code: string;
  size: string;
}

export interface Production {
  production_code: string;
  production: string;
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
export class OptionService {
  private apiUrl = `${environment.apiUrl}/options`;

  constructor(private http: HttpClient) { }

  // ==================== MODEL CRUD ====================

  getModels(page: number = 1, limit: number = 10, search: string = ''): Observable<PaginationResponse<Model>> {
    console.log('📡 Fetching models from:', `${this.apiUrl}/models`, { page, limit, search });

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginationResponse<Model>>(`${this.apiUrl}/models`, { params }).pipe(
      tap(response => console.log('✅ Models received:', response)),
      catchError(err => {
        console.error('❌ Get models error:', err);
        return throwError(() => err);
      })
    );
  }

  addModel(data: { model_code: string; model: string }): Observable<any> {
    console.log('📤 Adding model:', data);
    return this.http.post(`${this.apiUrl}/models`, data).pipe(
      tap(response => console.log('✅ Model added:', response)),
      catchError(err => {
        console.error('❌ Add model error:', err);
        return throwError(() => err);
      })
    );
  }

  updateModel(model_code: string, data: { model: string }): Observable<any> {
    console.log('📤 Updating model:', model_code, data);
    return this.http.put(`${this.apiUrl}/models/${model_code}`, data).pipe(
      tap(response => console.log('✅ Model updated:', response)),
      catchError(err => {
        console.error('❌ Update model error:', err);
        return throwError(() => err);
      })
    );
  }

  deleteModel(model_code: string): Observable<any> {
    console.log('📤 Deleting model:', model_code);
    return this.http.delete(`${this.apiUrl}/models/${model_code}`).pipe(
      tap(response => console.log('✅ Model deleted:', response)),
      catchError(err => {
        console.error('❌ Delete model error:', err);
        return throwError(() => err);
      })
    );
  }

  batchDeleteModels(codes: string[]): Observable<any> {
    console.log('📤 Batch deleting models:', codes);
    return this.http.post(`${this.apiUrl}/models/batch-delete`, { codes }).pipe(
      tap(response => console.log('✅ Models batch deleted:', response)),
      catchError(err => {
        console.error('❌ Batch delete models error:', err);
        return throwError(() => err);
      })
    );
  }

  // ==================== SIZE CRUD ====================

  getSizes(page: number = 1, limit: number = 10, search: string = ''): Observable<PaginationResponse<Size>> {
    console.log('📡 Fetching sizes from:', `${this.apiUrl}/sizes`, { page, limit, search });

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginationResponse<Size>>(`${this.apiUrl}/sizes`, { params }).pipe(
      tap(response => console.log('✅ Sizes received:', response)),
      catchError(err => {
        console.error('❌ Get sizes error:', err);
        return throwError(() => err);
      })
    );
  }

  addSize(data: { size_code: string; size: string }): Observable<any> {
    console.log('📤 Adding size:', data);
    return this.http.post(`${this.apiUrl}/sizes`, data).pipe(
      tap(response => console.log('✅ Size added:', response)),
      catchError(err => {
        console.error('❌ Add size error:', err);
        return throwError(() => err);
      })
    );
  }

  updateSize(size_code: string, data: { size: string }): Observable<any> {
    console.log('📤 Updating size:', size_code, data);
    return this.http.put(`${this.apiUrl}/sizes/${size_code}`, data).pipe(
      tap(response => console.log('✅ Size updated:', response)),
      catchError(err => {
        console.error('❌ Update size error:', err);
        return throwError(() => err);
      })
    );
  }

  deleteSize(size_code: string): Observable<any> {
    console.log('📤 Deleting size:', size_code);
    return this.http.delete(`${this.apiUrl}/sizes/${size_code}`).pipe(
      tap(response => console.log('✅ Size deleted:', response)),
      catchError(err => {
        console.error('❌ Delete size error:', err);
        return throwError(() => err);
      })
    );
  }

  batchDeleteSizes(codes: string[]): Observable<any> {
    console.log('📤 Batch deleting sizes:', codes);
    return this.http.post(`${this.apiUrl}/sizes/batch-delete`, { codes }).pipe(
      tap(response => console.log('✅ Sizes batch deleted:', response)),
      catchError(err => {
        console.error('❌ Batch delete sizes error:', err);
        return throwError(() => err);
      })
    );
  }

  // ==================== PRODUCTION CRUD ====================

  getProductions(page: number = 1, limit: number = 10, search: string = ''): Observable<PaginationResponse<Production>> {
    console.log('📡 Fetching productions from:', `${this.apiUrl}/productions`, { page, limit, search });

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginationResponse<Production>>(`${this.apiUrl}/productions`, { params }).pipe(
      tap(response => console.log('✅ Productions received:', response)),
      catchError(err => {
        console.error('❌ Get productions error:', err);
        return throwError(() => err);
      })
    );
  }

  addProduction(data: { production_code: string; production: string }): Observable<any> {
    console.log('📤 Adding production:', data);
    return this.http.post(`${this.apiUrl}/productions`, data).pipe(
      tap(response => console.log('✅ Production added:', response)),
      catchError(err => {
        console.error('❌ Add production error:', err);
        return throwError(() => err);
      })
    );
  }

  updateProduction(production_code: string, data: { production: string }): Observable<any> {
    console.log('📤 Updating production:', production_code, data);
    return this.http.put(`${this.apiUrl}/productions/${production_code}`, data).pipe(
      tap(response => console.log('✅ Production updated:', response)),
      catchError(err => {
        console.error('❌ Update production error:', err);
        return throwError(() => err);
      })
    );
  }

  deleteProduction(production_code: string): Observable<any> {
    console.log('📤 Deleting production:', production_code);
    return this.http.delete(`${this.apiUrl}/productions/${production_code}`).pipe(
      tap(response => console.log('✅ Production deleted:', response)),
      catchError(err => {
        console.error('❌ Delete production error:', err);
        return throwError(() => err);
      })
    );
  }

  batchDeleteProductions(codes: string[]): Observable<any> {
    console.log('📤 Batch deleting productions:', codes);
    return this.http.post(`${this.apiUrl}/productions/batch-delete`, { codes }).pipe(
      tap(response => console.log('✅ Productions batch deleted:', response)),
      catchError(err => {
        console.error('❌ Batch delete productions error:', err);
        return throwError(() => err);
      })
    );
  }
}