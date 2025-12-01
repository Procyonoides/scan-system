import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface User {
  user_id?: number;
  id_user?: number;
  username: string;
  email?: string;
  full_name?: string;
  position: string;
  description?: string;
  status?: string;
  created_at?: string;
  last_login?: string;
}

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent implements OnInit {

  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  Math = Math;

  // Modal states
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedUser: User | null = null;

  // Form data
  userForm: User = {
    username: '',
    email: '',
    full_name: '',
    position: '',
    description: '',
    status: 'ACTIVE'
  };

  positions = ['IT', 'MANAGEMENT', 'RECEIVING', 'SHIPPING', 'SERVER'];
  statuses = ['ACTIVE', 'INACTIVE'];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.http.get<User[]>(`${environment.apiUrl}/users`).subscribe({
      next: (data) => {
        console.log('✅ Users loaded:', data);
        this.users = data;
        this.filteredUsers = data;
        this.calculatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Failed to load users:', err);
        this.errorMessage = err.error?.error || 'Failed to load users';
        this.isLoading = false;
      }
    });
  }

  onSearch() {
    if (!this.searchTerm) {
      this.filteredUsers = this.users;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(user =>
        user.username?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.full_name?.toLowerCase().includes(term) ||
        user.position?.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  }

  get paginatedUsers() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUsers.slice(start, start + this.itemsPerPage);
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

  openAddModal() {
    this.userForm = {
      username: '',
      email: '',
      full_name: '',
      position: '',
      description: '',
      status: 'ACTIVE'
    };
    this.showAddModal = true;
    this.errorMessage = '';
  }

  openEditModal(user: User) {
    this.selectedUser = user;
    this.userForm = { ...user };
    this.showEditModal = true;
    this.errorMessage = '';
  }

  openDeleteModal(user: User) {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  closeModal() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedUser = null;
    this.errorMessage = '';
  }

  onAdd() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.http.post(`${environment.apiUrl}/users`, this.userForm).subscribe({
      next: () => {
        this.successMessage = 'User added successfully!';
        this.closeModal();
        this.loadUsers();
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to add user';
        this.isLoading = false;
      }
    });
  }

  onEdit() {
    if (!this.selectedUser) return;

    this.isLoading = true;
    const userId = this.selectedUser.user_id || this.selectedUser.id_user;
    
    this.http.put(`${environment.apiUrl}/users/${userId}`, this.userForm).subscribe({
      next: () => {
        this.successMessage = 'User updated successfully!';
        this.closeModal();
        this.loadUsers();
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to update user';
        this.isLoading = false;
      }
    });
  }

  onDelete() {
    if (!this.selectedUser) return;

    this.isLoading = true;
    const userId = this.selectedUser.user_id || this.selectedUser.id_user;

    this.http.delete(`${environment.apiUrl}/users/${userId}`).subscribe({
      next: () => {
        this.successMessage = 'User deleted successfully!';
        this.closeModal();
        this.loadUsers();
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to delete user';
        this.isLoading = false;
      }
    });
  }

  validateForm(): boolean {
    if (!this.userForm.username || this.userForm.username.trim() === '') {
      this.errorMessage = 'Username is required';
      return false;
    }
    if (!this.userForm.position || this.userForm.position.trim() === '') {
      this.errorMessage = 'Position is required';
      return false;
    }
    return true;
  }

  getStatusBadgeClass(status?: string): string {
    return status === 'ACTIVE' ? 'bg-success' : 'bg-secondary';
  }

  getPositionBadgeClass(position: string): string {
    const classes: { [key: string]: string } = {
      'IT': 'bg-primary',
      'MANAGEMENT': 'bg-info',
      'RECEIVING': 'bg-success',
      'SHIPPING': 'bg-warning',
      'SERVER': 'bg-danger'
    };
    return classes[position] || 'bg-secondary';
  }

}
