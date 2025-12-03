import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartType, ChartData } from 'chart.js';
import { DashboardService, WarehouseStats, ShiftScanData, WarehouseItem, ScanRecord } from '../../../core/services/dashboard.service';
import { Subject, interval, forkJoin } from 'rxjs';
import { takeUntil, switchMap, startWith, catchError } from 'rxjs/operators';

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

  shiftScanData: ShiftScanData[] = [];
  warehouseItems: WarehouseItem[] = [];
  receivingList: ScanRecord[] = [];
  shippingList: ScanRecord[] = [];

  chartType: ChartType = 'line';
  chartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

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

  private destroy$ = new Subject<void>();

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    console.log('🚀 Dashboard initialized');

    // Initial load
    this.loadAllDataParallel().subscribe({
      next: (data) => this.processDashboardData(data),
      error: (err) => {
        console.error('❌ Dashboard initial load error:', err);
        this.isLoading = false;
      }
    });

    // Auto-refresh every 30 seconds (smooth, no flickering)
    interval(30000)
      .pipe(
        switchMap(() => this.loadAllDataParallel()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          this.processDashboardData(data);
          console.log('🔄 Dashboard data refreshed');
        },
        error: (err) => {
          console.error('❌ Dashboard update error:', err);
        }
      });
  }

  ngOnDestroy() {
    console.log('🛑 Dashboard destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --------------------------- CORE DATA LOADER ---------------------------
  private loadAllDataParallel() {
    // Don't show loading spinner on refresh (only on initial load)
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

  /**
   * Animate counter from 0 to target value
   */
  private animateCounter(element: HTMLElement, target: number, duration: number = 1000) {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = this.formatNumber(Math.floor(target));
        clearInterval(timer);
      } else {
        element.textContent = this.formatNumber(Math.floor(current));
      }
    }, 16);
  }

  private processDashboardData(data: any) {
    // Update data WITHOUT triggering loading spinner
    this.stats = data.stats;
    this.shiftScanData = data.shift;
    this.warehouseItems = data.items;
    this.receivingList = data.receiving;
    this.shippingList = data.shipping;

    this.generateChart(data.chart);
    this.isLoading = false;
  }

  // --------------------------- CHART HANDLER ---------------------------
  private generateChart(data: any[]) {
    if (!data || data.length === 0) {
      console.warn('⚠️ No chart data available');
      return;
    }

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

  /**
   * Parse percent string (format: "25,50" -> 25.50)
   */
  parsePercent(percent: string | number): number {
    if (typeof percent === 'number') return percent;
    if (!percent) return 0;
    
    // Replace comma with dot and convert to number
    const cleaned = String(percent).replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Format number with thousand separator
   */
  formatNumber(num: number): string {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  }
}