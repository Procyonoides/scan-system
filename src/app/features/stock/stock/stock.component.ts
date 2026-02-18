import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../core/services/stock.service';
import { SocketService } from '../../../core/services/socket.service';
import { Subject } from 'rxjs';
import { takeUntil, throttleTime } from 'rxjs/operators';

interface Stock {
  no: number;
  model: string;
  color: string;
  size: string;
  brand: string;
  item: string;
  production: string;
  stock_akhir: number; // Total stock only
  percentage: number;
  status: string;
  status_production: string; // RUN or STOP
}

interface WarehouseUpdate {
  type: 'RECEIVING' | 'SHIPPING';
  barcode?: string;
  item?: string;
  quantity?: number;
  username?: string;
  warehouseItems?: any[];
  warehouse_items?: any[];
  warehouseStock?: number;
}

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.scss'
})
export class StockComponent implements OnInit, OnDestroy {
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

  private destroy$ = new Subject<void>();

  constructor(
    private stockService: StockService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🚀🚀🚀 STOCK COMPONENT INIT 🚀🚀🚀');
    
    // Load initial stock data
    this.loadStock();
    
    // Setup Socket.IO listener for real-time warehouse updates
    console.log('📌 Setting up real-time listener...');
    
    // Ensure socket is connected
    if (!this.socketService.isConnected()) {
      console.log('📌 Socket NOT connected, connecting...');
      this.socketService.connect();
      // Wait a bit for connection to establish
      setTimeout(() => {
        this.setupRealtimeUpdates();
      }, 500);
    } else {
      console.log('✅ Socket already connected');
      this.setupRealtimeUpdates();
    }
  }

  ngOnDestroy() {
    console.log('🛑 Stock component destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Setup real-time updates listener
   * Listen to dashboard:update from receiving/shipping scans
   */
  private setupRealtimeUpdates() {
    console.log('%c>>> SETUP REAL-TIME UPDATES <<<', 'color: red; font-size: 14px; font-weight: bold');
    console.log('Socket connected?', this.socketService.isConnected());
    
    // Listen to all dashboard updates
    // Throttle to maximum 1 update per 1 second to avoid excessive API calls
    const subscription = this.socketService.on<WarehouseUpdate>('dashboard:update')
      .pipe(
        throttleTime(1000), // Max 1 reload per second
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (update) => {
          console.log('%c⚡⚡⚡ EVENT RECEIVED ⚡⚡⚡', 'color: orange; font-size: 14px; font-weight: bold');
          console.log('Update received:', {
            type: update.type,
            item: update.item,
            quantity: update.quantity,
            timestamp: new Date().toLocaleTimeString()
          });
          
          // Reload stock data immediately
          console.log('🔄 NOW CALLING RELOADED STOCK DATA...');
          this.reloadStockData();
        },
        error: (err) => {
          console.error('%c❌ SOCKET ERROR', 'color: red; font-size: 14px', err);
        },
        complete: () => {
          console.log('Socket subscription completed');
        }
      });
    
    console.log('%c>>> LISTENER SETUP COMPLETE <<<', 'color: green; font-size: 14px; font-weight: bold');
  }

  /**
   * Reload stock data without changing pagination or filters
   * Called when real-time update is received
   */
  private reloadStockData() {
    console.log('%c>>> RELOAD STOCK DATA CALLED <<<', 'color: blue; font-size: 12px; font-weight: bold');
    console.log('Calling API:', {
      endpoint: '/api/dashboard/warehouse-stats',
      page: this.currentPage,
      limit: this.itemsPerPage
    });
    
    this.stockService.getAll(
      this.currentPage, 
      this.itemsPerPage, 
      this.searchTerm, 
      this.statusFilter
    ).subscribe({
      next: (response: any) => {
        console.log('%c✅ API RESPONSE RECEIVED', 'color: green; font-size: 12px; font-weight: bold');
        console.log('Response data:', response);
        
        if (response.data) {
          console.log('Using response.data, items count:', response.data.length);
          this.stockList = response.data;
          this.filteredStocks = response.data;
          
          if (response.pagination) {
            this.totalItems = response.pagination.total;
            this.totalPages = response.pagination.totalPages;
          }
        } else {
          console.log('Using response directly, items count:', response.length);
          this.stockList = response;
          this.filteredStocks = response;
          this.totalItems = response.length;
          this.totalPages = Math.ceil(response.length / this.itemsPerPage);
        }
        
        console.log('%c>>> CALLING CHANGE DETECTION <<<', 'color: purple; font-size: 12px; font-weight: bold');
        // Trigger change detection immediately
        this.cdr.detectChanges();
        
        console.log('%c🎉 UI UPDATED IN REAL-TIME! 🎉', 'color: green; font-size: 14px; font-weight: bold');
      },
      error: (err) => {
        console.error('%c❌ API ERROR', 'color: red; font-size: 12px', err);
        // Silently fail - don't show error to user for real-time reloads
      }
    });
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

  /**
   * Get badge class for production status
   * RUN = success (production aktif), STOP = danger (produksi berhenti)
   * Logic: RUN jika ada receiving dalam 1 bulan terakhir, STOP jika tidak ada
   */
  getProductionStatusBadgeClass(status: string): string {
    if (status === 'RUN') return 'status-run';
    if (status === 'STOP') return 'status-stop';
    return 'status-unknown';
  }

  /**
   * Get percentage color class
   * Menunjukkan persentase stok relatif terhadap max stock di warehouse
   * Formula: (stock_akhir * 100) / MAX(stock)
   */
  getPercentageClass(percentage: number): string {
    if (percentage >= 75) return 'bg-success';
    if (percentage >= 50) return 'bg-info';
    if (percentage >= 25) return 'bg-warning';
    return 'bg-danger';
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