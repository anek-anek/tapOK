export type DropStatus = 'active' | 'ongoing' | 'completed';

export interface DropOrganiser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  firebaseUid?: string;
}

export interface DropActivityLog {
  id: string;
  dropId: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  action: string;
  changedFields?: Record<string, unknown>;
  createdAt: string;
}

export interface Drop {
  id: string;
  name: string;
  scheduledAt: string;
  location: string;
  expectedHeadcount?: number;
  status: DropStatus;
  joinCode: string;
  shareUrl: string;
  isLocked: boolean;
  organiserId: string;
  organiser: DropOrganiser;
  activityLogs?: DropActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export type DropCrewStatus = 'in' | 'pending';

export interface DropCrew {
  id: string;
  dropId: string;
  userId: string;
  status: DropCrewStatus;
  joinedAt: string;
}

export interface CreateDropDto {
  name: string;
  scheduledAt: string;
  location: string;
  expectedHeadcount?: number;
}

export interface UpdateDropDto {
  name?: string;
  scheduledAt?: string;
  location?: string;
  isLocked?: boolean;
}
