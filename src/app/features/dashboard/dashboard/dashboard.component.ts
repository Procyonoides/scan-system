import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartType, ChartData } from 'chart.js';
import { DashboardService, WarehouseStats, ShiftScanData, WarehouseItem, ScanRecord } from '../../../core/services/dashboard.service';
import { SocketService } from '../../../core/services/socket.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

interface DashboardUpdate {
  type: 'RECEIVING' | 'SHIPPING';
  receiving_id?: number;
  shipping_id?: number;
  scan_no?: number;
  barcode: string;
  model: string;
  color: string;
  size: string;
  item: string;
  quantity: number;
  username: string;
  timestamp: string;
  // Stats for real-time updates
  firstStock?: number;
  warehouseStock?: number;
  receivingCount?: number;
  receivingQty?: number;
  shippingCount?: number;
  shippingQty?: number;
  // Warehouse items for chart warehouse update
  warehouseItems?: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {

  stats: WarehouseStats = {
    first_stock: 0,
    receiving: 0,
    shipping: 0,
    warehouse_stock: 0
  };

  receivingList: any[] = [];
  shippingList: any[] = [];
  shiftScanData: any[] = [];
  warehouseItems: any[] = [];
  chartData: any = { labels: [], datasets: [] };

  chartType: ChartType = 'line';

  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: {
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          }
        },
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  today = new Date();
  yesterday = new Date(this.today.getTime() - 24 * 60 * 60 * 1000);
  isLoading = false;
  isConnected = false;

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    console.log('🚀 Dashboard initialized - Real-time updates only (No auto-refresh)');

    // Connect to Socket.IO
    this.socketService.connect();

