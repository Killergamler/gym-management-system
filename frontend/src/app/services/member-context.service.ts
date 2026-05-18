import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { MemberPortalService } from './member-portal.service';

@Injectable({ providedIn: 'root' })
export class MemberContextService {
  private member: any | null = null;
  private loadingPromise: Promise<any> | null = null;

  constructor(
    private auth: AuthService,
    private memberApi: MemberPortalService
  ) {}

  async getMember(forceRefresh = false): Promise<any> {
    if (this.member && !forceRefresh) return this.member;
    if (this.loadingPromise && !forceRefresh) return this.loadingPromise;

    this.loadingPromise = this.memberApi
      .getCurrentMemberProfile()
      .then((res) => {
        this.member = res.member;

        const user = this.auth.getUser();
        if (user && this.member?._id) {
          this.auth.setUser({
            ...user,
            memberDocId: this.member._id,
            memberId: this.member.memberId
          });
        }

        return this.member;
      })
      .finally(() => {
        this.loadingPromise = null;
      });

    return this.loadingPromise;
  }
}
