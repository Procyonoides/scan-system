import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value as any).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Login failed';
      }
    });
  }

}
