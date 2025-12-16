import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface MonthlyReportData {
  no: number;
  production: string;
  brand: string;
  model: string;
  color: string;
  size: string;
  description: string;
  total: number;
}

interface FilterOptions {
  models: { model_code: string; model: string }[];
  colors: string[];
  sizes: string[];
  users: string[];
}

@Component({
  selector: 'app-monthly-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monthly-report.component.html',
  styleUrl: './monthly-report.component.scss'
})
export class MonthlyReportComponent implements OnInit {
  Math = Math;

  filters = {
    tipe: '',
    model: '',
    color: '',
    size: '',
    user: '',
    tanggal1: '',
    tanggal2: ''
  };

  reportData: MonthlyReportData[] = [];
  filteredData: MonthlyReportData[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  totalItems: number = 0;
  grandTotal: number = 0;

  filterOptions: FilterOptions = {
    models: [],
    colors: [],
    sizes: [],
    users: []
  };

  isLoading = false;
  isExporting = false;
  errorMessage = '';
  successMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadFilterOptions();
    // Set default date range (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.filters.tanggal1 = firstDay.toISOString().split('T')[0];
    this.filters.tanggal2 = lastDay.toISOString().split('T')[0];
  }

  loadFilterOptions() {
    this.http.get<any>(`${environment.apiUrl}/reports/filter-options`).subscribe({
      next: (response) => {
        if (response.success) {
          this.filterOptions = {
            models: response.models || [],
            colors: response.colors || [],
            sizes: response.sizes || [],
            users: response.users || []
          };
          console.log('✅ Filter options loaded:', this.filterOptions);
        }
      },
      error: (err) => {
        console.error('❌ Failed to load filter options:', err);
        this.errorMessage = 'Failed to load filter options';
      }
    });
  }

  loadReportData() {
    if (!this.filters.tipe) {
      this.errorMessage = 'Please select a transaction type';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    let params = new HttpParams()
      .set('tipe', this.filters.tipe);

    if (this.filters.model) params = params.set('model', this.filters.model);
    if (this.filters.color) params = params.set('color', this.filters.color);
    if (this.filters.size) params = params.set('size', this.filters.size);
    if (this.filters.user) params = params.set('user', this.filters.user);
    if (this.filters.tanggal1) params = params.set('tanggal1', this.filters.tanggal1);
    if (this.filters.tanggal2) params = params.set('tanggal2', this.filters.tanggal2);

    this.http.get<any>(`${environment.apiUrl}/reports/monthly`, { params }).subscribe({
      next: (response) => {
        if (response.success) {
          this.reportData = response.data;
          this.calculateGrandTotal();
          this.applyPagination();
          console.log('✅ Monthly report loaded:', this.reportData.length, 'records');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Failed to load monthly report:', err);
        this.errorMessage = err.error?.error || 'Failed to load report data';
        this.isLoading = false;
        this.reportData = [];
        this.filteredData = [];
      }
    });
  }

  calculateGrandTotal() {
    this.grandTotal = this.reportData.reduce((sum, item) => sum + item.total, 0);
  }

  applyPagination() {
    this.totalItems = this.reportData.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = 1;
    this.updateFilteredData();
  }

  updateFilteredData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredData = this.reportData.slice(start, start + this.itemsPerPage);
  }

  onFilter() {
    this.loadReportData();
  }

  clearFilters() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.filters = {
      tipe: '',
      model: '',
      color: '',
      size: '',
      user: '',
      tanggal1: firstDay.toISOString().split('T')[0],
      tanggal2: lastDay.toISOString().split('T')[0]
    };
    this.reportData = [];
    this.filteredData = [];
    this.grandTotal = 0;
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.updateFilteredData();
  }

  get pageNumbers(): number[] {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updateFilteredData();
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.calculatePagination();
  }

  exportSummary() {
    if (!this.filters.tipe) {
      this.errorMessage = 'Please filter data first';
      return;
    }

    this.isExporting = true;
    
    let params = new HttpParams()
      .set('tipe', this.filters.tipe);

    if (this.filters.model) params = params.set('model', this.filters.model);
    if (this.filters.color) params = params.set('color', this.filters.color);
    if (this.filters.size) params = params.set('size', this.filters.size);
    if (this.filters.user) params = params.set('user', this.filters.user);
    if (this.filters.tanggal1) params = params.set('tanggal1', this.filters.tanggal1);
    if (this.filters.tanggal2) params = params.set('tanggal2', this.filters.tanggal2);

    this.http.get(`${environment.apiUrl}/reports/monthly/export`, { 
      params, 
      responseType: 'blob' 
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Monthly_Report_${this.filters.tipe}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.successMessage = 'Report exported successfully!';
        setTimeout(() => this.successMessage = '', 3000);
        this.isExporting = false;
      },
      error: (err) => {
        console.error('❌ Export error:', err);
        this.errorMessage = 'Failed to export report';
        this.isExporting = false;
      }
    });
  }
}