import { Injectable } from '@angular/core';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MemberPortalService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: environment.apiUrl
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('gym_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  private throwReadableError(error: unknown): never {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || err.message || 'Request failed');
  }

  async getCurrentMemberProfile() {
    try {
      const { data } = await this.client.get('/members/me');
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async getMemberDashboard(memberId: string) {
    try {
      const { data } = await this.client.get(`/dashboard/member/${memberId}`);
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async getMemberPayments(memberId: string) {
    try {
      const { data } = await this.client.get(`/payments/member/${memberId}`);
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async getMemberAttendance(memberId: string) {
    try {
      const { data } = await this.client.get(`/attendance/member/${memberId}`);
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async getAttendanceHistory(memberId: string) {
    try {
      const { data } = await this.client.get(`/attendance/history/${memberId}`);
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async checkIn(memberId: string) {
    try {
      const { data } = await this.client.post('/attendance/checkin', { memberId });
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async getPlans() {
    try {
      const { data } = await this.client.get('/plans');
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async buyMembership(payload: { memberId: string; planId: string; method?: string }) {
    try {
      const { data } = await this.client.post('/membership/buy', payload);
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async renewMembership(payload: { memberId: string; planId: string; method?: string }) {
    try {
      const { data } = await this.client.put('/membership/renew', payload);
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async upgradeMembership(payload: { memberId: string; planId: string; method?: string }) {
    try {
      const { data } = await this.client.put('/membership/upgrade', payload);
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async getNotifications(memberId: string) {
    try {
      const { data } = await this.client.get(`/notifications/${memberId}`);
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      const { data } = await this.client.put(`/notifications/read/${notificationId}`);
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async getWorkouts(memberId: string) {
    try {
      const { data } = await this.client.get(`/workouts/member/${memberId}`);
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async addWorkout(payload: { memberId: string; workoutName: string; calories: number; duration: number; date: string }) {
    try {
      const { data } = await this.client.post('/workouts', payload);
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async deleteWorkout(workoutId: string) {
    try {
      const { data } = await this.client.delete(`/workouts/${workoutId}`);
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }

  async getUpcomingClasses() {
    try {
      const { data } = await this.client.get('/classes/upcoming');
      return data;
    } catch (error) {
      return this.throwReadableError(error);
    }
  }
}
