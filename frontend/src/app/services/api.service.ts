import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<any>   { return this.http.get(`${this.api}/dashboard/stats`); }

  getMembers(params?: any): Observable<any>            { return this.http.get(`${this.api}/members`, { params }); }
  getMember(id: string): Observable<any>               { return this.http.get(`${this.api}/members/${id}`); }
  createMember(data: any): Observable<any>             { return this.http.post(`${this.api}/members`, data); }
  updateMember(id: string, data: any): Observable<any> { return this.http.put(`${this.api}/members/${id}`, data); }
  deleteMember(id: string): Observable<any>            { return this.http.delete(`${this.api}/members/${id}`); }

  getTrainers(): Observable<any>                         { return this.http.get(`${this.api}/trainers`); }
  createTrainer(data: any): Observable<any>              { return this.http.post(`${this.api}/trainers`, data); }
  updateTrainer(id: string, data: any): Observable<any>  { return this.http.put(`${this.api}/trainers/${id}`, data); }
  deleteTrainer(id: string): Observable<any>             { return this.http.delete(`${this.api}/trainers/${id}`); }

  getPlans(params?: any): Observable<any>              { return this.http.get(`${this.api}/plans`, { params }); }
  createPlan(data: any): Observable<any>               { return this.http.post(`${this.api}/plans`, data); }
  updatePlan(id: string, data: any): Observable<any>   { return this.http.put(`${this.api}/plans/${id}`, data); }
  deletePlan(id: string): Observable<any>              { return this.http.delete(`${this.api}/plans/${id}`); }

  getPayments(params?: any): Observable<any>           { return this.http.get(`${this.api}/payments`, { params }); }
  getMemberPayments(id: string): Observable<any>       { return this.http.get(`${this.api}/payments/member/${id}`); }
  createPayment(data: any): Observable<any>            { return this.http.post(`${this.api}/payments`, data); }
  updatePayment(id: string, data: any): Observable<any>{ return this.http.put(`${this.api}/payments/${id}`, data); }

  getAttendance(params?: any): Observable<any>         { return this.http.get(`${this.api}/attendance`, { params }); }
  checkIn(data: any): Observable<any>                  { return this.http.post(`${this.api}/attendance/checkin`, data); }
  getWeeklyStats(): Observable<any>                    { return this.http.get(`${this.api}/attendance/stats/weekly`); }
}
