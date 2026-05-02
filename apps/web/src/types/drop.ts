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

export interface DropDiscoverOrganiser {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  userHandle?: string | null;
}

export interface DropDiscoverSummary {
  id: string;
  name: string;
  scheduledAt: string;
  location: string;
  expectedHeadcount?: number | null;
  overview?: string | null;
  coverPhoto?: string | null;
  status: DropStatus;
  category?: DropCategory | null;
  minimumAge?: number | null;
  isLocked: boolean;
  isPublic: boolean;
  organiserId: string;
  organiser: DropDiscoverOrganiser;
  sparkCount: number;
  sparkedByViewer?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoverDropsPayload {
  featured: DropDiscoverSummary | null;
  recentChiefsDrops: DropDiscoverSummary[];
  allPublic: {
    data: DropDiscoverSummary[];
    total: number;
    page: number;
    totalPages: number;
  };
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
  minimumAge?: number | null;
  overview?: string | null;
  coverPhoto?: string | null;
  organiserId: string;
  organiser: DropOrganiser;
  crew?: CrewMember[];
  activityLogs?: DropActivityLog[];
  sparks?: DropSpark[];
  sparkCount?: number;
  sparkedByViewer?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DropCardModel = Drop | DropDiscoverSummary;

export interface DropSpark {
  id: string;
  dropId: string;
  userId: string;
  createdAt: string;
}

export type DropCrewStatus = 'in' | 'pending' | 'rejected' | 'removed' | 'invited';

export type DropCrewMemberRole = 'chief' | 'crew' | 'co_chief';

export interface DropCrew {
  id: string;
  dropId: string;
  userId: string;
  memberRole: DropCrewMemberRole;
  status: DropCrewStatus;
  isPresent: boolean;
  joinedAt: string;
}

export interface CrewMember {
  id: string;
  dropId: string;
  userId: string;
  memberRole: DropCrewMemberRole;
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
  minimumAge?: number | null;
  overview?: string;
  idempotencyKey?: string;
  coverPhotoBase64?: string;
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
  minimumAge?: number | null;
  overview?: string;
}

export interface DropPhoto {
  id: string;
  dropId: string;
  userId: string;
  url?: string | null;
  base64?: string | null;
  isFeatured: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}