    // Keep isConnected in sync with the socket's actual state at all times,
    // instead of only checking it once right after connect().
    this.socketService.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isConnected = status;
        console.log('🔌 Socket connection status changed:', status);
      });
    
    // ============ LISTEN TO REAL-TIME UPDATES ============
    // Setup listener AFTER a small delay to ensure Socket connection is established
    setTimeout(() => {
      this.socketService.on<DashboardUpdate>('dashboard:update')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (update) => {
          console.log('⚡ Real-time update received:', update);
          
          if (update.type === 'RECEIVING') {
            this.handleReceivingUpdate(update);
          } else if (update.type === 'SHIPPING') {
            this.handleShippingUpdate(update);
          }
        },
        error: (err) => console.error('❌ Socket error:', err)
      });
    }, 500);

    // Initial load ONLY (no auto-refresh)
    this.loadAllDataParallel().subscribe({
      next: (data) => {
        this.processDashboardData(data);
        console.log('✅ Dashboard initial data loaded successfully');
      },
      error: (err) => {
        console.error('❌ Dashboard initial load error:', err);
        this.isLoading = false;
      }
    });

    // ✅ AUTO-REFRESH REMOVED
    console.log('✅ Auto-refresh disabled - Dashboard will update via Socket.IO real-time events only');
  }

  ngOnDestroy() {
    console.log('🛑 Dashboard destroyed');
    this.destroy$.next();
    this.destroy$.complete();
    this.socketService.disconnect();
  }

  // --------------------------- CORE DATA LOADER ---------------------------
  private loadAllDataParallel() {
    // Show loading spinner only on initial load
    if (!this.stats.first_stock && !this.stats.warehouse_stock) {
      this.isLoading = true;
    }

    return forkJoin({
      stats: this.dashboardService.getWarehouseStats(),
      chart: this.dashboardService.getDailyChart(),
      shift: this.dashboardService.getShiftScan(),
      items: this.dashboardService.getWarehouseItems(),
      receiving: this.dashboardService.getReceivingList(),
      shipping: this.dashboardService.getShippingList()
    }).pipe(
      catchError(err => {
        console.error('❌ Failed to fetch data:', err);
        this.isLoading = false;
        throw err;
      })
    );
  }

  private processDashboardData(data: any) {
    // Update data without triggering loading spinner
    this.stats = data.stats;
    this.shiftScanData = data.shift;
    this.warehouseItems = data.items;
    this.receivingList = data.receiving;
    this.shippingList = data.shipping;

    this.generateChart(data.chart);
    this.isLoading = false;
  }

  // --------------------------- UI HELPERS ---------------------------
  getProgressColor(status: number): string {
    if (status > 25) return 'bg-danger';
    if (status >= 10) return 'bg-warning';
    if (status >= 5) return 'bg-success';
    return 'bg-info';
  }

  getItemColor(item: string): string {
    const colors: { [key: string]: string } = {
      'IP': 'red',
      'PHYLON': 'orange',
      'BLOKER': 'green',
      'BLOKR': 'green',
      'PAINT': 'light-blue',
      'RUBBER': 'gray',
      'GOODSOLE': 'teal',
      'RUBER': 'gray'
    };

    const upperItem = (item || '').toUpperCase().trim();
    return colors[upperItem] ?? 'dark';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  parsePercent(percent: string | number): number {
    if (typeof percent === 'number') return percent;
    if (!percent) return 0;
    
    const cleaned = String(percent).replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Handle receiving update - AUTO INCREMENT
   */
  handleReceivingUpdate(update: DashboardUpdate) {
    console.log('📥 Processing RECEIVING update:', update);
    
    // Update stats from server
    if (update.firstStock !== undefined) {
      this.stats.first_stock = update.firstStock;
      console.log('📊 First stock updated:', this.stats.first_stock);
    }
    if (update.warehouseStock !== undefined) {
      this.stats.warehouse_stock = update.warehouseStock;
      console.log('📊 Warehouse stock updated:', this.stats.warehouse_stock);
    }
    if (update.receivingCount !== undefined) {
      this.stats.receiving = update.receivingCount;
      console.log('📊 Receiving count updated:', this.stats.receiving);
    }
    if (update.receivingQty !== undefined) {
      this.stats.receiving_qty = update.receivingQty;
      console.log('📊 Receiving qty updated:', this.stats.receiving_qty);
    }
    if (update.shippingCount !== undefined) {
      this.stats.shipping = update.shippingCount;
      console.log('📊 Shipping count updated:', this.stats.shipping);
    }
    if (update.shippingQty !== undefined) {
      this.stats.shipping_qty = update.shippingQty;
      console.log('📊 Shipping qty updated:', this.stats.shipping_qty);
    }
    
    // Update warehouse items (chart warehouse) in real-time
    if (update.warehouseItems && update.warehouseItems.length > 0) {
      this.warehouseItems = update.warehouseItems;
      console.log('📦 Warehouse items updated (real-time):', this.warehouseItems.length, 'items');
      this.warehouseItems.forEach(item => {
        console.log(`  ✅ ${item.item}: ${item.total} unit (${item.status}%)`);
      });
    } else {
      console.warn('⚠️ No warehouse items in update');
    }
    
    // Add to receiving list (prepend)
    const newItem = {
      date_time: this.formatDateTime(update.timestamp),
      original_barcode: update.barcode,
      model: update.model,
      color: update.color,
      size: update.size,
      item: update.item,
      quantity: update.quantity,
      username: update.username,
      scan_no: update.scan_no || 0
    };
    
    this.receivingList.unshift(newItem);
    
    // Keep only last 10 items
    if (this.receivingList.length > 10) {
      this.receivingList = this.receivingList.slice(0, 10);
    }
    
    console.log('✅ Receiving list updated (real-time)', newItem);
  }

  /**
   * Handle shipping update - AUTO DECREMENT
   */
  handleShippingUpdate(update: DashboardUpdate) {
    console.log('📤 Processing SHIPPING update:', update);
    
    // Update stats from server
    if (update.firstStock !== undefined) {
      this.stats.first_stock = update.firstStock;
      console.log('📊 First stock updated:', this.stats.first_stock);
    }
    if (update.warehouseStock !== undefined) {
      this.stats.warehouse_stock = update.warehouseStock;
      console.log('📊 Warehouse stock updated:', this.stats.warehouse_stock);
    }
    if (update.receivingCount !== undefined) {
      this.stats.receiving = update.receivingCount;
      console.log('📊 Receiving count updated:', this.stats.receiving);
    }
    if (update.receivingQty !== undefined) {
      this.stats.receiving_qty = update.receivingQty;
      console.log('📊 Receiving qty updated:', this.stats.receiving_qty);
    }
    if (update.shippingCount !== undefined) {
      this.stats.shipping = update.shippingCount;
      console.log('📊 Shipping count updated:', this.stats.shipping);
    }
    if (update.shippingQty !== undefined) {
      this.stats.shipping_qty = update.shippingQty;
      console.log('📊 Shipping qty updated:', this.stats.shipping_qty);
    }
    
    // Update warehouse items (chart warehouse) in real-time
    if (update.warehouseItems && update.warehouseItems.length > 0) {
      this.warehouseItems = update.warehouseItems;
      console.log('📦 Warehouse items updated (real-time):', this.warehouseItems.length, 'items');
      this.warehouseItems.forEach(item => {
        console.log(`  ✅ ${item.item}: ${item.total} unit (${item.status}%)`);
      });
    } else {
      console.warn('⚠️ No warehouse items in update');
    }
    
    // Add to shipping list (prepend)
    const newItem = {
      date_time: this.formatDateTime(update.timestamp),
      original_barcode: update.barcode,
      model: update.model,
      color: update.color,
      size: update.size,
      item: update.item,
      quantity: update.quantity,
      username: update.username,
      scan_no: update.scan_no || 0
    };
    
    this.shippingList.unshift(newItem);
    
    // Keep only last 10 items
    if (this.shippingList.length > 10) {
      this.shippingList = this.shippingList.slice(0, 10);
    }

    console.log('✅ Shipping list updated (real-time)', newItem);
  }

  /**
   * Generate chart
   */
  generateChart(data: any[]) {
    if (!data || data.length === 0) return;
    
    this.chartData = {
      labels: data.map(d => d.date),
      datasets: [
        {
          label: 'RECEIVING',
          data: data.map(d => d.receiving || 0),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40,167,69,0.1)',
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#28a745',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: true
        },
        {
          label: 'SHIPPING',
          data: data.map(d => d.shipping || 0),
          borderColor: '#ffc107',
          backgroundColor: 'rgba(255,193,7,0.1)',
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#ffc107',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: true
        }
      ]
    };
  }

  /**
   * Format datetime
   */
  formatDateTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Format number with thousand separator
   */
  formatNumber(num: number): string {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  }

  /**
   * Parse string to float
   */
  parseFloatValue(value: any): number {
    return parseFloat(value) || 0;
  }

  /**
   * Manual refresh (if needed)
   */
  refreshData() {
    console.log('🔄 Manual refresh triggered');
    this.isLoading = true;
    
    this.loadAllDataParallel().subscribe({
      next: (data) => {
        this.processDashboardData(data);
        console.log('✅ Manual refresh completed');
      },
      error: (err) => {
        console.error('❌ Manual refresh failed:', err);
        this.isLoading = false;
      }
    });
  }
}