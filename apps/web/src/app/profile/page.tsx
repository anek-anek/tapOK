'use client';

import { Mail, Phone, Calendar as IconCalendar, Pencil, X, Check, User, ChevronDown, Camera, ShieldCheck, LockKeyhole, AlertCircle } from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCurrentUser, useFrequentCrew } from '@/hooks/queries/use-users';
import { useUpdateUser } from '@/hooks/mutations/use-user-mutations';
import { useMyDrops } from '@/hooks/queries/use-drops';
import { useAuth } from '@/components/providers/auth-provider';
import { useMounted } from '@/hooks/use-mounted';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getApiUrl } from '@/lib/config';
import { ListDropCard, ListCardSkeleton } from '@/components/drops/drop-cards';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { usersService } from '@/services/users.service';

function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase() || '?';
}

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  userHandle: string;
  birthday: string;
  gender: string;
  avatar: string;
}

const formatDateForInput = (dateStr?: string | Date): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0] || '';
  } catch {
    return '';
  }
};

const formatDateForDisplay = (dateStr?: string | Date) => {
  if (!dateStr) return 'NOT SET';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'NOT SET';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  } catch {
    return 'NOT SET';
  }
};

/** PH mobile national significant number: 10 digits, first digit 9 (+63 is separate in the UI). */
const PH_MOBILE_TEN_DIGITS = /^9\d{9}$/;

function parsePhoneToTenDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('63')) {
    return digits.slice(2, 12);
  }
  if (digits.startsWith('0')) {
    return digits.slice(1, 11);
  }
  if (digits.startsWith('9')) {
    return digits.slice(0, 10);
  }
  return digits.slice(0, 10);
}

function tenDigitsToE164(ten: string): string {
  return ten ? `+63${ten}` : '';
}

