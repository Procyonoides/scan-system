import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockService } from '../../../core/services/stock.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  stats: any;
  todayDate = new Date();
  receivingData: any[] = [];
  shippingData: any[] = [];

  chartType: ChartType = 'line';
  chartData: any = {
    labels: [],
    datasets: []
  };
  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  constructor(private stockService: StockService) {}

  ngOnInit() {
    this.loadStats();
    this.loadChartData();
  }

  loadStats() {
    this.stockService.getStats().subscribe(data => {
      this.stats = data;
    });
  }

  loadChartData() {
    this.stockService.getChartData().subscribe((data: any) => {
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
            tension: 0.4
          },
          {
            label: 'Shipping',
            data: shipping,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            tension: 0.4
          }
        ]
      };
    });
  }

}
