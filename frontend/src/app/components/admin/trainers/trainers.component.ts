import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-trainers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './trainers.component.html',
  styleUrls: ['./trainers.component.scss']
})
export class TrainersComponent implements OnInit, OnDestroy {
  trainers: any[] = [];
  loading = true;
  showForm = false;
  editMode = false;
  editId = '';
  saving = false;
  deleting = '';
  msg = '';
  msgType = 'success';
  trainerForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.trainerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      specialty: ['', Validators.required],
      shift: ['Morning', Validators.required],
      experience: [0],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    this.api
      .getTrainers()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (r) => {
          this.trainers = r.trainers || [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        }
      });
  }

  openAdd(): void {
    this.editMode = false;
    this.editId = '';
    this.trainerForm.reset({ shift: 'Morning', experience: 0, isActive: true });
    this.msg = '';
    this.showForm = true;
  }

  openEdit(t: any): void {
    this.editMode = true;
    this.editId = t._id;
    this.trainerForm.patchValue({
      name: t.name,
      email: t.email,
      phone: t.phone,
      specialty: t.specialty,
      shift: t.shift,
      experience: t.experience,
      isActive: t.isActive
    });
    this.msg = '';
    this.showForm = true;
  }

  save(): void {
    if (this.saving) return;
    if (this.trainerForm.invalid) {
      this.trainerForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.msg = '';
    const call = this.editMode
      ? this.api.updateTrainer(this.editId, this.trainerForm.value)
      : this.api.createTrainer(this.trainerForm.value);

    call.pipe(
      finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.msg = this.editMode ? 'Trainer updated' : 'Trainer added';
        this.msgType = 'success';
        this.showForm = false;
        this.cdr.markForCheck();
        this.load();
      },
      error: (e) => {
        this.msg = e.error?.message || 'Error saving trainer';
        this.msgType = 'error';
        this.cdr.markForCheck();
      }
    });
  }

  deleteTrainer(id: string, name: string): void {
    if (this.deleting) return;
    if (!confirm(`Delete trainer "${name}"?`)) return;
    this.deleting = id;

    this.api
      .deleteTrainer(id)
      .pipe(
        finalize(() => {
          this.deleting = '';
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.load();
        },
        error: (e) => {
          this.msg = e.error?.message || 'Error deleting trainer';
          this.msgType = 'error';
          this.cdr.markForCheck();
        }
      });
  }

  isInvalid(f: string): boolean {
    const c = this.trainerForm.get(f);
    return !!(c?.invalid && c?.touched);
  }
}

