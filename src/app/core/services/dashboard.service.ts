import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface WarehouseStats {
  first_stock: number;
  receiving: number;
  shipping: number;
  warehouse_stock: number;
}

export interface DailyChartData {
  date: string;
  receiving: number;
  shipping: number;
}

export interface ShiftScanData {
  username: string;
  total: number;
  percent: number;
  status: number;
}

export interface WarehouseItem {
  item: string;
  total: number;
  status: number;
}

export interface ScanRecord {
  date_time: string;
  original_barcode: string;
  model: string;
  color: string;
  size: string;
  quantity: number;
  username: string;
  scan_no: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) { }

  getWarehouseStats() {
    return this.http.get<WarehouseStats>(`${this.apiUrl}/warehouse-stats`);
  }

  getDailyChart() {
    return this.http.get<DailyChartData[]>(`${this.apiUrl}/daily-chart`);
  }

  getShiftScan() {
    return this.http.get<ShiftScanData[]>(`${this.apiUrl}/shift-scan`);
  }

  getWarehouseItems() {
    return this.http.get<WarehouseItem[]>(`${this.apiUrl}/warehouse-items`);
  }

  getReceivingList() {
    return this.http.get<ScanRecord[]>(`${this.apiUrl}/receiving-list`);
  }

  getShippingList() {
    return this.http.get<ScanRecord[]>(`${this.apiUrl}/shipping-list`);
  }
}