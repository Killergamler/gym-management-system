import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  loading = false;
  error = '';
  submitted = false;
  mode: 'login' | 'register' = 'login';
  activeRole: 'admin' | 'member' = 'admin';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['admin@gym.com', [Validators.required, Validators.email]],
      password: ['admin123', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (this.auth.isLoggedIn()) {
      this.router.navigate([this.auth.isAdmin() ? '/admin/dashboard' : '/user/dashboard']);
    }
  }

  switchMode(mode: 'login' | 'register'): void {
    this.mode = mode;
    this.error = '';
    this.submitted = false;
  }

  switchRole(role: 'admin' | 'member'): void {
    this.activeRole = role;
    this.error = '';
    this.submitted = false;
    if (role === 'admin') this.loginForm.setValue({ email: 'admin@gym.com', password: 'admin123' });
    else this.loginForm.setValue({ email: 'user@gym.com', password: 'user123' });
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  onLoginSubmit(): void {
    if (this.loading) return;
    this.submitted = true;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    const email = String(this.loginForm.value.email || '').trim().toLowerCase();
    const password = String(this.loginForm.value.password || '');

    this.auth.login(email, password).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigate([res.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard']);
        } else {
          this.error = res.message || 'Login failed';
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }

  onRegisterSubmit(): void {
    if (this.loading) return;
    this.submitted = true;
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    const payload = {
      ...this.registerForm.value,
      email: String(this.registerForm.value.email || '').trim().toLowerCase(),
      role: 'member' as const
    };

    this.auth.register(payload).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigate(['/user/dashboard']);
        } else {
          this.error = res.message || 'Registration failed';
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed';
      }
    });
  }
}
