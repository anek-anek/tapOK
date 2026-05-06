export type UserRole = 'admin' | 'participant';
export type GenderEnum = 'male' | 'female' | 'other';
export type AuthProvider = 'password' | 'google';

export type DropCrewMemberRole = 'chief' | 'crew' | 'co_chief';

export interface User {
  id: string;
  email: string;
  authProvider: AuthProvider;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isEmailVerified: boolean;
  emailVerifiedAt?: string;
  emailVerificationSentAt?: string;
  googleId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  gender?: GenderEnum;
  birthday?: string;
  userHandle?: string;
  termsAccepted: boolean;
  termsAcceptedAt?: string;
  privacyPolicyAccepted: boolean;
  privacyPolicyAcceptedAt?: string;
}

export interface UserProfile extends User {
  phone?: string;
  dropCount: number;
}

export interface FrequentCrewMember {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  userHandle?: string;
  createdAt: string;
  frequencyCount: number;
}

export interface CreateUserDto {
  email: string;
  authProvider?: AuthProvider;
  firstName: string;
  lastName: string;
  avatar?: string;
  role?: UserRole;
  gender?: GenderEnum;
  birthday?: string;
  userHandle?: string;
  phone?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  privacyPolicyAccepted?: boolean;
  privacyPolicyAcceptedAt?: string;
}

export type UpdateUserDto = Partial<
  Pick<
    CreateUserDto,
    | 'firstName'
    | 'lastName'
    | 'avatar'
    | 'gender'
    | 'birthday'
    | 'userHandle'
    | 'phone'
    | 'termsAccepted'
    | 'termsAcceptedAt'
    | 'privacyPolicyAccepted'
    | 'privacyPolicyAcceptedAt'
  >
>;
