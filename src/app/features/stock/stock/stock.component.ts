import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockService } from '../../../core/services/stock.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.scss'
})
export class StockComponent implements OnInit {
  stockList: any[] = [];

  constructor(private stockService: StockService) {}

  ngOnInit() {
    this.loadStock();
  }

  loadStock() {
    this.stockService.getAll().subscribe({
      next: (data) => {
        this.stockList = data;
      },
      error: (err) => {
        console.error('Failed to load stock:', err);
      }
    });
  }

}
