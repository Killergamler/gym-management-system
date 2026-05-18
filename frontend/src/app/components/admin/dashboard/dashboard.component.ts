import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: any = {
    totalMembers: 0,
    activeMembers: 0,
    monthlyRevenue: 0,
    pendingFees: 0,
    totalTrainers: 0,
    todayAttendance: 0
  };
  revenueData: any[] = [];
  members: any[] = [];
  loading = true;
  refreshing = false;
  error = '';
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboard(): void {
    if (this.refreshing) return;
    this.refreshing = true;
    this.loading = true;
    this.error = '';

    this.api
      .getDashboardStats()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.refreshing = false;
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.stats = res.stats || this.stats;
          this.revenueData = res.revenueData || [];
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err.error?.message || 'Could not load dashboard stats';
          this.cdr.markForCheck();
        }
      });

    this.api.getMembers({ limit: 6 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.members = res.members || [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        }
      });
  }

  get maxRevenue(): number {
    return Math.max(...this.revenueData.map((r) => r.total), 1);
  }
}

