import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss']
})
export class MembersComponent implements OnInit, OnDestroy {
  members: any[] = [];
  plans: any[] = [];
  trainers: any[] = [];
  loading = true;
  showForm = false;
  editMode = false;
  editId = '';
  saving = false;
  deleting = '';
  search = '';
  filterStatus = '';
  filterFee = '';
  msg = '';
  msgType = 'success';
  memberForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.memberForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      plan: ['', Validators.required],
      trainer: [''],
      gender: ['Male'],
      feeStatus: ['Pending'],
      status: ['Active'],
      address: [''],
      emergency: ['']
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
      .getMembers()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (r) => {
          this.members = r.members || [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        }
      });

    this.api.getPlans()
      .pipe(takeUntil(this.destroy$))
      .subscribe((r) => {
        this.plans = r.plans || [];
        this.cdr.markForCheck();
      });

    this.api.getTrainers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((r) => {
        this.trainers = r.trainers || [];
        this.cdr.markForCheck();
      });
  }

  openAdd(): void {
    this.editMode = false;
    this.editId = '';
    this.memberForm.reset({ gender: 'Male', feeStatus: 'Pending', status: 'Active' });
    this.msg = '';
    this.showForm = true;
  }

  openEdit(m: any): void {
    this.editMode = true;
    this.editId = m._id;
    this.memberForm.patchValue({
      name: m.name,
      email: m.email,
      phone: m.phone,
      plan: m.plan?._id || m.plan,
      trainer: m.trainer?._id || m.trainer || '',
      gender: m.gender,
      feeStatus: m.feeStatus,
      status: m.status,
      address: m.address || '',
      emergency: m.emergency || ''
    });
    this.msg = '';
    this.showForm = true;
    setTimeout(() => document.querySelector('.card-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  save(): void {
    if (this.saving) return;
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.msg = '';
    const data = this.memberForm.value;
    const call = this.editMode ? this.api.updateMember(this.editId, data) : this.api.createMember(data);

    call.pipe(
      finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.msg = this.editMode ? 'Member updated' : 'Member added';
        this.msgType = 'success';
        this.showForm = false;
        this.memberForm.reset({ gender: 'Male', feeStatus: 'Pending', status: 'Active' });
        this.cdr.markForCheck();
        this.loadAll();
      },
      error: (e) => {
        this.msg = e.error?.message || 'Error saving member';
        this.msgType = 'error';
        this.cdr.markForCheck();
      }
    });
  }

  deleteMember(id: string, name: string): void {
    if (this.deleting) return;
    if (!confirm(`Delete member "${name}"? This cannot be undone.`)) return;
    this.deleting = id;

    this.api
      .deleteMember(id)
      .pipe(
        finalize(() => {
          this.deleting = '';
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.loadAll();
        },
        error: (e) => {
          this.msg = e.error?.message || 'Delete failed';
          this.msgType = 'error';
          this.cdr.markForCheck();
        }
      });
  }

  get filtered(): any[] {
    return this.members.filter((m) => {
      const s = this.search.toLowerCase();
      const matchSearch =
        !s ||
        m.name?.toLowerCase().includes(s) ||
        m.email?.toLowerCase().includes(s) ||
        m.phone?.includes(s) ||
        m.memberId?.toLowerCase().includes(s);
      const matchStatus = !this.filterStatus || m.status === this.filterStatus;
      const matchFee = !this.filterFee || m.feeStatus === this.filterFee;
      return matchSearch && matchStatus && matchFee;
    });
  }

  isInvalid(field: string): boolean {
    const c = this.memberForm.get(field);
    return !!(c?.invalid && c?.touched);
  }
}

