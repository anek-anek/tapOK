'use client';

import { Mail, Phone, Calendar as IconCalendar, Pencil, X, Check, User, ChevronDown, Camera } from 'lucide-react';
import { useRef, useState } from 'react';
import { TapokNavbar } from '@/components/tapok-navbar';
import { useCurrentUser } from '@/hooks/queries/use-users';
import { useUpdateUser } from '@/hooks/mutations/use-user-mutations';
import { useAuth } from '@/components/providers/auth-provider';
import { useMounted } from '@/hooks/use-mounted';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

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

export default function ProfilePage() {
  const mounted = useMounted();
  const { dbUser } = useAuth();
  const { data: profile, isLoading } = useCurrentUser();
  const displayUser = profile ?? dbUser;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
    phone: '',
    userHandle: '',
    birthday: '',
    gender: '',
    avatar: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateUser = useUpdateUser(profile?.id ?? '');

  function startEdit() {
    setForm({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phone: profile?.phone ?? '',
      userHandle: profile?.userHandle ?? '',
      birthday: formatDateForInput(profile?.birthday ?? ''),
      gender: (profile?.gender as string) ?? '',
      avatar: profile?.avatar ?? '',
    });
    setErrors({});
    setEditing(true);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  function cancelEdit() {
    setEditing(false);
  }

  function saveEdit() {
    if (!profile) return;
    // Validation
    const phPhoneRegex = /^(09|\+639|639)\d{9}$/;
    const cleanPhone = form.phone.replace(/[\s-]/g, '');

    if (form.phone && !phPhoneRegex.test(cleanPhone)) {
      setErrors({ phone: 'MUST BE A VALID PH NUMBER (09XX...)' });
      return;
    }

    const dto: any = {};
    if (form.firstName !== profile.firstName) dto.firstName = form.firstName;
    if (form.lastName !== profile.lastName) dto.lastName = form.lastName;
    if (form.phone !== (profile.phone ?? '')) dto.phone = form.phone || undefined;
    if (form.userHandle !== (profile.userHandle ?? '')) dto.userHandle = form.userHandle || undefined;
    if (form.birthday !== formatDateForInput(profile?.birthday ?? '')) dto.birthday = form.birthday || undefined;
    if (form.gender !== (profile.gender ?? '')) dto.gender = form.gender || undefined;
    if (form.avatar !== (profile.avatar ?? '')) dto.avatar = form.avatar || undefined;

    updateUser.mutate(dto, {
      onSuccess: () => {
        setEditing(false);
        toast.success('PROFILE UPDATED SUCCESSFULLY');
      },
      onError: (err: any) => {
        const rawMsg = err.response?.data?.message || 'FAILED TO UPDATE PROFILE';
        const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;
        toast.error(String(msg).toUpperCase());
      }
    });
  }

  if (!mounted || (isLoading && !displayUser)) {
    return (
      <div className="min-h-screen bg-tok-cream">
        <TapokNavbar />
        <main className="mx-auto max-w-2xl px-6 py-12">
          {/* Header Skeleton */}
          <div className="mb-10 flex items-end justify-between border-b-4 border-tok-black/10 pb-4">
            <Skeleton className="h-16 w-48 rounded-none border-2 border-tok-black/10 bg-tok-black/5" />
            <Skeleton className="h-10 w-24 rounded-none border-2 border-tok-black/10 bg-tok-black/5" />
          </div>

          <div className="space-y-8">
            {/* Identity Skeleton */}
            <div className="border-2 border-tok-black/10 bg-tok-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
                <Skeleton className="h-32 w-32 rounded-none border-4 border-tok-black/10 bg-tok-black/5" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-10 w-64 rounded-none bg-tok-black/5" />
                  <div className="flex gap-4">
                    <Skeleton className="h-8 w-24 rounded-none bg-tok-black/5" />
                    <Skeleton className="h-8 w-32 rounded-none bg-tok-black/5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid gap-6 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border-2 border-tok-black/10 bg-tok-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                  <div className="mb-4 flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-none bg-tok-black/5" />
                    <Skeleton className="h-6 w-32 rounded-none bg-tok-black/5" />
                  </div>
                  <Skeleton className="h-4 w-48 rounded-none bg-tok-black/5" />
                </div>
              ))}
            </div>

            {/* Activity Skeleton */}
            <div className="h-40 w-full border-2 border-tok-black/10 bg-tok-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.05)]" />
          </div>
        </main>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="min-h-screen bg-tok-cream">
        <TapokNavbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <span className="font-passion text-2xl tracking-tight text-tok-black/40 uppercase">
            Profile Not Found
          </span>
        </div>
      </div>
    );
  }

  const firstName = editing ? form.firstName : displayUser.firstName;
  const lastName = editing ? form.lastName : displayUser.lastName;
  const initials = getInitials(firstName || displayUser.firstName, lastName || displayUser.lastName);
  const fullName = `${firstName} ${lastName}`.trim();
  const dropCount = profile?.dropCount ?? 0;
  const memberSince = displayUser.createdAt
    ? (function () {
      try {
        const d = new Date(displayUser.createdAt);
        return isNaN(d.getTime()) ? 'JUNE 2024' : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      } catch { return 'JUNE 2024'; }
    })()
    : 'JUNE 2024';

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

      <TapokNavbar />

      <main className="relative mx-auto max-w-2xl px-6 py-12">
        {/* Page Header */}
        <div className="mb-10 flex items-end justify-between border-b-4 border-tok-black pb-4">
          <h1 className="font-passion text-6xl tracking-tighter text-tok-black uppercase">
            Profile
          </h1>
          {!editing ? (
            <button
              onClick={startEdit}
              className="group flex items-center gap-2 border-2 border-tok-black bg-tok-teal px-4 py-2 font-passion text-lg text-tok-white shadow-[3px_3px_0px_0px_#262624] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#262624] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            >
              <Pencil size={18} />
              EDIT
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={cancelEdit}
                className="border-2 border-tok-black bg-tok-white px-4 py-2 font-passion text-lg text-tok-black shadow-[3px_3px_0px_0px_#262624] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#262624]"
              >
                CANCEL
              </button>
              <button
                onClick={saveEdit}
                disabled={updateUser.isPending}
                className="flex items-center gap-2 border-2 border-tok-black bg-tok-teal px-6 py-2 font-passion text-lg text-tok-white shadow-[3px_3px_0px_0px_#262624] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#262624] disabled:opacity-50"
              >
                {updateUser.isPending ? 'SAVING...' : (
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
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden border-4 border-tok-black bg-tok-teal-pale font-passion text-5xl text-tok-teal shadow-[4px_4px_0px_0px_#262624]">
                  {(editing ? form.avatar : profile?.avatar) ? (
                    <img
                      src={editing ? form.avatar : profile?.avatar}
                      alt={fullName}
                      className="h-full w-full object-cover"
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 text-left">
                      <label className="font-passion text-xs text-tok-black/40 uppercase">First Name</label>
                      <input
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        className="w-full border-2 border-tok-black bg-tok-cream px-3 py-2 font-inter text-sm font-bold outline-none focus:bg-tok-white"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="font-passion text-xs text-tok-black/40 uppercase">Last Name</label>
                      <input
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        className="w-full border-2 border-tok-black bg-tok-cream px-3 py-2 font-inter text-sm font-bold outline-none focus:bg-tok-white"
                      />
                    </div>
                    <div className="space-y-1 text-left sm:col-span-2">
                      <label className="font-passion text-xs text-tok-black/40 uppercase">User Handle</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-inter text-sm font-black text-tok-black/40">@</span>
                        <input
                          value={form.userHandle}
                          onChange={(e) => setForm((f) => ({ ...f, userHandle: e.target.value }))}
                          className="w-full border-2 border-tok-black bg-tok-cream pl-8 pr-3 py-2 font-inter text-sm font-bold outline-none focus:bg-tok-white"
                          placeholder="yourhandle"
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
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-[2px] w-4 bg-tok-teal/40" />
                        <span className="font-inter text-[12px] font-black uppercase tracking-[3px] text-tok-teal">
                          @{profile.userHandle}
                        </span>
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

          {/* Contact Details Grid */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="border-2 border-tok-black bg-tok-white p-6 shadow-[4px_4px_0px_0px_#262624]">
              <div className="mb-4 flex items-center gap-3">
                <div className="border-2 border-tok-black bg-tok-teal p-1.5 text-tok-white">
                  <Mail size={18} />
                </div>
                <h3 className="font-passion text-xl uppercase tracking-tight">Email Address</h3>
              </div>
              <p className="font-inter text-sm font-bold text-tok-black/60 break-all">
                {displayUser.email}
              </p>
            </div>

            <div className="border-2 border-tok-black bg-tok-white p-6 shadow-[4px_4px_0px_0px_#262624]">
              <div className="mb-4 flex items-center gap-3">
                <div className="border-2 border-tok-black bg-tok-teal p-1.5 text-tok-white">
                  <Phone size={18} />
                </div>
                <h3 className="font-passion text-xl uppercase tracking-tight">Phone Number</h3>
              </div>
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={form.phone}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, phone: e.target.value }));
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="+63 9XX XXX XXXX"
                    className={cn(
                      "w-full border-2 border-tok-black bg-tok-cream px-3 py-2 font-inter text-sm font-bold outline-none focus:bg-tok-white",
                      errors.phone && "border-red-600 bg-red-50 text-red-600"
                    )}
                  />
                  {errors.phone && (
                    <p className="font-inter text-[10px] font-black text-red-600 uppercase italic">
                      {errors.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="font-inter text-sm font-bold text-tok-black/60">
                  {profile?.phone || 'NOT SET'}
                </p>
              )}
            </div>

            <div className="border-2 border-tok-black bg-tok-white p-6 shadow-[4px_4px_0px_0px_#262624]">
              <div className="mb-4 flex items-center gap-3">
                <div className="border-2 border-tok-black bg-tok-teal p-1.5 text-tok-white">
                  <IconCalendar size={18} />
                </div>
                <h3 className="font-passion text-xl uppercase tracking-tight">Birthday</h3>
              </div>
              {editing ? (
                <Popover>
                  <PopoverTrigger
                    className="flex h-10 w-full items-center justify-between border-2 border-tok-black bg-tok-cream px-3 py-2 font-inter text-sm font-bold outline-none focus:bg-tok-white"
                  >
                    {form.birthday ? format(new Date(form.birthday), 'PPP') : <span className="text-tok-black/20 italic">SELECT BIRTHDAY</span>}
                    <ChevronDown size={16} className="text-tok-black/40" />
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
                <p className="font-inter text-sm font-bold text-tok-black/60 uppercase">
                  {formatDateForDisplay(displayUser.birthday)}
                </p>
              )}
            </div>

            <div className="border-2 border-tok-black bg-tok-white p-6 shadow-[4px_4px_0px_0px_#262624]">
              <div className="mb-4 flex items-center gap-3">
                <div className="border-2 border-tok-black bg-tok-teal p-1.5 text-tok-white">
                  <User size={18} />
                </div>
                <h3 className="font-passion text-xl uppercase tracking-tight">Gender</h3>
              </div>
              {editing ? (
                <select
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  className="w-full border-2 border-tok-black bg-tok-cream px-3 py-2 font-inter text-sm font-bold outline-none focus:bg-tok-white appearance-none"
                >
                  <option value="">SELECT GENDER</option>
                  <option value="male">MALE</option>
                  <option value="female">FEMALE</option>
                  <option value="other">OTHER</option>
                </select>
              ) : (
                <p className="font-inter text-sm font-bold text-tok-black/60 uppercase">
                  {displayUser.gender || 'NOT SET'}
                </p>
              )}
            </div>
          </div>

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

        </div>
      </main>
    </div>
  );
}
