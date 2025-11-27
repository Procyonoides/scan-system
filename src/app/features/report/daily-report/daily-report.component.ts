import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-daily-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-report.component.html',
  styleUrl: './daily-report.component.scss'
})
export class DailyReportComponent implements OnInit {

  filters = {
    transaction: '',
    model: '',
    color: '',
    size: '',
    user: '',
    dateRange: ''
  };

  reportData: any[] = [];
  filteredData: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  transactionOptions: string[] = ['All', 'RECEIVING', 'SHIPPING'];
  modelOptions: string[] = [];
  colorOptions: string[] = [];
  sizeOptions: string[] = [];
  userOptions: string[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadFilterOptions();
    this.loadReportData();
  }

  loadFilterOptions() {
    // Load dropdown options from API
    this.http.get<any>(`${environment.apiUrl}/reports/filter-options`).subscribe({
      next: (data) => {
        this.modelOptions = data.models || [];
        this.colorOptions = data.colors || [];
        this.sizeOptions = data.sizes || [];
        this.userOptions = data.users || [];
      },
      error: (err) => console.error('Failed to load filter options:', err)
    });
  }

  loadReportData() {
    this.http.get<any[]>(`${environment.apiUrl}/reports/daily`).subscribe({
      next: (data) => {
        this.reportData = data;
        this.applyFilters();
      },
      error: (err) => console.error('Failed to load report data:', err)
    });
  }

  applyFilters() {
    this.filteredData = this.reportData.filter(item => {
      return (
        (!this.filters.transaction || item.transaction === this.filters.transaction) &&
        (!this.filters.model || item.model === this.filters.model) &&
        (!this.filters.color || item.color === this.filters.color) &&
        (!this.filters.size || item.size === this.filters.size) &&
        (!this.filters.user || item.username === this.filters.user)
      );
    });
    this.calculatePagination();
  }

  onFilter() {
    this.applyFilters();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  get paginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  printDetail() {
    window.print();
  }

  printSummary() {
    console.log('Print Summary');
  }

  printHourly() {
    console.log('Print Hourly');
  }

}
