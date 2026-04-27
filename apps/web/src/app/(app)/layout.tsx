import { TapokNavbar } from '@/components/tapok-navbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F0E9C8] text-[#2a2118]">
      <TapokNavbar />
      <main>{children}</main>
    </div>
  );
}
