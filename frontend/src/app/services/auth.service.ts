import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl;
  private userSubject = new BehaviorSubject<any>(this.getStoredUser());
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private getStoredUser(): any {
    try {
      const u = localStorage.getItem('gym_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }

  private setSession(res: any): void {
    localStorage.setItem('gym_token', res.token);
    localStorage.setItem('gym_user', JSON.stringify(res.user));
    this.userSubject.next(res.user);
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.api}/auth/login`, { email, password }).pipe(
      tap((res: any) => {
        if (res.success) this.setSession(res);
      })
    );
  }

  register(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: 'member' | 'trainer' | 'admin';
  }): Observable<any> {
    return this.http.post(`${this.api}/auth/register`, payload).pipe(
      tap((res: any) => {
        if (res.success) this.setSession(res);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('gym_token');
  }

  getUser(): any {
    return this.userSubject.value;
  }

  setUser(user: any): void {
    localStorage.setItem('gym_user', JSON.stringify(user));
    this.userSubject.next(user);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getUser()?.role === 'admin';
  }

  hasRole(role: string): boolean {
    return this.getUser()?.role === role;
  }
}
