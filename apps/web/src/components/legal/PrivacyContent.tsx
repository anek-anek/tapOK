import React from 'react';

export const PrivacyContent = () => (
  <div className="flex flex-col gap-8 prose prose-tok max-w-none">
    <section>
      <h2 className="text-2xl font-passion uppercase mb-2">1. Introduction</h2>
      <p>
        Welcome to <strong>tapOK</strong>. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
      </p>
      <p className="mt-4">
        This Policy is designed to comply with the <strong>Republic Act No. 10173</strong>, also known as the <strong>Data Privacy Act of 2012 (DPA)</strong> of the Philippines, its Implementing Rules and Regulations, and other relevant privacy laws.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-passion uppercase mb-2">2. Information We Collect</h2>
      <p>We collect personal information that you voluntarily provide to us when you register on the platform, express an interest in obtaining information about tapOK or our features, or otherwise when you contact us.</p>
      <ul className="list-disc pl-5 mt-4 space-y-2">
        <li><strong>Personal Data:</strong> Name, email address, contact details, and profile information.</li>
        <li><strong>Usage Data:</strong> Information automatically collected when you visit our site (IP address, browser type, pages viewed).</li>
        <li><strong>Engagement Data:</strong> Data related to your interactions with &quot;Drops&quot; and missions on the platform.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-passion uppercase mb-2">3. Purpose of Collection</h2>
      <p>We process your information for purposes based on legitimate platform interests, the fulfillment of our agreement with you, compliance with our legal obligations, and/or your consent. This includes:</p>
      <ul className="list-disc pl-5 mt-4 space-y-2">
        <li>To facilitate account creation and logon process.</li>
        <li>To manage user accounts and provide platform features.</li>
        <li>To send administrative information and marketing communications (with consent).</li>
        <li>To protect our services from fraud and security threats.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-passion uppercase mb-2">4. Disclosure of Information</h2>
      <p>
        We may share information we have collected about you in certain situations, such as to comply with legal processes, to protect the rights of tapOK, or with your explicit consent for specific third-party integrations. We do not sell your personal data to third parties.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-passion uppercase mb-2">5. Your Rights under the DPA</h2>
      <p>As a data subject in the Philippines, you are entitled to the following rights:</p>
      <ul className="list-disc pl-5 mt-4 space-y-2">
        <li><strong>Right to be Informed:</strong> You have the right to know how your data is being processed.</li>
        <li><strong>Right to Access:</strong> You can request a copy of your personal data in our possession.</li>
        <li><strong>Right to Object:</strong> You can object to the processing of your data for specific purposes.</li>
        <li><strong>Right to Erasure or Blocking:</strong> You can request the removal of your data if it is no longer necessary or was unlawfully processed.</li>
        <li><strong>Right to Correct:</strong> You have the right to dispute and correct any inaccuracy in your data.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-2xl font-passion uppercase mb-2">6. Security and Retention</h2>
      <p>
        We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable.
      </p>
      <p className="mt-4">
        We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law.
      </p>
    </section>
  </div>
);
