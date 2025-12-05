import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { OptionService, Model, Size, Production } from '../../../core/services/option.service';

@Component({
  selector: 'app-option',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './option.component.html',
  styleUrl: './option.component.scss'
})
export class OptionComponent implements OnInit {
  
  // Active Tab
  activeTab: 'model' | 'size' | 'production' = 'model';

  // Data Lists
  models: Model[] = [];
  sizes: Size[] = [];
  productions: Production[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 1;
  Math = Math;

  // Loading & Messages
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // Modal States
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;

  // Form Data
  formData: any = {
    code: '',
    name: ''
  };

  selectedItem: any = null;

  constructor(
    private optionService: OptionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Get initial tab from route data
    this.route.data.subscribe(data => {
      if (data['tab']) {
        this.activeTab = data['tab'];
        this.loadData();
      }
    });
  }

  // ==================== TAB SWITCHING ====================
  
  switchTab(tab: 'model' | 'size' | 'production') {
    this.activeTab = tab;
    this.currentPage = 1;
    this.searchTerm = '';
    this.router.navigate(['/option', tab]);
    this.loadData();
  }

  // ==================== LOAD DATA ====================
  
  loadData() {
  this.isLoading = true;
  this.errorMessage = '';
  
    console.log('🔄 Loading data:', {
      tab: this.activeTab,
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm
    });

    if (this.activeTab === 'model') {
      this.optionService.getModels(this.currentPage, this.itemsPerPage, this.searchTerm).subscribe({
        next: (response) => {
          this.models = response.data;
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.totalPages;
          this.currentPage = response.pagination.page;
          console.log('✅ Models loaded:', response);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Failed to load models:', err);
          this.errorMessage = err.error?.error || 'Failed to load models';
          this.isLoading = false;
        }
      });
    } else if (this.activeTab === 'size') {
      this.optionService.getSizes(this.currentPage, this.itemsPerPage, this.searchTerm).subscribe({
        next: (response) => {
          this.sizes = response.data;
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.totalPages;
          this.currentPage = response.pagination.page;
          console.log('✅ Sizes loaded:', response);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Failed to load sizes:', err);
          this.errorMessage = err.error?.error || 'Failed to load sizes';
          this.isLoading = false;
        }
      });
    } else if (this.activeTab === 'production') {
      this.optionService.getProductions(this.currentPage, this.itemsPerPage, this.searchTerm).subscribe({
        next: (response) => {
          this.productions = response.data;
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.totalPages;
          this.currentPage = response.pagination.page;
          console.log('✅ Productions loaded:', response);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Failed to load productions:', err);
          this.errorMessage = err.error?.error || 'Failed to load productions';
          this.isLoading = false;
        }
      });
    }
  }

  // ==================== SEARCH & PAGINATION ====================

  onSearch() {
    console.log('🔍 Searching:', this.searchTerm);
    this.currentPage = 1;
    this.loadData();
  }

  onItemsPerPageChange() {
    console.log('📋 Items per page changed to:', this.itemsPerPage);
    this.currentPage = 1;
    this.loadData();
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
      pages.push (i);
    }
      return pages;
  }
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      console.log('📄 Going to page:', page);
      this.currentPage = page;
      this.loadData();
    }
  }

  // ==================== MODAL FUNCTIONS ====================
  
  openAddModal() {
    this.formData = { code: '', name: '' };
    this.showAddModal = true;
    this.errorMessage = '';
  }

  openEditModal(item: any) {
    this.selectedItem = item;
    
    if (this.activeTab === 'model') {
      this.formData = { code: item.model_code, name: item.model };
    } else if (this.activeTab === 'size') {
      this.formData = { code: item.size_code, name: item.size };
    } else if (this.activeTab === 'production') {
      this.formData = { code: item.production_code, name: item.production };
    }
    
    this.showEditModal = true;
    this.errorMessage = '';
  }

  openDeleteModal(item: any) {
    this.selectedItem = item;
    this.showDeleteModal = true;
    this.errorMessage = '';
  }

  closeModal() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedItem = null;
    this.formData = { code: '', name: '' };
    this.errorMessage = '';
  }

  // ==================== CRUD OPERATIONS ====================
  
  onAdd() {
    if (!this.formData.code || !this.formData.name) {
      this.errorMessage = 'All fields are required';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.activeTab === 'model') {
      this.optionService.addModel({
        model_code: this.formData.code,
        model: this.formData.name
      }).subscribe({
        next: () => {
          this.successMessage = 'Model added successfully!';
          this.closeModal();
          this.loadData();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to add model';
          this.isLoading = false;
        }
      });
    } else if (this.activeTab === 'size') {
      this.optionService.addSize({
        size_code: this.formData.code,
        size: this.formData.name
      }).subscribe({
        next: () => {
          this.successMessage = 'Size added successfully!';
          this.closeModal();
          this.loadData();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to add size';
          this.isLoading = false;
        }
      });
    } else if (this.activeTab === 'production') {
      this.optionService.addProduction({
        production_code: this.formData.code,
        production: this.formData.name
      }).subscribe({
        next: () => {
          this.successMessage = 'Production added successfully!';
          this.closeModal();
          this.loadData();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to add production';
          this.isLoading = false;
        }
      });
    }
  }

  onEdit() {
    if (!this.formData.name) {
      this.errorMessage = 'Name is required';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.activeTab === 'model') {
      this.optionService.updateModel(this.formData.code, {
        model: this.formData.name
      }).subscribe({
        next: () => {
          this.successMessage = 'Model updated successfully!';
          this.closeModal();
          this.loadData();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to update model';
          this.isLoading = false;
        }
      });
    } else if (this.activeTab === 'size') {
      this.optionService.updateSize(this.formData.code, {
        size: this.formData.name
      }).subscribe({
        next: () => {
          this.successMessage = 'Size updated successfully!';
          this.closeModal();
          this.loadData();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to update size';
          this.isLoading = false;
        }
      });
    } else if (this.activeTab === 'production') {
      this.optionService.updateProduction(this.formData.code, {
        production: this.formData.name
      }).subscribe({
        next: () => {
          this.successMessage = 'Production updated successfully!';
          this.closeModal();
          this.loadData();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to update production';
          this.isLoading = false;
        }
      });
    }
  }

  onDelete() {
    if (!this.selectedItem) return;

    this.isLoading = true;
    this.errorMessage = '';

    if (this.activeTab === 'model') {
      this.optionService.deleteModel(this.selectedItem.model_code).subscribe({
        next: () => {
          this.successMessage = 'Model deleted successfully!';
          this.closeModal();
          this.loadData();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to delete model';
          this.isLoading = false;
        }
      });
    } else if (this.activeTab === 'size') {
      this.optionService.deleteSize(this.selectedItem.size_code).subscribe({
        next: () => {
          this.successMessage = 'Size deleted successfully!';
          this.closeModal();
          this.loadData();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to delete size';
          this.isLoading = false;
        }
      });
    } else if (this.activeTab === 'production') {
      this.optionService.deleteProduction(this.selectedItem.production_code).subscribe({
        next: () => {
          this.successMessage = 'Production deleted successfully!';
          this.closeModal();
          this.loadData();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to delete production';
          this.isLoading = false;
        }
      });
    }
  }

  // ==================== HELPER FUNCTIONS ====================
  
  getActiveData(): any[] {
    if (this.activeTab === 'model') return this.models;
    if (this.activeTab === 'size') return this.sizes;
    if (this.activeTab === 'production') return this.productions;
    return [];
  }

  getItemCode(item: any): string {
    if (this.activeTab === 'model') return item.model_code;
    if (this.activeTab === 'size') return item.size_code;
    if (this.activeTab === 'production') return item.production_code;
    return '';
  }

  getItemName(item: any): string {
    if (this.activeTab === 'model') return item.model;
    if (this.activeTab === 'size') return item.size;
    if (this.activeTab === 'production') return item.production;
    return '';
  }

  getTabTitle(): string {
    if (this.activeTab === 'model') return 'Model';
    if (this.activeTab === 'size') return 'Size';
    if (this.activeTab === 'production') return 'Production';
    return '';
  }

  getCodeMaxLength(): number {
    if (this.activeTab === 'model') return 3;
    if (this.activeTab === 'size') return 4;
    if (this.activeTab === 'production') return 2;
    return 10;
  }

  getNameMaxLength(): number {
    if (this.activeTab === 'model') return 35;
    if (this.activeTab === 'size') return 4;
    if (this.activeTab === 'production') return 30;
    return 50;
  }
}