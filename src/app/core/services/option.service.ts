import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class OptionService {
  private apiUrl = `${environment.apiUrl}/options`;

  constructor(private http: HttpClient) { }

  // ==================== MODEL CRUD ====================
  
  getModels(): Observable<Model[]> {
    console.log('📡 Fetching models from:', `${this.apiUrl}/models`);
    return this.http.get<Model[]>(`${this.apiUrl}/models`).pipe(
      tap(data => console.log('✅ Models received:', data)),
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

  // ==================== SIZE CRUD ====================
  
  getSizes(): Observable<Size[]> {
    console.log('📡 Fetching sizes from:', `${this.apiUrl}/sizes`);
    return this.http.get<Size[]>(`${this.apiUrl}/sizes`).pipe(
      tap(data => console.log('✅ Sizes received:', data)),
      catchError(err => {
        console.error('❌ Get sizes error:', err);
        return throwError(() => err);
      })
    );
  }

  addSize(data: { size_code: string; size: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/sizes`, data);
  }

  updateSize(size_code: string, data: { size: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/sizes/${size_code}`, data);
  }

  deleteSize(size_code: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sizes/${size_code}`);
  }

  // ==================== PRODUCTION CRUD ====================
  
  getProductions(): Observable<Production[]> {
    console.log('📡 Fetching productions from:', `${this.apiUrl}/productions`);
    return this.http.get<Production[]>(`${this.apiUrl}/productions`).pipe(
      tap(data => console.log('✅ Productions received:', data)),
      catchError(err => {
        console.error('❌ Get productions error:', err);
        return throwError(() => err);
      })
    );
  }

  addProduction(data: { production_code: string; production: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/productions`, data);
  }

  updateProduction(production_code: string, data: { production: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/productions/${production_code}`, data);
  }

  deleteProduction(production_code: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/productions/${production_code}`);
  }
}