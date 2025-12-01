import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartType } from 'chart.js';
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
  chartData: any = {
    labels: [],
    datasets: []
  };

  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  today = new Date();
  yesterday = new Date(this.today.getTime() - 24 * 60 * 60 * 1000);
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    console.log('🚀 Dashboard initialized');

    interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => this.loadAllDataParallel()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => this.processDashboardData(data),
        error: (err) => {
          console.error('❌ Dashboard update error:', err);
          this.isLoading = false;
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
    this.isLoading = true;

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
    if (!data || data.length === 0) return;

    this.chartData = {
      labels: data.map(d => d.date),
      datasets: [
        {
          label: 'Receiving',
          data: data.map(d => d.receiving || 0),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40,167,69,0.1)',
          borderWidth: 3,
          tension: 0.4,
        },
        {
          label: 'Shipping',
          data: data.map(d => d.shipping || 0),
          borderColor: '#ffc107',
          backgroundColor: 'rgba(255,193,7,0.1)',
          borderWidth: 3,
          tension: 0.4,
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
      IP: 'danger',
      PHYLON: 'warning',
      BLOKER: 'success',
      PAINT: 'primary',
      RUBBER: 'secondary',
      GOODSOLE: 'secondary'
    };

    return colors[item.toUpperCase()] ?? 'dark';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
}
