import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockService } from '../../../core/services/stock.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartType } from 'chart.js';
import { DashboardService, WarehouseStats, ShiftScanData, WarehouseItem, ScanRecord } from '../../../core/services/dashboard.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
getItemColor(arg0: string) {
  throw new Error('Method not implemented.');
}
  stats: any = {
    first_stock: 0,
    receiving: 0,
    shipping: 0,
    warehouse_stock: 0
  };
  // Shift Scan Data
  shiftScanData: ShiftScanData[] = [];  
  // Warehouse Items
  warehouseItems: WarehouseItem[] = [];  
  todayDate = new Date();
  // Receiving & Shipping Lists
  receivingList: ScanRecord[] = [];
  shippingList: ScanRecord[] = [];

  chartType: ChartType = 'line';
  chartData: any = {
    labels: [],
    datasets: []
  };
  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { 
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: 'Daily Receiving & Shipping'
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // Utility
  today = new Date();
  yesterday = new Date(this.today.getTime() - 24 * 60 * 60 * 1000);
  isLoading = false;
  
  private destroy$ = new Subject<void>();
  private autoRefresh$ = new Subject<void>();

  constructor(private stockService: StockService, private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadStats();
    this.loadChartData();

    // Auto-refresh every 10 seconds
    interval(10000)
      .pipe(
        switchMap(() => this.autoRefresh$),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.loadData());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.autoRefresh$.complete();
  }

  loadData() {
    this.isLoading = true;
    
    this.dashboardService.getWarehouseStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => console.error('Failed to load stats:', err)
    });

    this.dashboardService.getDailyChart().subscribe({
      next: (data) => {
        this.generateChart(data);
      },
      error: (err) => console.error('Failed to load chart:', err)
    });

    this.dashboardService.getShiftScan().subscribe({
      next: (data) => {
        this.shiftScanData = data;
      },
      error: (err) => console.error('Failed to load shift scan:', err)
    });

    this.dashboardService.getWarehouseItems().subscribe({
      next: (data) => {
        this.warehouseItems = data;
      },
      error: (err) => console.error('Failed to load warehouse items:', err)
    });

    this.dashboardService.getReceivingList().subscribe({
      next: (data) => {
        this.receivingList = data;
      },
      error: (err) => console.error('Failed to load receiving list:', err)
    });

    this.dashboardService.getShippingList().subscribe({
      next: (data) => {
        this.shippingList = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load shipping list:', err);
        this.isLoading = false;
      }
    });
  }

  private generateChart(data: any[]) {
    const dates = data.map(d => d.date);
    const receiving = data.map(d => d.receiving);
    const shipping = data.map(d => d.shipping);

    this.chartData = {
      labels: dates,
      datasets: [
        {
          label: 'Receiving',
          data: receiving,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#28a745',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Shipping',
          data: shipping,
          borderColor: '#ffc107',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#ffc107',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    };
  }

  getProgressColor(status: number): string {
    if (status > 75) return 'progress-bar-success';
    if (status > 50) return 'progress-bar-info';
    if (status > 25) return 'progress-bar-warning';
    return 'progress-bar-danger';
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    };
    return date.toLocaleDateString('id-ID', options);
  }

  loadStats() {
    this.stockService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => console.error('Failed to load stats:', err)
    });
  }

  loadChartData() {
    this.stockService.getChartData().subscribe({
      next: (data: any) => {
        const dates = data.map((d: any) => d.date);
        const receiving = data.map((d: any) => d.receiving);
        const shipping = data.map((d: any) => d.shipping);

        this.chartData = {
          labels: dates,
          datasets: [
            {
              label: 'Receiving',
              data: receiving,
              borderColor: '#28a745',
              backgroundColor: 'rgba(40, 167, 69, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Shipping',
              data: shipping,
              borderColor: '#ffc107',
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        };
      },
      error: (err) => console.error('Failed to load chart data:', err)
    });
  }

}
