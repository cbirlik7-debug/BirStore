import type { Role } from '../../shared/permissions/types';

export interface UserProfile {
  id: string;
  fullName: string | null;
  role: Role;
  createdAt: string;
}
