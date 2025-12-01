import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface User {
  id_user: number;
  username: string;
  password?: string;
  position: string;
  description?: string;
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

  // Password visibility tracking
  passwordVisibility: { [key: number]: boolean } = {};

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
    id_user: 0,
    username: '',
    password: '',
    position: '',
    description: ''
  };

  positions = ['IT', 'MANAGEMENT', 'RECEIVING', 'SHIPPING', 'SERVER'];
  
  // Description options based on position
  descriptionOptions: { [key: string]: string[] } = {
    'RECEIVING': ['INCOME', 'CU', 'SAMPLE', 'RETURN', 'GRINDING'],
    'SHIPPING': ['DELIVERY', 'PRESS', 'CU', 'SAMPLE', 'PAINT', 'GRINDING', 'REJECT', 'STOCKFIT']
  };

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
        user.position?.toLowerCase().includes(term) ||
        user.description?.toLowerCase().includes(term)
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
      id_user: 0,
      username: '',
      password: '',
      position: '',
      description: ''
    };
    this.showAddModal = true;
    this.errorMessage = '';
  }

  onPositionChange() {
    // Reset description when position changes
    const position = this.userForm.position;
    if (position === 'RECEIVING' || position === 'SHIPPING') {
      this.userForm.description = '';
    } else {
      this.userForm.description = '-';
    }
  }

  getDescriptionOptions(): string[] {
    const position = this.userForm.position;
    return this.descriptionOptions[position] || [];
  }

  shouldShowDescriptionDropdown(): boolean {
    const position = this.userForm.position;
    return position === 'RECEIVING' || position === 'SHIPPING';
  }

  openEditModal(user: User) {
    this.selectedUser = user;
    this.userForm = {
      id_user: user.id_user,
      username: user.username,
      password: '',
      position: user.position,
      description: user.description || ''
    };
    this.showEditModal = true;
    this.errorMessage = '';
  }

  openDeleteModal(user: User) {
    this.selectedUser = user;
    this.showDeleteModal = true;
    this.errorMessage = '';
  }

  closeModal() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedUser = null;
    this.errorMessage = '';
  }

  onAdd() {
    if (!this.validateAddForm()) {
      return;
    }

    this.isLoading = true;
    const payload = {
      username: this.userForm.username,
      password: this.userForm.password,
      position: this.userForm.position,
      description: this.shouldShowDescriptionDropdown() 
        ? (this.userForm.description || '') 
        : '-'
    };

    this.http.post(`${environment.apiUrl}/users`, payload).subscribe({
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
    if (!this.validateEditForm()) return;

    this.isLoading = true;
    const payload: any = {
      position: this.userForm.position,
      description: this.shouldShowDescriptionDropdown() 
        ? (this.userForm.description || '') 
        : '-'
    };

    // Add password to payload if provided
    if (this.userForm.password && this.userForm.password.trim() !== '') {
      if (this.userForm.password.length < 3) {
        this.errorMessage = 'Password must be at least 3 characters';
        this.isLoading = false;
        return;
      }
      payload.password = this.userForm.password;
    }

    this.http.put(`${environment.apiUrl}/users/${this.selectedUser.id_user}`, payload).subscribe({
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
    this.http.delete(`${environment.apiUrl}/users/${this.selectedUser.id_user}`).subscribe({
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

  validateAddForm(): boolean {
    if (!this.userForm.username || this.userForm.username.trim() === '') {
      this.errorMessage = 'Username is required';
      return false;
    }
    if (!this.userForm.password || this.userForm.password.trim() === '') {
      this.errorMessage = 'Password is required';
      return false;
    }
    if (this.userForm.password.length < 3) {
      this.errorMessage = 'Password must be at least 3 characters';
      return false;
    }
    if (!this.userForm.position || this.userForm.position.trim() === '') {
      this.errorMessage = 'Position is required';
      return false;
    }
    return true;
  }

  validateEditForm(): boolean {
    if (!this.userForm.position || this.userForm.position.trim() === '') {
      this.errorMessage = 'Position is required';
      return false;
    }
    return true;
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

  togglePasswordVisibility(userId: number) {
    this.passwordVisibility[userId] = !this.passwordVisibility[userId];
  }

  isPasswordVisible(userId: number): boolean {
    return !!this.passwordVisibility[userId];
  }

  getDisplayPassword(user: User): string {
    if (this.isPasswordVisible(user.id_user)) {
      return user.password || '***';
    }
    return '•'.repeat(8);
  }
}