import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../core/services/stock.service';

interface Stock {
  stock_id: number;
  warehouse_id: number;
  original_barcode: string;
  brand: string;
  model: string;
  color: string;
  size: string;
  quantity: number;
  status: string;
  computed_status?: string;
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
    this.loadStock();
  }

  loadStock() {
    this.isLoading = true;
    this.errorMessage = '';

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
        
        console.log(`📦 Loaded ${this.stockList.length} items`);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Failed to load stock:', err);
        this.errorMessage = err.error?.message || 'Failed to load stock data';
        this.isLoading = false;
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
    this.searchTerm = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.loadStock();
  }

  getStatusBadgeClass(stock: Stock): string {
    const qty = stock.quantity;
    
    if (qty > 100) return 'bg-success';
    if (qty > 0 && qty <= 100) return 'bg-warning';
    return 'bg-danger';
  }

  getStatusText(stock: Stock): string {
    const qty = stock.quantity;
    
    if (qty > 100) return 'Available';
    if (qty > 0 && qty <= 100) return 'Low Stock';
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
      this.currentPage = page;
      this.loadStock();
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.loadStock();
  }

}
