import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { FormsModule } from '@angular/forms';

interface MasterDataItem {
  stock_id: number;
  original_barcode: string;
  brand: string;
  model: string;
  color: string;
  size: string;
  four_digit: string;
  unit: string;
  quantity: number;
  production: string;
  model_code: string;
  item: string;
  username: string;
  date_time: string;
  stock: number;
  status: string;
}

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './master-data.component.html',
  styleUrl: './master-data.component.scss'
})
export class MasterDataComponent implements OnInit {
  masterDataList: MasterDataItem[] = [];
  filteredData: MasterDataItem[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  Math = Math;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadMasterData();
  }

  loadMasterData() {
    this.http.get<MasterDataItem[]>(`${environment.apiUrl}/master-data/barcodes`)
      .subscribe({
        next: (data) => {
          this.masterDataList = data;
          this.filteredData = data;
          this.calculatePagination();
        },
        error: (err) => console.error('Failed to load master data:', err)
      });
  }

  onSearch() {
    if (!this.searchTerm) {
      this.filteredData = this.masterDataList;
    } else {
      this.filteredData = this.masterDataList.filter(item =>
        item.original_barcode?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.brand?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.model?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  get paginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredData.slice(start, end);
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
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  exportExcel() {
    const headers = ['Barcode', 'Brand', 'Model', 'Color', 'Size', 'Quantity', 'Status'];
    const rows = this.filteredData.map(item => [
      item.original_barcode,
      item.brand,
      item.model,
      item.color,
      item.size,
      item.quantity,
      item.status
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'master-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  printMasterData() {
    window.print();
  }

}
