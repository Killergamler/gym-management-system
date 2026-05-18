import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberContextService } from '../../../services/member-context.service';
import { MemberPortalService } from '../../../services/member-portal.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {
  loading = true;
  refreshing = false;
  error = '';
  dashboard: any = null;
  member: any = null;
  attendanceSeries: Array<{ label: string; count: number }> = [];

  constructor(
    private memberContext: MemberContextService,
    private memberApi: MemberPortalService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  get paymentTotal(): number {
    return (this.dashboard?.paymentHistory || []).reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
  }

  get unreadNotifications(): number {
    return (this.dashboard?.latestNotifications || []).filter((item: any) => !item.isRead).length;
  }

  get maxAttendanceCount(): number {
    return Math.max(...this.attendanceSeries.map((item) => item.count), 1);
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  private buildAttendanceSeries(records: any[]): Array<{ label: string; count: number }> {
    const grouped = new Map<string, number>();
    const source = [...records].slice(0, 30).reverse();

    source.forEach((record) => {
      const dt = new Date(record.date);
      const label = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      grouped.set(label, (grouped.get(label) || 0) + 1);
    });

    return Array.from(grouped.entries()).map(([label, count]) => ({ label, count }));
  }

  async loadDashboard(): Promise<void> {
    if (this.refreshing) return;
    this.ngZone.run(() => {
      this.refreshing = true;
      this.loading = true;
      this.error = '';
      this.cdr.detectChanges();
    });

    try {
      const member = await this.memberContext.getMember(true);
      const memberId = member?._id;
      if (!memberId) throw new Error('Member profile is not linked to this account');

      const [dashboardRes, paymentsRes, attendanceRes, classesRes] = await Promise.all([
        this.memberApi.getMemberDashboard(memberId),
        this.memberApi.getMemberPayments(memberId),
        this.memberApi.getMemberAttendance(memberId),
        this.memberApi.getUpcomingClasses()
      ]);

      this.ngZone.run(() => {
        this.member = member;
        this.dashboard = {
          ...dashboardRes.dashboard,
          paymentHistory: paymentsRes?.payments || dashboardRes.dashboard?.paymentHistory || [],
          upcomingClasses: classesRes?.classes || dashboardRes.dashboard?.upcomingClasses || []
        };
        this.attendanceSeries = this.buildAttendanceSeries(attendanceRes.records || []);
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.error = err.message || 'Failed to load dashboard';
      });
    } finally {
      this.ngZone.run(() => {
        this.refreshing = false;
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }
}
