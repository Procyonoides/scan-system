import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
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
    brands: ['ADIDAS', 'NEW BALANCE', 'REEBOK', 'ASICS', 'SPECS', 'OTHER BRAND'],
    units: ['PRS', 'PCS'],
    items: ['IP', 'PHYLON', 'BLOKER', 'PAINT', 'RUBBER', 'GOODSOLE']
  };

  barcodeForm!: FormGroup;
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  totalItems: number = 0;
  Math = Math;

  // Modal states
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showImportModal = false;
  showStockOpnameModal = false;
  showRecordModal = false;
  showBackupModal = false;
  showDuplicateModal = false;
  
  selectedBarcode: string = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // File upload
  selectedFile: File | null = null;

  // Size to Four Digit Mapping - Will be loaded from database
  sizeMap: { [key: string]: string } = {};

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    console.log('🚀 Master Data Component initialized');
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
      stock: [0],
      username: [''],
      date_time: ['']
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
    this.errorMessage = '';

    console.log('📡 Loading master data...', {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm
    });

    this.http.get<any>(`${environment.apiUrl}/master-data/barcodes`, {
      params: { 
        page: this.currentPage.toString(), 
        limit: this.itemsPerPage.toString(),
        search: this.searchTerm
      }
    }).subscribe({
      next: (response) => {
        console.log('✅ Master data received:', response);
        
        if (response.success && response.data) {
          this.masterDataList = response.data;
          this.filteredData = response.data;
          
          if (response.pagination) {
            this.totalItems = response.pagination.total;
            this.totalPages = response.pagination.totalPages;
            this.currentPage = response.pagination.page;
          }
          
          console.log(`📦 Loaded ${this.masterDataList.length} items (Total: ${this.totalItems})`);
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Failed to load master data:', err);
        this.errorMessage = err.error?.error || err.error?.message || 'Failed to load data';
        this.isLoading = false;
        
        this.masterDataList = [];
        this.filteredData = [];
        this.totalItems = 0;
        this.totalPages = 0;
      }
    });
  }

  loadFilterOptions() {
    console.log('📡 Loading filter options from database...');
    
    this.http.get<any>(`${environment.apiUrl}/master-data/filter-options`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Update options dari database
            this.filterOptions.models = response.models || [];
            this.filterOptions.sizes = response.sizes || [];
            this.filterOptions.productions = response.productions || [];
            
            // Build size map dari database
            if (response.sizeMap) {
              this.sizeMap = response.sizeMap;
              console.log('✅ Size map loaded from database:', Object.keys(this.sizeMap).length, 'entries');
            }
            
            // Brands, units, items tetap dari static array
            this.filterOptions.brands = response.brands || ['ADIDAS', 'NEW BALANCE', 'REEBOK', 'ASICS', 'SPECS', 'OTHER BRAND'];
            this.filterOptions.units = response.units || ['PRS', 'PCS'];
            this.filterOptions.items = response.items || ['IP', 'PHYLON', 'BLOKER', 'PAINT', 'RUBBER', 'GOODSOLE'];
            
            console.log('✅ Filter options loaded:', {
              models: this.filterOptions.models.length,
              sizes: this.filterOptions.sizes.length,
              productions: this.filterOptions.productions.length,
              sizeMapEntries: Object.keys(this.sizeMap).length
            });
          }
        },
        error: (err) => {
          console.error('❌ Failed to load filter options:', err);
          this.errorMessage = 'Failed to load dropdown options';
        }
      });
  }

  generateFourDigit(size: string) {
    const fourDigit = this.sizeMap[size] || '';
    this.barcodeForm.patchValue({ four_digit: fourDigit });
    console.log(`🔢 Generated four_digit for size ${size}: ${fourDigit}`);
  }

  fetchModelCode(model: string) {
    console.log('📡 Fetching model_code for:', model);
    
    this.http.get<any>(`${environment.apiUrl}/master-data/model-code/${model}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            const modelCode = response.model_code || '';
            this.barcodeForm.patchValue({ model_code: modelCode });
            console.log(`✅ Model code fetched: ${modelCode}`);
          }
        },
        error: (err) => {
          console.error('❌ Failed to fetch model code:', err);
          this.barcodeForm.patchValue({ model_code: '' });
        }
      });
  }

  onSearch() {
    console.log('🔍 Searching:', this.searchTerm);
    this.currentPage = 1;
    this.loadMasterData();
  }

  get paginatedData() {
    return this.filteredData;
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
      this.loadMasterData();
    }
  }

  onItemsPerPageChange() {
    console.log(`📋 Items per page changed to: ${this.itemsPerPage}`);
    this.currentPage = 1;
    this.loadMasterData();
  }

  // ==================== MODAL FUNCTIONS ====================

  openAddModal() {
    this.showAddModal = true;
    this.barcodeForm.reset({ quantity: 0, stock: 0 });
    this.errorMessage = '';
    
    // Reload filter options untuk memastikan data terbaru
    this.loadFilterOptions();
    console.log('📝 Opening Add Modal with options:', this.filterOptions);
  }

  openAddByExcelModal() {
    this.showImportModal = true;
    this.selectedFile = null;
    this.errorMessage = '';
  }

  openEditModal(barcode: string) {
    this.selectedBarcode = barcode;
    this.isLoading = true;
    
    // Reload filter options untuk edit modal
    this.loadFilterOptions();
    
    this.http.get<any>(`${environment.apiUrl}/master-data/barcode/${barcode}`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.barcodeForm.patchValue(response.data);
            this.showEditModal = true;
            console.log('✅ Barcode data loaded for edit:', response.data);
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to load barcode data';
          this.isLoading = false;
        }
      });
  }

  openDeleteModal(barcode: string) {
    this.selectedBarcode = barcode;
    this.showDeleteModal = true;
    this.errorMessage = '';
  }

  openStockOpnameModal() {
    this.showStockOpnameModal = true;
    this.selectedFile = null;
    this.errorMessage = '';
  }
  
  openRecordModal() {
    this.showRecordModal = true;
    this.errorMessage = '';
    console.log('📝 Opening record modal');
  }

  openBackupModal() {
    this.showBackupModal = true;
    this.errorMessage = '';
    console.log('📝 Opening backup modal');
  }

  openDuplicateModal() {
    this.showDuplicateModal = true;
    this.errorMessage = '';
    console.log('📝 Opening duplicate modal');
  }

  // ==================== CRUD OPERATIONS ====================

  onAdd() {
    if (this.barcodeForm.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    this.isLoading = true;
    console.log('📤 Adding barcode:', this.barcodeForm.value);
    
    this.http.post(`${environment.apiUrl}/master-data/barcode`, this.barcodeForm.value)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = 'Barcode added successfully!';
            this.showAddModal = false;
            this.loadMasterData();
            setTimeout(() => this.successMessage = '', 3000);
            console.log('✅ Barcode added successfully');
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to add barcode';
          this.isLoading = false;
          console.error('❌ Failed to add barcode:', err);
        }
      });
  }

  onEdit() {
    if (this.barcodeForm.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    this.isLoading = true;
    console.log('📤 Updating barcode:', this.selectedBarcode);
    
    this.http.put(`${environment.apiUrl}/master-data/barcode/${this.selectedBarcode}`, this.barcodeForm.value)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = 'Barcode updated successfully!';
            this.showEditModal = false;
            this.loadMasterData();
            setTimeout(() => this.successMessage = '', 3000);
            console.log('✅ Barcode updated successfully');
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to update barcode';
          this.isLoading = false;
          console.error('❌ Failed to update barcode:', err);
        }
      });
  }

  onDelete() {
    this.isLoading = true;
    console.log('🗑️ Deleting barcode:', this.selectedBarcode);
    
    this.http.delete(`${environment.apiUrl}/master-data/barcode/${this.selectedBarcode}`)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = 'Barcode deleted successfully!';
            this.showDeleteModal = false;
            this.loadMasterData();
            setTimeout(() => this.successMessage = '', 3000);
            console.log('✅ Barcode deleted successfully');
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to delete barcode';
          this.isLoading = false;
          console.error('❌ Failed to delete barcode:', err);
        }
      });
  }

  closeModal() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showImportModal = false;
    this.showStockOpnameModal = false;
    this.showRecordModal = false;
    this.showBackupModal = false;
    this.showDuplicateModal = false;
    this.selectedBarcode = '';
    this.selectedFile = null;
    this.errorMessage = '';
  }

  // ==================== FILE HANDLING ====================

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      if (allowedTypes.includes(file.type)) {
        this.selectedFile = file;
        this.errorMessage = '';
      } else {
        this.errorMessage = 'Please select a valid Excel or CSV file';
        this.selectedFile = null;
      }
    }
  }

  onImportExcel() {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file';
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post(`${environment.apiUrl}/master-data/import-barcode`, formData)
      .subscribe({
        next: (response: any) => {
          this.successMessage = response.message || 'Import successful!';
          this.closeModal();
          this.loadMasterData();
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Import failed';
          this.isLoading = false;
        }
      });
  }

  onImportStockOpname() {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file';
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post(`${environment.apiUrl}/master-data/import-stock-opname`, formData)
      .subscribe({
        next: (response: any) => {
          this.successMessage = response.message || 'Stock opname import successful!';
          this.closeModal();
          this.loadMasterData();
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Import failed';
          this.isLoading = false;
        }
      });
  }

  // ==================== EXPORT FUNCTIONS ====================

  downloadFormatExcel() {
    console.log('📥 Downloading format Excel...');
    
    const headers = [
      'ORIGINAL_BARCODE', 'BRAND', 'COLOR', 'SIZE', 'FOUR_DIGIT', 'UNIT', 
      'QUANTITY', 'PRODUCTION', 'MODEL', 'MODEL_CODE', 'ITEM', 'STOCK'
    ];
    
    const sampleRow = [
      'SAMPLE123', 'ADIDAS', 'BLACK', '10', '0036', 'PRS', 
      '100', 'PT HSK REMBANG', 'BOOST', 'BST', 'IP', '0'
    ];

    let csvContent = headers.join(',') + '\n';
    csvContent += sampleRow.join(',') + '\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Format_Import_Master_Data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.successMessage = 'Format Excel downloaded successfully!';
    setTimeout(() => this.successMessage = '', 3000);
  }

  printMasterData() {
    console.log('🖨️ Printing master data...');
    window.print();
  }
}