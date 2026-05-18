import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pw">
      <div class="ph">
        <h2>Attendance Analytics</h2>
      </div>

      <div class="error" *ngIf="error">{{ error }}</div>
      <div class="loading-wrap" *ngIf="loading">
        <div class="spinner"></div>
        Loading attendance...
      </div>

      <div class="stats-row" *ngIf="!loading">
        <div class="sc" *ngFor="let d of weekly">
          <div class="day">{{ d.day }}</div>
          <div class="bar-w">
            <div class="bar-f" [style.height.%]="d.count ? (d.count / maxWeekly) * 100 : 3"></div>
          </div>
          <div class="cnt">{{ d.count }}</div>
        </div>
      </div>

      <div class="card" *ngIf="!loading">
        <div class="ch">
          <h3>Recent Check-ins</h3>
        </div>
        <div class="tw" *ngIf="records.length; else noRows">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Member ID</th>
                <th>Date</th>
                <th>Check In Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of records">
                <td><strong>{{ r.memberId?.name }}</strong></td>
                <td>{{ r.memberId?.memberId || '--' }}</td>
                <td class="mid">{{ r.date | date: 'dd MMM yyyy' }}</td>
                <td>{{ r.checkInTime | date: 'hh:mm a' }}</td>
                <td><span class="tag active">{{ r.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noRows>
          <p class="empty">No attendance records available.</p>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `
      .pw {
        display: grid;
        gap: 1.3rem;
      }
      .ph h2 {
        font-size: 1.8rem;
        font-weight: 900;
        color: #e8f0fe;
      }
      .stats-row {
        display: flex;
        gap: 0.75rem;
        background: rgba(13, 17, 32, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 1.25rem;
        padding: 1.5rem;
        align-items: flex-end;
        height: 180px;
      }
      .sc {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        height: 100%;
      }
      .day,
      .cnt {
        font-size: 0.75rem;
        color: #8095b4;
        font-weight: 700;
      }
      .bar-w {
        width: 100%;
        flex: 1;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 0.5rem;
        display: flex;
        align-items: flex-end;
      }
      .bar-f {
        width: 100%;
        background: linear-gradient(180deg, #7c3aed, #06b6d4);
        border-radius: 0.5rem;
        min-height: 6px;
        transition: height 0.8s;
      }
      .card {
        background: rgba(13, 17, 32, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 1.25rem;
        padding: 1.5rem;
      }
      .ch h3 {
        color: #e8f0fe;
        font-weight: 800;
        margin-bottom: 1rem;
      }
      .tw {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 0.9rem 0.8rem;
        text-align: left;
        font-size: 0.85rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      th {
        color: #8095b4;
        font-weight: 700;
        font-size: 0.75rem;
        text-transform: uppercase;
      }
      .mid {
        color: #8095b4;
      }
      .tag.active {
        background: rgba(34, 197, 94, 0.12);
        color: #86efac;
        padding: 0.3rem 0.7rem;
        border-radius: 9999px;
        font-size: 0.73rem;
        font-weight: 800;
      }
      .loading-wrap {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        color: #9aa8c7;
      }
      .spinner {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.25);
        border-top-color: #fff;
        animation: spin 1s linear infinite;
      }
      .error {
        background: rgba(244, 63, 94, 0.15);
        color: #fda4af;
        border-radius: 0.75rem;
        padding: 0.8rem;
      }
      .empty {
        color: #9aa8c7;
        font-size: 0.9rem;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `
  ]
})
export class AttendanceComponent implements OnInit {
  records: any[] = [];
  weekly: any[] = [];
  loading = true;
  error = '';

  constructor(private api: ApiService) {}

  get maxWeekly(): number {
    return Math.max(...this.weekly.map((w) => w.count), 1);
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = '';

    this.api
      .getAttendance()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (res) => {
          this.records = res.records || [];
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load attendance records';
        }
      });

    this.api.getWeeklyStats().subscribe({
      next: (res) => {
        this.weekly = res.days || [];
      }
    });
  }
}
