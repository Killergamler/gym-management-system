import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { MemberContextService } from '../../../services/member-context.service';
import { MemberPortalService } from '../../../services/member-portal.service';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class UserLayoutComponent implements OnInit, OnDestroy {
  user: any;
  member: any;
  loadingNotifications = false;
  notificationOpen = false;
  notifications: any[] = [];
  unreadCount = 0;
  private routeSub?: Subscription;
  private destroy$ = new Subject<void>();
  @ViewChild('notifWrap', { read: ElementRef }) notifWrap?: ElementRef;

  navItems = [
    { path: '/user/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/user/workouts', label: 'Workouts', icon: '🏋️' },
    { path: '/user/membership', label: 'Plans', icon: '📦' },
    { path: '/user/attendance', label: 'Attendance', icon: '📅' }
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private memberContext: MemberContextService,
    private memberApi: MemberPortalService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private hostRef: ElementRef<HTMLElement>
  ) {
    this.user = this.auth.getUser();
  }

  onOutsideClick(event: MouseEvent): void {
    if (!this.notificationOpen) return;
    const target = event.target as Node;
    const notifWrap = this.hostRef.nativeElement.querySelector('.notif-wrap');
    if (notifWrap && !notifWrap.contains(target)) {
      this.notificationOpen = false;
    }
  }

  ngOnInit(): void {
    this.routeSub = this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.notificationOpen = false;
      });

    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.routeSub?.unsubscribe();
  }

  private async loadInitialData(): Promise<void> {
    try {
      this.member = await this.memberContext.getMember();
      await this.loadNotifications();
    } catch {
      // no-op; child screens handle missing member profile
    } finally {
      this.cdr.detectChanges();
    }
  }

  async loadNotifications(): Promise<void> {
    if (!this.member?._id || this.loadingNotifications) return;
    this.loadingNotifications = true;
    this.cdr.detectChanges();

    try {
      const res = await this.memberApi.getNotifications(this.member._id);
      this.ngZone.run(() => {
        this.notifications = res.notifications || [];
        this.unreadCount = res.unreadCount || 0;
      });
    } finally {
      this.ngZone.run(() => {
        this.loadingNotifications = false;
        this.cdr.detectChanges();
      });
    }
  }

  async markAsRead(notification: any, event?: Event): Promise<void> {
    event?.stopPropagation();
    if (notification.isRead) return;
    try {
      await this.memberApi.markNotificationAsRead(notification._id);
      this.ngZone.run(() => {
        notification.isRead = true;
        this.unreadCount = Math.max(this.unreadCount - 1, 0);
        this.cdr.detectChanges();
      });
    } catch {
      // keep ui unchanged if action fails
    }
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.notificationOpen = !this.notificationOpen;
  }

  logout(): void {
    this.auth.logout();
  }

  goDashboard(): void {
    this.router.navigate(['/user/dashboard']);
  }
}
