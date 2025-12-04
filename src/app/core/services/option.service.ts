import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

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
    return this.http.get<Model[]>(`${this.apiUrl}/models`);
  }

  addModel(data: { model_code: string; model: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/models`, data);
  }

  updateModel(model_code: string, data: { model: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/models/${model_code}`, data);
  }

  deleteModel(model_code: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/models/${model_code}`);
  }

  // ==================== SIZE CRUD ====================
  
  getSizes(): Observable<Size[]> {
    return this.http.get<Size[]>(`${this.apiUrl}/sizes`);
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
    return this.http.get<Production[]>(`${this.apiUrl}/productions`);
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