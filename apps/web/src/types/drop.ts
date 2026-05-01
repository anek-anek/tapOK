export type DropStatus = 'active' | 'ongoing' | 'completed';
export type DropCategory = 'hangout' | 'party';

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
  drop?: {
    id: string;
    name: string;
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
  expectedHeadcount?: number | null;
  status: DropStatus;
  joinCode: string;
  shareUrl: string;
  isLocked: boolean;
  isPublic: boolean;
  category?: DropCategory;
  overview?: string | null;
  organiserId: string;
  organiser: DropOrganiser;
  activityLogs?: DropActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export type DropCrewStatus = 'in' | 'pending' | 'rejected' | 'removed' | 'invited';

export interface DropCrew {
  id: string;
  dropId: string;
  userId: string;
  status: DropCrewStatus;
  isPresent: boolean;
  joinedAt: string;
}

export interface CrewMember {
  id: string;
  dropId: string;
  userId: string;
  status: DropCrewStatus;
  isPresent: boolean;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface ActivityLogsPage {
  data: DropActivityLog[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateDropDto {
  name: string;
  scheduledAt: string;
  location: string;
  expectedHeadcount?: number;
  isLocked?: boolean;
  isPublic?: boolean;
  category?: DropCategory;
  overview?: string;
}

export interface UpdateDropDto {
  name?: string;
  scheduledAt?: string;
  location?: string;
  expectedHeadcount?: number | null;
  isLocked?: boolean;
  isPublic?: boolean;
  status?: DropStatus;
  category?: DropCategory;
  overview?: string;
}
