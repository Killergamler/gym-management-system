import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MemberContextService } from '../../../services/member-context.service';
import { MemberPortalService } from '../../../services/member-portal.service';

type MembershipAction = 'buy' | 'renew' | 'upgrade';

@Component({
  selector: 'app-membership',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './membership.component.html',
  styleUrls: ['./membership.component.scss']
})
export class MembershipComponent implements OnInit {
  member: any = null;
  plans: any[] = [];
  dashboard: any = null;
  loading = true;
  processing = false;
  error = '';
  success = '';
  modalOpen = false;
  selectedPlan: any = null;
  action: MembershipAction = 'buy';
  purchaseForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private memberContext: MemberContextService,
    private memberApi: MemberPortalService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.purchaseForm = this.fb.group({
      method: ['Cash', Validators.required]
    });
  }

  get statusBadgeClass(): string {
    return this.dashboard?.membershipStatus === 'Active' ? 'active' : 'expired';
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.ngZone.run(() => {
      this.loading = true;
      this.error = '';
      this.cdr.detectChanges();
    });

    try {
      const member = await this.memberContext.getMember(true);
      const [plansRes, dashboardRes] = await Promise.all([
        this.memberApi.getPlans(),
        this.memberApi.getMemberDashboard(member._id)
      ]);
      this.ngZone.run(() => {
        this.member = member;
        this.plans = plansRes.plans || [];
        this.dashboard = dashboardRes.dashboard;
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.error = err.message || 'Failed to load membership plans';
      });
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }

  openPurchase(plan: any, action: MembershipAction): void {
    this.ngZone.run(() => {
      this.selectedPlan = plan;
      this.action = action;
      this.purchaseForm.reset({ method: 'Cash' });
      this.modalOpen = true;
      this.error = '';
      this.success = '';
      this.cdr.detectChanges();
    });
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  async submitPurchase(): Promise<void> {
    if (this.processing) return;
    if (!this.member?._id || !this.selectedPlan?._id) return;
    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      return;
    }

    this.ngZone.run(() => {
      this.processing = true;
      this.error = '';
      this.success = '';
      this.cdr.detectChanges();
    });

    const payload = {
      memberId: this.member._id,
      planId: this.selectedPlan._id,
      method: this.purchaseForm.value.method
    };

    try {
      if (this.action === 'buy') await this.memberApi.buyMembership(payload);
      if (this.action === 'renew') await this.memberApi.renewMembership(payload);
      if (this.action === 'upgrade') await this.memberApi.upgradeMembership(payload);

      this.ngZone.run(() => {
        this.success = `Membership ${this.action} completed successfully`;
        this.modalOpen = false;
      });
      await this.loadData();
    } catch (err: any) {
      this.ngZone.run(() => {
        this.error = err.message || `Failed to ${this.action} membership`;
      });
    } finally {
      this.ngZone.run(() => {
        this.processing = false;
        this.cdr.detectChanges();
      });
    }
  }
}
