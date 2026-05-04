import React from 'react';
import { PrivacyContent } from '@/components/legal/PrivacyContent';
import { BackButton } from '@/components/ui/back-button';

export const metadata = {
  title: 'Privacy Policy | tapOK',
  description: 'Privacy Policy for tapOK. We value your privacy and comply with the Philippine Data Privacy Act of 2012.',
};

export default function PrivacyPolicy() {
  const lastUpdated = 'May 4, 2026';

  return (
    <div className="min-h-screen bg-tok-cream text-tok-black font-inter py-12 px-6 md:px-12 lg:py-20">
      <div className="max-w-4xl mx-auto">
        <BackButton className="mb-10" label="Back" />

        <article className="border-4 border-tok-black bg-white p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,102,102,1)]">
          <header className="mb-12 border-b-4 border-tok-black pb-8">
            <h1 className="text-5xl md:text-7xl font-passion uppercase leading-none tracking-tighter mb-4">
              Privacy <span className="text-tok-teal">Policy</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="bg-tok-yellow px-3 py-1 border-2 border-tok-black text-xs font-bold uppercase tracking-widest">
                Official Document
              </span>
              <p className="text-sm font-bold uppercase tracking-widest text-tok-black/40">
                Last Updated: {lastUpdated}
              </p>
            </div>
          </header>

          <PrivacyContent />

          <section className="mt-16 pt-10 border-t-4 border-tok-black">
            <h2 className="text-3xl font-passion uppercase mb-6">Contact Information</h2>
            <div className="p-6 border-4 border-tok-black bg-tok-cream shadow-[6px_6px_0px_0px_rgba(38,38,36,1)]">
              <p className="font-passion text-xl uppercase mb-2">tapOK Data Protection Office</p>
              <p className="font-medium">Email: <a href="mailto:privacy@tapok.ph" className="text-tok-teal underline font-bold">privacy@tapok.ph</a></p>
              <p className="font-medium">Location: Cebu City, Philippines</p>
            </div>
          </section>
        </article>

        <footer className="mt-12 text-center text-xs font-bold uppercase tracking-[0.2em] text-tok-black/30">
          <p>© 2026 tapOK. Registered under the National Privacy Commission (NPC).</p>
        </footer>
      </div>
    </div>
  );
}
