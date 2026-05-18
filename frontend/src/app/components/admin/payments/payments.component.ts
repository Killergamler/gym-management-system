import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit, OnDestroy {
  payments: any[] = [];
  members: any[] = [];
  plans: any[] = [];
  loading = true;
  showForm = false;
  saving = false;
  msg = '';
  msgType = 'success';
  payForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.payForm = this.fb.group({
      member: ['', Validators.required],
      plan: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      method: ['Cash', Validators.required],
      status: ['Paid', Validators.required],
      date: [new Date().toISOString().split('T')[0]]
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAll(): void {
    this.loading = true;
    this.api
      .getPayments()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (r) => {
          this.payments = r.payments || [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        }
      });

    this.api.getMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((r) => {
        this.members = r.members || [];
        this.cdr.markForCheck();
      });
    this.api.getPlans()
      .pipe(takeUntil(this.destroy$))
      .subscribe((r) => {
        this.plans = r.plans || [];
        this.cdr.markForCheck();
      });
  }

  onPlanChange(): void {
    const planId = this.payForm.get('plan')?.value;
    const plan = this.plans.find((p) => p._id === planId);
    if (plan) this.payForm.patchValue({ amount: plan.price });
  }

  save(): void {
    if (this.saving) return;
    if (this.payForm.invalid) {
      this.payForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.msg = '';
    const data = { ...this.payForm.value, date: new Date(this.payForm.value.date) };

    this.api
      .createPayment(data)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.msg = 'Payment recorded successfully';
          this.msgType = 'success';
          this.showForm = false;
          this.payForm.reset({ method: 'Cash', status: 'Paid', date: new Date().toISOString().split('T')[0] });
          this.cdr.markForCheck();
          this.loadAll();
        },
        error: (e) => {
          this.msg = e.error?.message || 'Error recording payment';
          this.msgType = 'error';
          this.cdr.markForCheck();
        }
      });
  }

  get totalCollected(): number {
    return this.payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  }

  get totalPending(): number {
    return this.payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
  }

  isInvalid(f: string): boolean {
    const c = this.payForm.get(f);
    return !!(c?.invalid && c?.touched);
  }
}

