import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberContextService } from '../../../services/member-context.service';
import { MemberPortalService } from '../../../services/member-portal.service';

@Component({
  selector: 'app-user-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class UserAttendanceComponent implements OnInit {
  member: any = null;
  records: any[] = [];
  monthlyCount = 0;
  loading = true;
  checkingIn = false;
  error = '';
  success = '';

  constructor(
    private memberContext: MemberContextService,
    private memberApi: MemberPortalService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  get totalAttendance(): number {
    return this.records.length;
  }

  ngOnInit(): void {
    this.loadAttendance();
  }

  async loadAttendance(): Promise<void> {
    this.ngZone.run(() => {
      this.loading = true;
      this.error = '';
      this.cdr.detectChanges();
    });

    try {
      const member = await this.memberContext.getMember();
      const res = await this.memberApi.getAttendanceHistory(member._id);
      this.ngZone.run(() => {
        this.member = member;
        this.records = res.records || [];
        this.monthlyCount = res.monthlyCount || 0;
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.error = err.message || 'Failed to load attendance';
      });
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }

  async checkIn(): Promise<void> {
    if (this.checkingIn || !this.member?._id) return;
    this.ngZone.run(() => {
      this.checkingIn = true;
      this.error = '';
      this.success = '';
      this.cdr.detectChanges();
    });

    try {
      await this.memberApi.checkIn(this.member._id);
      this.ngZone.run(() => {
        this.success = 'Check-in recorded successfully';
      });
      await this.loadAttendance();
    } catch (err: any) {
      this.ngZone.run(() => {
        this.error = err.message || 'Check-in failed';
      });
    } finally {
      this.ngZone.run(() => {
        this.checkingIn = false;
        this.cdr.detectChanges();
      });
    }
  }
}
