import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import * as XLSX from 'xlsx';

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

    // Create workbook and worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);
    
    // Add header row
    const header = [
      'NO',
      'PRODUCTION',
      'BRAND',
      'MODEL',
      'COLOR',
      'SIZE',
      'DESCRIPTION',
      'TOTAL'
    ];
    XLSX.utils.sheet_add_aoa(ws, [header], { origin: 0 });

    // Add data rows
    const data = this.reportData.map(row => [
      row.no,
      row.production,
      row.brand,
      row.model,
      row.color,
      row.size,
      row.description,
      row.total
    ]);
    XLSX.utils.sheet_add_aoa(ws, data, { origin: 1 });

    // Add grand total row
    const totalRow = ['', '', '', '', '', '', 'GRAND TOTAL', this.grandTotal];
    XLSX.utils.sheet_add_aoa(ws, [totalRow], { origin: this.reportData.length + 2 });

    // Set column widths
    const colWidths = [6, 15, 12, 12, 15, 10, 15, 12];
    ws['!cols'] = colWidths.map(w => ({ wch: w }));

    // Create workbook
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');

    // Generate filename
    const filename = `Monthly_Report_${this.filters.tipe.toUpperCase()}_${this.filters.tanggal1}_to_${this.filters.tanggal2}.xlsx`;
    
    // Write file
    XLSX.writeFile(wb, filename);

    this.successMessage = 'Report exported successfully!';
    setTimeout(() => this.successMessage = '', 3000);
    this.isExporting = false;
  }
}