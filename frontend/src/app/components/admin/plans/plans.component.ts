import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit, OnDestroy {
  plans: any[] = [];
  loading = true;
  saving = false;
  deleting = '';
  showForm = false;
  editId = '';
  msg = '';
  error = '';
  planForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.planForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      duration: [1, [Validators.required, Validators.min(1)]],
      price: [999, [Validators.required, Validators.min(1)]],
      features: ['Gym Access, Locker Room'],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadPlans();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlans(): void {
    this.loading = true;
    this.error = '';

    this.api
      .getPlans({ includeInactive: true })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.plans = res.plans || [];
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load plans';
          this.cdr.markForCheck();
        }
      });
  }

  openAdd(): void {
    this.editId = '';
    this.msg = '';
    this.planForm.reset({
      name: '',
      duration: 1,
      price: 999,
      features: 'Gym Access, Locker Room',
      isActive: true
    });
    this.showForm = true;
  }

  openEdit(plan: any): void {
    this.editId = plan._id;
    this.msg = '';
    this.planForm.patchValue({
      name: plan.name,
      duration: plan.duration,
      price: plan.price,
      features: (plan.features || []).join(', '),
      isActive: plan.isActive
    });
    this.showForm = true;
  }

  savePlan(): void {
    if (this.saving) return;
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';
    const raw = this.planForm.value;
    const payload = {
      name: String(raw.name || '').trim(),
      duration: Number(raw.duration),
      price: Number(raw.price),
      features: String(raw.features || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      isActive: !!raw.isActive
    };

    const request$ = this.editId ? this.api.updatePlan(this.editId, payload) : this.api.createPlan(payload);

    request$
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.msg = this.editId ? 'Plan updated successfully' : 'Plan created successfully';
          this.showForm = false;
          this.cdr.markForCheck();
          this.loadPlans();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to save plan';
          this.cdr.markForCheck();
        }
      });
  }

  removePlan(plan: any): void {
    if (this.deleting) return;
    if (!confirm(`Delete plan "${plan.name}"?`)) return;
    this.deleting = plan._id;
    this.error = '';

    this.api
      .deletePlan(plan._id)
      .pipe(
        finalize(() => {
          this.deleting = '';
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.loadPlans();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to delete plan';
          this.cdr.markForCheck();
        }
      });
  }
}
