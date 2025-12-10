import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReceivingRecord {
  original_barcode: string;
  brand: string;
  color: string;
  size: string;
  four_digit: string;
  unit: string;
  quantity: number;
  production: string;
  model: string;
  model_code: string;
  item: string;
  date_time: string;
  scan_no: number;
  username: string;
  description: string;
}

export interface ScanResponse {
  success: boolean;
  message: string;
  data: {
    scan_no: number;
    original_barcode: string;
    model: string;
    color: string;
    size: string;
    quantity: number;
    date_time: string;
    username: string;
  };
  error?: string;
}

export interface HistoryResponse {
  success: boolean;
  data: ReceivingRecord[];
}

@Injectable({
  providedIn: 'root'
})
export class ReceivingService {
  private apiUrl = `${environment.apiUrl}/receiving`;

  constructor(private http: HttpClient) { }

  /**
   * Get receiving history (last 10 records for current user)
   * ✅ Sesuai PHP: model_scan.php - fetchdatar()
   */
  getHistory(): Observable<HistoryResponse> {
    return this.http.get<HistoryResponse>(`${this.apiUrl}/history`);
  }

  /**
   * Scan barcode for receiving
   * ✅ Sesuai PHP: controller_scan.php - getscanrec()
   * @param barcode - Barcode yang di-scan
   */
  scanBarcode(barcode: string): Observable<ScanResponse> {
    return this.http.post<ScanResponse>(`${this.apiUrl}/scan`, { barcode });
  }

  /**
   * Get receiving list with pagination (untuk IT view)
   */
  getList(page = 1, limit = 10): Observable<any> {
    return this.http.get<any>(this.apiUrl, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

   /**
   * ✅ NEW: Move Data Receiving (Pindahkan data dari receiving ke data_receiving)
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