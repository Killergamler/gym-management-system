import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MemberContextService } from '../../../services/member-context.service';
import { MemberPortalService } from '../../../services/member-portal.service';

@Component({
  selector: 'app-workouts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './workouts.component.html',
  styleUrls: ['./workouts.component.scss']
})
export class WorkoutsComponent implements OnInit {
  member: any = null;
  workouts: any[] = [];
  loading = true;
  saving = false;
  deleting = '';
  error = '';
  success = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private memberContext: MemberContextService,
    private memberApi: MemberPortalService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      workoutName: ['', [Validators.required, Validators.minLength(2)]],
      calories: [300, [Validators.required, Validators.min(0)]],
      duration: [45, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().slice(0, 10), Validators.required]
    });
  }

  get totalCalories(): number {
    return this.workouts.reduce((sum, item) => sum + Number(item.calories || 0), 0);
  }

  get totalDuration(): number {
    return this.workouts.reduce((sum, item) => sum + Number(item.duration || 0), 0);
  }

  get recentWorkouts(): any[] {
    return this.workouts.slice(0, 5);
  }

  get progressSeries(): any[] {
    const rows = [...this.workouts].slice(0, 7).reverse();
    return rows.map((item) => ({
      label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calories: item.calories
    }));
  }

  get maxCalories(): number {
    return Math.max(...this.progressSeries.map((item) => item.calories), 1);
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
      const member = await this.memberContext.getMember();
      const res = await this.memberApi.getWorkouts(member._id);
      this.ngZone.run(() => {
        this.member = member;
        this.workouts = res.workouts || [];
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.error = err.message || 'Failed to load workouts';
      });
    } finally {
      this.ngZone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }

  async addWorkout(): Promise<void> {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.ngZone.run(() => {
      this.saving = true;
      this.error = '';
      this.success = '';
      this.cdr.detectChanges();
    });

    try {
      await this.memberApi.addWorkout({
        memberId: this.member._id,
        workoutName: String(this.form.value.workoutName || '').trim(),
        calories: Number(this.form.value.calories),
        duration: Number(this.form.value.duration),
        date: this.form.value.date
      });
      this.ngZone.run(() => {
        this.success = 'Workout saved successfully';
        this.form.reset({
          workoutName: '',
          calories: 300,
          duration: 45,
          date: new Date().toISOString().slice(0, 10)
        });
      });
      await this.loadData();
    } catch (err: any) {
      this.ngZone.run(() => {
        this.error = err.message || 'Failed to add workout';
      });
    } finally {
      this.ngZone.run(() => {
        this.saving = false;
        this.cdr.detectChanges();
      });
    }
  }

  async removeWorkout(workoutId: string): Promise<void> {
    if (this.deleting) return;
    this.ngZone.run(() => {
      this.deleting = workoutId;
      this.error = '';
      this.cdr.detectChanges();
    });

    try {
      await this.memberApi.deleteWorkout(workoutId);
      this.ngZone.run(() => {
        this.workouts = this.workouts.filter((item) => item._id !== workoutId);
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.error = err.message || 'Failed to delete workout';
      });
    } finally {
      this.ngZone.run(() => {
        this.deleting = '';
        this.cdr.detectChanges();
      });
    }
  }
}