export default function ProfilePage() {
  const mounted = useMounted();
  const router = useRouter();
  const { dbUser, loading: authLoading, isReady, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const { data: profile, isLoading } = useCurrentUser(['stats', 'avatar']);
  const displayUser = profile ?? dbUser;

  const [editing, setEditing] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
    phone: '',
    userHandle: '',
    birthday: '',
    gender: '',
    avatar: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateUser = useUpdateUser(profile?.id ?? '');
  const { data: myDrops = [], isLoading: dropsLoading } = useMyDrops();
  const { data: frequentCrew = [] } = useFrequentCrew(['avatar']);

  const [highlightVerify, setHighlightVerify] = useState(false);
  const verifySectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isReady && !dbUser) {
      router.replace('/login?redirectTo=/profile');
    }
  }, [isReady, dbUser, router]);

  useEffect(() => {
    if (searchParams.get('verify') === 'true') {
      const timer = setTimeout(() => {
        verifySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightVerify(true);
        setTimeout(() => setHighlightVerify(false), 3000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const memberSince = useMemo(() => {
    if (!displayUser?.createdAt) return 'JUNE 2024';
    try {
      const d = new Date(displayUser.createdAt);
      return isNaN(d.getTime()) ? 'JUNE 2024' : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    } catch { return 'JUNE 2024'; }
  }, [displayUser?.createdAt]);

  const dropCount = profile?.dropCount ?? 0;
  const orchestratedDrops = useMemo(() => myDrops.filter(d => d.organiserId === profile?.id), [myDrops, profile?.id]);
  const activeDrops = useMemo(() => orchestratedDrops.filter(d => d.status !== 'completed'), [orchestratedDrops]);
  const pastDrops = useMemo(() => orchestratedDrops.filter(d => d.status === 'completed'), [orchestratedDrops]);

  const masonryCoverPriorityIds = useMemo(() => {
    const orchestrated = myDrops.filter((d) => d.organiserId === profile?.id);
    const active = orchestrated.filter((d) => d.status !== 'completed');
    return new Set(active.slice(0, 2).map((d) => d.id));
  }, [myDrops, profile?.id]);

  function startEdit() {
    setForm({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phone: parsePhoneToTenDigits(profile?.phone ?? ''),
      userHandle: profile?.userHandle ?? '',
      birthday: formatDateForInput(profile?.birthday ?? ''),
      gender: (profile?.gender as string) ?? '',
      avatar: profile?.avatar ?? '',
    });
    setEditing(true);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  function cancelEdit() {
    setEditing(false);
    setAvatarFile(null);
  }

  async function saveEdit() {
    if (!profile) return;
    const tenDigits = form.phone.replace(/\D/g, '').slice(0, 10);
    const profileTen = parsePhoneToTenDigits(profile.phone ?? '');

    if (!form.firstName.trim()) {
      toast.error('FIRST NAME IS REQUIRED');
      return;
    }
    if (!form.lastName.trim()) {
      toast.error('LAST NAME IS REQUIRED');
      return;
    }

    if (tenDigits && !PH_MOBILE_TEN_DIGITS.test(tenDigits)) {
      toast.error('ENTER 10 DIGITS STARTING WITH 9');
      return;
    }

    if (form.userHandle && !/^[a-zA-Z0-9._]+$/.test(form.userHandle)) {
      toast.error('HANDLE CAN ONLY CONTAIN LETTERS, NUMBERS, DOTS AND UNDERSCORES');
      return;
    }

    if (form.userHandle && form.userHandle.length < 3) {
      toast.error('HANDLE MUST BE AT LEAST 3 CHARACTERS');
      return;
    }

    if (form.birthday) {
      const bday = new Date(form.birthday);
      if (bday > new Date()) {
        toast.error('BIRTHDAY CANNOT BE IN THE FUTURE');
        return;
      }
    }

    const dto: Record<string, unknown> = {};
    if (form.firstName !== profile.firstName) dto.firstName = form.firstName;
    if (form.lastName !== profile.lastName) dto.lastName = form.lastName;
    if (tenDigits !== profileTen) {
      dto.phone = tenDigits ? tenDigitsToE164(tenDigits) : undefined;
    }
    if (form.userHandle !== (profile.userHandle ?? '')) dto.userHandle = form.userHandle || undefined;
    if (form.birthday !== formatDateForInput(profile?.birthday ?? '')) dto.birthday = form.birthday || undefined;
    if (form.gender !== (profile.gender ?? '')) dto.gender = form.gender || undefined;
    if (form.avatar !== (profile.avatar ?? '')) dto.avatar = form.avatar || undefined;

    try {
      if (avatarFile) {
        setIsAvatarUploading(true);
        await usersService.uploadAvatar(profile.id, avatarFile);
      }

      if (Object.keys(dto).length > 0) {
        await new Promise<void>((resolve, reject) => {
          updateUser.mutate(dto, {
            onSuccess: () => resolve(),
            onError: (err: any) => reject(err),
          });
        });
      }

      await refreshUser();
      setAvatarFile(null);
      setEditing(false);
      toast.success('PROFILE UPDATED SUCCESSFULLY');
    } catch (err: any) {
      const responseData = err.response?.data;
      const msg = responseData?.message || err.message || 'FAILED TO UPDATE PROFILE';
      toast.error(String(msg).toUpperCase());
    } finally {
      setIsAvatarUploading(false);
    }
  }

  if (!mounted || !isReady || authLoading || (isLoading && !dbUser)) {
    return (
      <div className="min-h-screen bg-tok-cream">
        <main className="mx-auto max-w-2xl px-3 py-12 sm:px-6">
          {/* Header Skeleton */}
          <div className="mb-10 flex items-end justify-between border-b-4 border-tok-black/10 pb-4 animate-pulse">
            <Skeleton className="h-14 w-40 rounded-none border-2 border-tok-black/10 bg-tok-black/5" />
            <Skeleton className="h-10 w-24 rounded-none border-2 border-tok-black/10 bg-tok-black/5" />
          </div>

          <div className="space-y-12 animate-pulse">
            {/* Identity Skeleton */}
            <div className="border-2 border-tok-black/10 bg-tok-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
                <Skeleton className="h-32 w-32 rounded-none border-4 border-tok-black/10 bg-tok-black/5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-10 w-64 rounded-none bg-tok-black/5" />
                  <div className="flex gap-4">
                    <Skeleton className="h-7 w-24 rounded-none bg-tok-black/5" />
                    <Skeleton className="h-7 w-32 rounded-none bg-tok-black/5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Skeleton — 2×2 at all breakpoints */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="min-w-0 border-2 border-tok-black/10 bg-tok-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] sm:p-6"
                >
                  <div className="mb-3 flex min-w-0 items-center gap-2 sm:mb-4 sm:gap-3">
                    <Skeleton className="h-7 w-7 shrink-0 rounded-none bg-tok-black/5 sm:h-8 sm:w-8" />
                    <Skeleton className="h-5 min-w-0 flex-1 rounded-none bg-tok-black/5 sm:h-6" />
                  </div>
                  <Skeleton className="h-4 w-full max-w-48 rounded-none bg-tok-black/5" />
                </div>
              ))}
            </div>

            {/* Activity Skeleton */}
            <div className="h-28 w-full border-2 border-tok-black/10 bg-tok-teal/5 p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.05)]" />

            {/* Drops Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-8 w-48 rounded-none border-b-2 border-tok-black/10 bg-tok-black/5" />
              <div className="space-y-4">
                <ListCardSkeleton />
                <ListCardSkeleton />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isReady && !dbUser) {
    return null;
  }

  if (!displayUser) return null;

  const firstName = editing ? form.firstName : displayUser.firstName;
  const lastName = editing ? form.lastName : displayUser.lastName;
  const initials = getInitials(firstName || displayUser.firstName, lastName || displayUser.lastName);
  const fullName = `${firstName} ${lastName}`.trim();

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-tok-cream text-tok-black selection:bg-tok-teal/20">
      {/* Background Pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #262624 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <main className="relative mx-auto max-w-2xl px-3 py-12 sm:px-6">
        {/* Page Header — stack on narrow viewports so title never overlaps actions */}
        <div className="mb-10 flex flex-col gap-4 border-b-4 border-tok-black pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <h1 className="min-w-0 shrink font-passion text-[clamp(2.5rem,12vw,3.75rem)] leading-none tracking-tighter text-tok-black uppercase sm:text-6xl">
            Profile
          </h1>
          {!editing ? (
            <button
              type="button"
              onClick={startEdit}
              className="group flex w-full shrink-0 items-center justify-center gap-2 border-2 border-tok-black bg-tok-teal px-4 py-2 font-passion text-lg text-tok-white shadow-[3px_3px_0px_0px_#262624] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#262624] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none sm:w-auto sm:justify-start"
            >
              <Pencil size={18} />
              EDIT
            </button>
          ) : (
            <div className="flex w-full shrink-0 flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
              <button
                type="button"
                onClick={cancelEdit}
                className="min-h-11 min-w-0 flex-1 border-2 border-tok-black bg-tok-white px-4 py-2 font-passion text-base text-tok-black shadow-[3px_3px_0px_0px_#262624] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#262624] sm:flex-initial sm:text-lg"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={updateUser.isPending || isAvatarUploading}
                className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 border-2 border-tok-black bg-tok-teal px-4 py-2 font-passion text-base text-tok-white shadow-[3px_3px_0px_0px_#262624] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#262624] disabled:opacity-50 sm:flex-initial sm:px-6 sm:text-lg"
              >
                {updateUser.isPending || isAvatarUploading ? 'SAVING...' : (
                  <>
                    <Check size={18} />
                    SAVE
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-12">
          {/* Main Identity Card */}
          <section className="border-2 border-tok-black bg-tok-white p-8 shadow-[6px_6px_0px_0px_#262624]">
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
              <div className="relative group">
                <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden border-4 border-tok-black bg-tok-teal-pale font-passion text-5xl text-tok-teal shadow-[4px_4px_0px_0px_#262624]">
                  {(editing ? form.avatar : profile?.avatar) ? (
                    <Image
                      src={(editing ? form.avatar : profile?.avatar) as string}
                      alt={fullName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                {editing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center border-2 border-tok-black bg-tok-white text-tok-black shadow-[3px_3px_0px_0px_#262624] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#262624] active:translate-y-0 active:shadow-none"
                  >
                    <Camera size={20} />
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex-1 text-center sm:text-left">
                {editing ? (
                  <div className="grid w-full grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1 text-left">
                      <label className="font-passion text-sm text-tok-black/40 uppercase">First Name</label>
                      <input
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        className="w-full min-w-0 border-2 border-tok-black bg-tok-cream px-2 py-2 font-inter text-base font-bold outline-none focus:bg-tok-white sm:px-3"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="font-passion text-sm text-tok-black/40 uppercase">Last Name</label>
                      <input
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        className="w-full min-w-0 border-2 border-tok-black bg-tok-cream px-2 py-2 font-inter text-base font-bold outline-none focus:bg-tok-white sm:px-3"
                      />
                    </div>
                    <div className="col-span-2 flex w-full flex-col items-center space-y-1">
                      <label className="font-passion text-sm text-tok-black/40 uppercase">User Handle</label>
                      <div className="flex w-full max-w-md border-2 border-tok-black bg-tok-cream shadow-[2px_2px_0px_0px_#262624] focus-within:bg-tok-white">
                        <span className="flex shrink-0 items-center border-r-2 border-tok-black px-2 font-inter text-base font-black text-tok-black/40 sm:px-3">
                          @
                        </span>
                        <input
                          value={form.userHandle}
                          onChange={(e) => setForm((f) => ({ ...f, userHandle: e.target.value }))}
                          className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-center font-inter text-base font-bold outline-none sm:px-3"
                          placeholder="yourhandle"
                          aria-label="User handle"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-passion text-4xl leading-tight text-tok-black uppercase tracking-tight">
                      {fullName}
                    </h2>
                    {profile?.userHandle && (
                      <div className="mt-2 flex w-full justify-center">
                        <div className="flex items-center gap-2">
                          <div className="h-[2px] w-4 bg-tok-teal/40" />
                          <span className="font-inter text-sm font-black uppercase tracking-[3px] text-tok-teal">
                            @{profile.userHandle}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-6 flex flex-wrap justify-center gap-4 sm:justify-start">
                  <div className="flex items-center gap-2 border-2 border-tok-black bg-tok-cream px-3 py-1.5 font-passion text-sm shadow-[2px_2px_0px_0px_#262624]">
                    <IconCalendar size={14} className="text-tok-teal" />
                    <span>SINCE {memberSince}</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 border-2 border-tok-black px-3 py-1.5 font-passion text-sm shadow-[2px_2px_0px_0px_#262624]",
                    displayUser.isEmailVerified ? "bg-tok-teal-pale text-tok-teal" : "bg-red-50 text-red-600"
                  )}>
                    {displayUser.isEmailVerified ? <Check size={14} /> : <X size={14} />}
                    <span className="uppercase">
                      {displayUser.isEmailVerified ? "VERIFIED" : "UNVERIFIED"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Details Grid — 2×2 at all breakpoints */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6">
            <div className="min-w-0 border-2 border-tok-black bg-tok-white p-4 shadow-[4px_4px_0px_0px_#262624] sm:p-6">
              <div className="mb-3 flex min-w-0 items-center gap-2 sm:mb-4 sm:gap-3">
                <div className="shrink-0 border-2 border-tok-black bg-tok-teal p-1 text-tok-white sm:p-1.5">
                  <Mail className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </div>
                <h3 className="min-w-0 font-passion text-sm uppercase leading-tight tracking-tight sm:text-xl">
                  Email Address
                </h3>
              </div>
              <p className="break-all font-inter text-sm font-bold text-tok-black/60 sm:text-base">
                {displayUser.email}
              </p>
            </div>

            <div className="min-w-0 border-2 border-tok-black bg-tok-white p-4 shadow-[4px_4px_0px_0px_#262624] sm:p-6">
              <div className="mb-3 flex min-w-0 items-center gap-2 sm:mb-4 sm:gap-3">
                <div className="shrink-0 border-2 border-tok-black bg-tok-teal p-1 text-tok-white sm:p-1.5">
                  <Phone className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </div>
                <h3 className="min-w-0 font-passion text-sm uppercase leading-tight tracking-tight sm:text-xl">
                  Phone Number
                </h3>
              </div>
              {editing ? (
                <div className="flex w-full border-2 border-tok-black bg-tok-cream shadow-[2px_2px_0px_0px_#262624] focus-within:bg-tok-white">
                  <span className="flex shrink-0 items-center border-r-2 border-tok-black px-2 font-inter text-base font-black text-tok-black/40 sm:px-3">
                    +63
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setForm((f) => ({ ...f, phone: v }));
                    }}
                    placeholder="9XX XXX XXXX"
                    className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-center font-inter text-base font-bold outline-none sm:px-3"
                    aria-label="Phone number (10 digits, starting with 9)"
                  />
                </div>
              ) : (
                <p className="font-inter text-sm font-bold text-tok-black/60 sm:text-base">
                  {profile?.phone || 'NOT SET'}
                </p>
              )}
            </div>

            <div className="min-w-0 border-2 border-tok-black bg-tok-white p-4 shadow-[4px_4px_0px_0px_#262624] sm:p-6">
              <div className="mb-3 flex min-w-0 items-center gap-2 sm:mb-4 sm:gap-3">
                <div className="shrink-0 border-2 border-tok-black bg-tok-teal p-1 text-tok-white sm:p-1.5">
                  <IconCalendar className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </div>
                <h3 className="min-w-0 font-passion text-sm uppercase leading-tight tracking-tight sm:text-xl">
                  Birthday
                </h3>
              </div>
              {editing ? (
                <Popover>
                  <PopoverTrigger
                    className="flex h-10 min-h-0 w-full min-w-0 items-center justify-between gap-1 border-2 border-tok-black bg-tok-cream px-2 py-2 font-inter text-sm font-bold outline-none focus:bg-tok-white sm:px-3 sm:text-base"
                  >
                    <span className="min-w-0 truncate text-left">
                      {form.birthday ? format(new Date(form.birthday), 'PPP') : <span className="text-tok-black/20 italic">SELECT BIRTHDAY</span>}
                    </span>
                    <ChevronDown size={16} className="shrink-0 text-tok-black/40" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto border-2 border-tok-black p-0 shadow-[4px_4px_0px_0px_#262624]" align="start">
                    <Calendar
                      mode="single"
                      selected={form.birthday ? new Date(form.birthday) : undefined}
                      onSelect={(date) => setForm((f) => ({ ...f, birthday: date ? format(date, 'yyyy-MM-dd') : '' }))}
                      captionLayout="dropdown"
                      fromYear={1940}
                      toYear={new Date().getFullYear()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <p className="font-inter text-sm font-bold text-tok-black/60 uppercase sm:text-base">
                  {formatDateForDisplay(displayUser.birthday)}
                </p>
              )}
            </div>
            <div className="min-w-0 border-2 border-tok-black bg-tok-white p-4 shadow-[4px_4px_0px_0px_#262624] sm:p-6">
              <div className="mb-3 flex min-w-0 items-center gap-2 sm:mb-4 sm:gap-3">
                <div className="shrink-0 border-2 border-tok-black bg-tok-teal p-1 text-tok-white sm:p-1.5">
                  <User className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </div>
                <h3 className="min-w-0 font-passion text-sm uppercase leading-tight tracking-tight sm:text-xl">
                  Gender
                </h3>
              </div>
              {editing ? (
                <select
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  className="w-full min-w-0 border-2 border-tok-black bg-tok-cream px-2 py-2 font-inter text-sm font-bold outline-none focus:bg-tok-white appearance-none sm:px-3 sm:text-base"
                >
                  <option value="">SELECT GENDER</option>
                  <option value="male">MALE</option>
                  <option value="female">FEMALE</option>
                  <option value="other">OTHER</option>
                </select>
              ) : (
                <p className="font-inter text-sm font-bold text-tok-black/60 uppercase sm:text-base">
                  {displayUser.gender || 'NOT SET'}
                </p>
              )}
            </div>
          </div>

          {/* Security & Verification */}
          <section className="mt-8 border-2 border-tok-black bg-tok-white p-6 shadow-[4px_4px_0px_0px_#262624] sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b-2 border-tok-black/10 pb-3">
              <ShieldCheck className="h-5 w-5 text-tok-teal" />
              <h3 className="font-passion text-2xl uppercase tracking-tight text-tok-black">
                Account Security
              </h3>
            </div>

            {!displayUser.isEmailVerified && (
              <div
                id="verify-email"
                ref={verifySectionRef}
                className={cn(
                  "mb-6 flex flex-row items-center justify-between gap-4 border-b-2 border-dashed border-tok-black/10 pb-6 transition-all duration-700",
                  highlightVerify && "z-10 relative bg-tok-teal-pale border-2 border-tok-teal border-solid rounded-sm px-4 -mx-4 py-4 shadow-[6px_6px_0px_#14B8A6]"
                )}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-tok-black bg-[#FFD700] text-tok-black shadow-[2px_2px_0px_0px_#262624]">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-passion text-base uppercase leading-none text-tok-black sm:text-lg">
                      Email Verification
                    </p>
                    <p className="mt-1 hidden font-inter text-[10px] font-black tracking-wider text-tok-black/40 uppercase sm:block">
                      Action Required to unlock all features
                    </p>
                    <p className="mt-1 block font-inter text-[9px] font-black tracking-wider text-tok-black/40 uppercase sm:hidden">
                      ACTION REQUIRED
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={displayUser.isEmailVerified}
                  onClick={async (e) => {
                    const btn = e.currentTarget;
                    const originalContent = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = 'SENDING...';

                    try {
                      const apiUrl = getApiUrl().replace(/\/$/, '');
                      const response = await fetch(`${apiUrl}/auth/email/verify-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ email: displayUser.email }),
                      });

                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || 'FAILED TO SEND EMAIL');
                      }

                      toast.success('VERIFICATION EMAIL SENT');
                    } catch (err: any) {
                      toast.error(err.message || 'FAILED TO SEND EMAIL');
                    } finally {
                      btn.disabled = false;
                      btn.innerHTML = originalContent;
                    }
                  }}
                  className="shrink-0 flex items-center gap-2 border-2 border-tok-black bg-tok-black px-3 py-2 font-passion text-sm text-tok-cream shadow-[3px_3px_0px_0px_#006666] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#006666] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-50 sm:px-4 sm:text-base"
                >
                  <Mail size={14} className="sm:size-4" />
                  <span className="uppercase">SEND LINK</span>
                </button>
              </div>
            )}

            <div className="flex flex-row items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="font-passion text-base uppercase leading-none text-tok-black sm:text-lg">
                  Sign-in Method
                </p>
                <p className="font-inter text-[10px] font-black tracking-wide text-tok-black/40 uppercase sm:text-sm sm:font-bold sm:text-tok-black/50">
                  {displayUser.authProvider === 'google' ? 'Connected via Google' : 'Email & Password'}
                </p>
              </div>

              <div className="shrink-0">
                {displayUser.authProvider === 'password' && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const apiUrl = getApiUrl().replace(/\/$/, '');
                        const response = await fetch(`${apiUrl}/auth/email/reset-password`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: displayUser.email }),
                        });

                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({}));
                          throw new Error(errorData.message || 'FAILED TO SEND RESET LINK');
                        }

                        toast.success('RESET LINK SENT TO YOUR EMAIL');
                      } catch (err: any) {
                        toast.error(err.message || 'FAILED TO SEND RESET LINK');
                      }
                    }}
                    className="flex items-center gap-2 border-2 border-tok-black bg-tok-white px-3 py-2 font-passion text-sm text-tok-black shadow-[3px_3px_0px_0px_#262624] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-tok-cream hover:shadow-[2px_2px_0px_0px_#262624] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none sm:px-4 sm:text-base"
                  >
                    <LockKeyhole size={14} className="sm:size-4" />
                    <span className="uppercase">RESET PASSWORD</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Activity Section */}
          <section className="mt-6 relative overflow-visible border-2 border-tok-black bg-tok-teal p-8 shadow-[6px_6px_0px_0px_#262624]">
            {/* Visual Decoration */}
            <div className="absolute -right-4 -top-8 font-passion text-9xl text-tok-white/10 uppercase italic select-none">
              DATA
            </div>

            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="font-passion text-3xl text-tok-white uppercase tracking-tighter">
                  Drops Orchestrated
                </h3>
                <p className="font-inter text-xs font-black text-tok-white/60 uppercase tracking-widest">
                  Performance Metric
                </p>
              </div>
              <div className="flex h-20 w-20 items-center justify-center border-4 border-tok-black bg-tok-cream shadow-[4px_4px_0px_0px_#262624]">
                <span className="font-passion text-5xl text-tok-black">
                  {dropCount}
                </span>
              </div>
            </div>
          </section>

          {/* Orchestrated Drops Section */}
          <section className="mt-12 space-y-10">
            {activeDrops.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-end justify-between border-b-2 border-tok-black pb-2">
                  <h3 className="font-passion text-3xl uppercase tracking-tighter">Active Missions</h3>
                  <span className="font-passion text-sm text-tok-black/40">{activeDrops.length} ONGOING</span>
                </div>
                <div className="mt-2 flex gap-2 sm:gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3">
                    {activeDrops
                      .filter((_, i) => i % 2 === 0)
                      .map((drop) => (
                        <div key={drop.id} className="min-w-0">
                          <ListDropCard
                            drop={drop}
                            viewerId={profile?.id}
                            layout="masonry"
                            coverPriority={masonryCoverPriorityIds.has(drop.id)}
                          />
                        </div>
                      ))}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3">
                    {activeDrops
                      .filter((_, i) => i % 2 === 1)
                      .map((drop) => (
                        <div key={drop.id} className="min-w-0">
                          <ListDropCard
                            drop={drop}
                            viewerId={profile?.id}
                            layout="masonry"
                            coverPriority={masonryCoverPriorityIds.has(drop.id)}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {pastDrops.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-end justify-between border-b-2 border-tok-black pb-2">
                  <h3 className="font-passion text-3xl uppercase tracking-tighter">Past Operations</h3>
                  <span className="font-passion text-sm text-tok-black/40">{pastDrops.length} ARCHIVED</span>
                </div>
                <div className="grid gap-4">
                  {pastDrops.map(drop => (
                    <ListDropCard key={drop.id} drop={drop} viewerId={profile?.id} />
                  ))}
                </div>
              </div>
            )}

            {orchestratedDrops.length === 0 && !dropsLoading && (
              <div className="border-2 border-dashed border-tok-black/20 p-12 text-center">
                <p className="font-passion text-xl text-tok-black/40 uppercase">No drops orchestrated yet.</p>
                <Link
                  href="/drops"
                  className="mt-4 inline-block font-passion text-sm text-tok-teal underline decoration-2 underline-offset-4"
                >
                  START YOUR FIRST MISSION
                </Link>
              </div>
            )}
          </section>

          {/* Frequent Crew Section */}
          {frequentCrew.length > 0 && (
            <section className="mt-16">
              <div className="mb-6 border-b-2 border-tok-black pb-2">
                <h3 className="font-passion text-3xl uppercase tracking-tighter">Frequent Crew</h3>
                <p className="font-inter text-[10px] font-black text-tok-black/40 uppercase tracking-widest">Regular Accomplices</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {frequentCrew.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 border-2 border-tok-black bg-tok-white p-4 shadow-[4px_4px_0px_0px_#262624]">
                    <div className="relative flex h-12 w-12 items-center justify-center border-2 border-tok-black bg-tok-teal-pale overflow-hidden">
                      {member.avatar ? (
                        <Image src={member.avatar} alt="" fill className="object-cover" />
                      ) : (
                        <span className="font-passion text-lg text-tok-teal">
                          {member.firstName[0]}{member.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-passion text-xl uppercase leading-none">{member.firstName} {member.lastName}</h4>
                      <p className="mt-1 font-inter text-[10px] font-bold text-tok-black/40 uppercase">
                        {member.frequencyCount} SHARED MISSIONS
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
