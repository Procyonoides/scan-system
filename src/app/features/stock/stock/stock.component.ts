import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../core/services/stock.service';

interface Stock {
  no: number;
  model: string;
  color: string;
  size: string;
  brand: string;
  item: string;
  production: string;
  stock_awal: number;
  receiving: number;
  shipping: number;
  stock_akhir: number;
  percentage: number;
  status: string;
  date: string;
}

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.scss'
})
export class StockComponent implements OnInit {
  stockList: Stock[] = [];
  filteredStocks: Stock[] = [];
  isLoading = false;
  errorMessage = '';

  // Search & Filter
  searchTerm = '';
  statusFilter = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalItems = 0;
  Math = Math;

  constructor(private stockService: StockService) {}

  ngOnInit() {
    console.log('🚀 Stock Component initialized');
    this.loadStock();
  }

  loadStock() {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('📡 Loading stock data...', {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm,
      status: this.statusFilter
    });

    this.stockService.getAll(
      this.currentPage, 
      this.itemsPerPage, 
      this.searchTerm, 
      this.statusFilter
    ).subscribe({
      next: (response: any) => {
        console.log('✅ Stock data received:', response);
        
        if (response.data) {
          this.stockList = response.data;
          this.filteredStocks = response.data;
          
          if (response.pagination) {
            this.totalItems = response.pagination.total;
            this.totalPages = response.pagination.totalPages;
            this.currentPage = response.pagination.page;
          }
        } else {
          // Backward compatibility
          this.stockList = response;
          this.filteredStocks = response;
          this.totalItems = response.length;
          this.totalPages = Math.ceil(response.length / this.itemsPerPage);
        }
        
        console.log(`📦 Loaded ${this.stockList.length} items (Total: ${this.totalItems})`);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Failed to load stock:', err);
        this.errorMessage = err.error?.message || err.error?.error || 'Failed to load stock data';
        this.isLoading = false;
        
        // Set empty data
        this.stockList = [];
        this.filteredStocks = [];
        this.totalItems = 0;
        this.totalPages = 0;
      }
    });
  }

  onSearch() {
    console.log('🔍 Searching:', this.searchTerm);
    this.currentPage = 1;
    this.loadStock();
  }

  onFilterChange() {
    console.log('🔍 Filter status:', this.statusFilter);
    this.currentPage = 1;
    this.loadStock();
  }

  clearFilters() {
    console.log('🧹 Clearing filters...');
    this.searchTerm = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.loadStock();
  }

  getStatusBadgeClass(stock: Stock): string {
    if (stock.status === 'AVAILABLE') return 'bg-success';
    if (stock.status === 'LOW_STOCK') return 'bg-warning';
    return 'bg-danger';
  }

  getStatusText(stock: Stock): string {
    if (stock.status === 'AVAILABLE') return 'Available';
    if (stock.status === 'LOW_STOCK') return 'Low Stock';
    return 'Out of Stock';
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
      console.log(`📄 Going to page ${page}`);
      this.currentPage = page;
      this.loadStock();
    }
  }

  onItemsPerPageChange() {
    console.log(`📋 Items per page changed to: ${this.itemsPerPage}`);
    this.currentPage = 1;
    this.loadStock();
  }
}