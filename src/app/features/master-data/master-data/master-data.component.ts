import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

interface MasterDataItem {
  original_barcode: string;
  brand: string;
  color: string;
  size: string;
  four_digit: string;
  unit: string;
  quantity: number;
  production: string;
  model: string;
  model_code: string;
  item: string;
  username: string;
  date_time: string;
  stock: number;
}

interface FilterOptions {
  models: string[];
  sizes: string[];
  productions: string[];
  brands: string[];
  units: string[];
  items: string[];
}

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './master-data.component.html',
  styleUrl: './master-data.component.scss'
})
export class MasterDataComponent implements OnInit {
  masterDataList: MasterDataItem[] = [];
  filteredData: MasterDataItem[] = [];
  filterOptions: FilterOptions = {
    models: [],
    sizes: [],
    productions: [],
    brands: [],
    units: [],
    items: []
  };

  barcodeForm!: FormGroup;
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  Math = Math;

  // Modal states
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedBarcode: string = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadMasterData();
    this.loadFilterOptions();
  }

  initForm() {
    this.barcodeForm = this.fb.group({
      original_barcode: ['', [Validators.required, Validators.minLength(5)]],
      brand: ['', Validators.required],
      color: ['', Validators.required],
      size: ['', Validators.required],
      four_digit: [''],
      unit: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]],
      production: ['', Validators.required],
      model: ['', Validators.required],
      model_code: [''],
      item: ['', Validators.required],
      stock: [0]
    });

    // Auto-generate four_digit when size changes
    this.barcodeForm.get('size')?.valueChanges.subscribe(size => {
      if (size) {
        this.generateFourDigit(size);
      }
    });

    // Auto-fetch model_code when model changes
    this.barcodeForm.get('model')?.valueChanges.subscribe(model => {
      if (model) {
        this.fetchModelCode(model);
      }
    });
  }

  loadMasterData() {
    this.isLoading = true;
    this.http.get<any>(`${environment.apiUrl}/master-data/barcodes`, {
      params: { page: this.currentPage, limit: this.itemsPerPage }
    }).subscribe({
      next: (response) => {
        this.masterDataList = response.data;
        this.filteredData = response.data;
        this.totalPages = response.pagination.totalPages;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load master data:', err);
        this.errorMessage = 'Failed to load data';
        this.isLoading = false;
      }
    });
  }

  loadFilterOptions() {
    this.http.get<FilterOptions>(`${environment.apiUrl}/master-data/filter-options`)
      .subscribe({
        next: (data) => {
          this.filterOptions = data;
        },
        error: (err) => console.error('Failed to load filter options:', err)
      });
  }

  generateFourDigit(size: string) {
    // Logic to generate four_digit based on size (reference from PHP)
    const sizeMap: { [key: string]: string } = {
      '10K': '0010', '10TK': '0011', '11K': '0012', '11TK': '0013',
      '12K': '0014', '12TK': '0015', '13K': '0016', '13TK': '0017',
      '1': '0018', '1T': '0019', '2': '0020', '2T': '0021',
      '3': '0022', '3T': '0023', '4': '0024', '4T': '0025',
      '5': '0026', '5T': '0027', '6': '0028', '6T': '0029',
      '7': '0030', '7T': '0031', '8': '0032', '8T': '0033',
      '9': '0034', '9T': '0035', '10': '0036', '10T': '0037',
      '11': '0038', '11T': '0039', '12': '0040', '12T': '0041',
      '13': '0042', '13T': '0043', '14': '0044', '14T': '0045',
      '15': '0046', '15T': '0047', '16': '0048', '16T': '0049',
      '17': '0050', '17T': '0051', '18': '0052', '18T': '0053'
    };
    this.barcodeForm.patchValue({ four_digit: sizeMap[size] || '' });
  }

  fetchModelCode(model: string) {
    this.http.get<any>(`${environment.apiUrl}/master-data/model-code/${model}`)
      .subscribe({
        next: (data) => {
          this.barcodeForm.patchValue({ model_code: data.model_code || '' });
        },
        error: (err) => console.error('Failed to fetch model code:', err)
      });
  }

  onSearch() {
    if (!this.searchTerm) {
      this.filteredData = this.masterDataList;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredData = this.masterDataList.filter(item =>
        item.original_barcode?.toLowerCase().includes(term) ||
        item.brand?.toLowerCase().includes(term) ||
        item.model?.toLowerCase().includes(term) ||
        item.color?.toLowerCase().includes(term)
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

  // ==================== CRUD OPERATIONS ====================

  openAddModal() {
    this.showAddModal = true;
    this.barcodeForm.reset({ quantity: 0, stock: 0 });
  }

  openEditModal(barcode: string) {
    this.selectedBarcode = barcode;
    this.isLoading = true;
    
    this.http.get<MasterDataItem>(`${environment.apiUrl}/master-data/barcode/${barcode}`)
      .subscribe({
        next: (data) => {
          this.barcodeForm.patchValue(data);
          this.showEditModal = true;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'Failed to load barcode data';
          this.isLoading = false;
        }
      });
  }

  openDeleteModal(barcode: string) {
    this.selectedBarcode = barcode;
    this.showDeleteModal = true;
  }

  onAdd() {
    if (this.barcodeForm.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    this.isLoading = true;
    this.http.post(`${environment.apiUrl}/master-data/barcode`, this.barcodeForm.value)
      .subscribe({
        next: () => {
          this.successMessage = 'Barcode added successfully!';
          this.showAddModal = false;
          this.loadMasterData();
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to add barcode';
          this.isLoading = false;
        }
      });
  }

  onEdit() {
    if (this.barcodeForm.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    this.isLoading = true;
    this.http.put(`${environment.apiUrl}/master-data/barcode/${this.selectedBarcode}`, this.barcodeForm.value)
      .subscribe({
        next: () => {
          this.successMessage = 'Barcode updated successfully!';
          this.showEditModal = false;
          this.loadMasterData();
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to update barcode';
          this.isLoading = false;
        }
      });
  }

  onDelete() {
    this.isLoading = true;
    this.http.delete(`${environment.apiUrl}/master-data/barcode/${this.selectedBarcode}`)
      .subscribe({
        next: () => {
          this.successMessage = 'Barcode deleted successfully!';
          this.showDeleteModal = false;
          this.loadMasterData();
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to delete barcode';
          this.isLoading = false;
        }
      });
  }

  closeModal() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.errorMessage = '';
  }

  exportExcel() {
    const headers = ['Barcode', 'Brand', 'Model', 'Color', 'Size', 'Quantity', 'Stock'];
    const rows = this.filteredData.map(item => [
      item.original_barcode,
      item.brand,
      item.model,
      item.color,
      item.size,
      item.quantity,
      item.stock
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