import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, Transaction } from '../../../core/services/transaction.service';
import { AuthService } from '../../../core/auth/auth.service';


@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction.component.html',
  styleUrl: './transaction.component.scss'
})
export class TransactionComponent implements OnInit {

  transactions: Transaction[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalItems = 0;
  Math = Math;

  // Modal states
  showEditModal = false;
  showDeleteModal = false;
  selectedTransaction: Transaction | null = null;

  // Form data
  transactionForm: Transaction = {
    no: 0,
    stock_awal: 0,
    receiving: 0,
    shipping: 0,
    stock_akhir: 0,
    date: ''
  };

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.isLoading = true;
    this.transactionService.getAll(this.currentPage, this.itemsPerPage, this.searchTerm).subscribe({
      next: (response) => {
        console.log('✅ Transactions loaded:', response);
        this.transactions = response.data;
        this.currentPage = response.pagination.page;
        this.totalPages = response.pagination.totalPages;
        this.totalItems = response.pagination.total;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Failed to load transactions:', err);
        this.errorMessage = err.error?.error || 'Failed to load transactions';
        this.isLoading = false;
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadTransactions();
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.loadTransactions();
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
      this.currentPage = page;
      this.loadTransactions();
    }
  }

  hasEditPermission(): boolean {
    return this.authService.hasPosition('IT');
  }

  openEditModal(transaction: Transaction) {
    this.selectedTransaction = transaction;
    this.transactionForm = { ...transaction };
    this.showEditModal = true;
    this.errorMessage = '';
  }

  openDeleteModal(transaction: Transaction) {
    this.selectedTransaction = transaction;
    this.showDeleteModal = true;
    this.errorMessage = '';
  }

  closeModal() {
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedTransaction = null;
    this.errorMessage = '';
  }

  onEdit() {
    if (!this.selectedTransaction) return;
    if (!this.validateEditForm()) return;

    this.isLoading = true;
    const payload = {
      stock_awal: this.transactionForm.stock_awal,
      receiving: this.transactionForm.receiving,
      shipping: this.transactionForm.shipping,
      stock_akhir: this.transactionForm.stock_akhir
    };

    this.transactionService.update(this.selectedTransaction.no, payload).subscribe({
      next: () => {
        this.successMessage = 'Transaction updated successfully!';
        this.closeModal();
        this.loadTransactions();
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to update transaction';
        this.isLoading = false;
      }
    });
  }

  onDelete() {
    if (!this.selectedTransaction) return;

    this.isLoading = true;
    this.transactionService.delete(this.selectedTransaction.no).subscribe({
      next: () => {
        this.successMessage = 'Transaction deleted successfully!';
        this.closeModal();
        this.loadTransactions();
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to delete transaction';
        this.isLoading = false;
      }
    });
  }

  validateEditForm(): boolean {
    if (this.transactionForm.stock_awal === undefined || this.transactionForm.stock_awal === null) {
      this.errorMessage = 'First stock is required';
      return false;
    }
    if (this.transactionForm.receiving === undefined || this.transactionForm.receiving === null) {
      this.errorMessage = 'Receiving is required';
      return false;
    }
    if (this.transactionForm.shipping === undefined || this.transactionForm.shipping === null) {
      this.errorMessage = 'Shipping is required';
      return false;
    }
    if (this.transactionForm.stock_akhir === undefined || this.transactionForm.stock_akhir === null) {
      this.errorMessage = 'Warehouse stock is required';
      return false;
    }
    return true;
  }

  exportExcel() {
    this.isLoading = true;
    this.transactionService.exportExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Transaction_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.successMessage = 'Transaction exported successfully!';
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to export transactions';
        this.isLoading = false;
      }
    });
  }

}
