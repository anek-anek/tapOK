import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export const metadata = {
  title: 'Get started — TapOK',
};

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FFF2BD]">
          <Loader2 className="h-6 w-6 animate-spin text-tok-teal" />
        </div>
      }
    >
      <OnboardingWizard />
    </Suspense>
  );
}
