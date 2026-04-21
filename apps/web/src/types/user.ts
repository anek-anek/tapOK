export type UserRole = 'admin' | 'photographer' | 'participant';
export type GenderEnum = 'male' | 'female' | 'other';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isEmailVerified: boolean;
  emailVerifiedAt?: string;
  emailVerificationSentAt?: string;
  googleId?: string;
  firebaseUid?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  gender?: GenderEnum;
  birthday?: string;
  organizationId?: string;
  userHandle?: string;
  privacyPolicyAcceptedDate?: string;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  firebaseUid?: string;
  avatar?: string;
  role?: UserRole;
  gender?: GenderEnum;
  birthday?: string;
  userHandle?: string;
}

export type UpdateUserDto = Partial<CreateUserDto>;
