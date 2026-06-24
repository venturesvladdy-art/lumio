"use client";

import { useT } from "@/lib/i18n";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

const SECTIONS: LegalSection[] = [
  {
    heading: "Introduction",
    body: [
      "This Privacy Policy explains how SkillSprinter (\"we\", \"us\", \"our\") collects, uses, and protects your information when you use our website and learning services (the \"Service\"). By using the Service, you agree to the practices described here.",
    ],
  },
  {
    heading: "Information We Collect",
    body: [
      "Account information: when you sign up or sign in (including via Google or Apple), we collect your name and email address.",
      "Learning data: the skills you choose, your questionnaire answers, your generated learning plans, and your progress, including points (XP), levels, streaks, and badges.",
      "Usage and device data: basic technical information such as browser type, device, and pages visited, collected to operate and improve the Service.",
      "Payment information: if you subscribe to a paid plan, payment is processed by our third-party payment provider; we do not store full card details.",
    ],
  },
  {
    heading: "How We Use Your Information",
    body: [
      "To provide and personalize the Service, including generating learning plans tailored to your level and interests, tracking your progress, and operating gamified features.",
      "To process subscriptions, send service-related communications, respond to your requests, and maintain the security and integrity of the Service.",
      "To analyze usage in aggregate so we can improve content, features, and performance.",
    ],
  },
  {
    heading: "AI Processing",
    body: [
      "To create your learning plans, your questionnaire answers may be sent to our AI provider to generate questions and explanations. We share only what is needed for this purpose and do not include payment information.",
    ],
  },
  {
    heading: "Cookies and Local Storage",
    body: [
      "We use cookies and browser local storage to keep you signed in, remember your language preference, and store your learning progress. You can control cookies through your browser settings, though some features may not function without them.",
    ],
  },
  {
    heading: "How We Share Information",
    body: [
      "We do not sell your personal information. We share it only with service providers who help us operate the Service (such as hosting, analytics, AI, and payment processing), under appropriate confidentiality and data-protection terms, or where required by law.",
    ],
  },
  {
    heading: "Data Retention",
    body: [
      "We retain your information for as long as your account is active or as needed to provide the Service, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your account at any time.",
    ],
  },
  {
    heading: "Your Rights",
    body: [
      "Depending on your location, you may have the right to access, correct, export, or delete your personal information, and to object to or restrict certain processing. To exercise these rights, contact us using the details on our Contact page.",
    ],
  },
  {
    heading: "Security",
    body: [
      "We use reasonable technical and organizational measures to protect your information. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    heading: "Children's Privacy",
    body: [
      "The Service is not directed to children under the age required by your local law without appropriate consent. If you believe a child has provided us personal information without such consent, please contact us so we can take appropriate action.",
    ],
  },
  {
    heading: "International Transfers",
    body: [
      "Your information may be processed in countries other than your own. Where required, we use appropriate safeguards for such transfers.",
    ],
  },
  {
    heading: "Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. We will post the updated version with a new effective date, and material changes may be communicated to you directly.",
    ],
  },
  {
    heading: "Contact Us",
    body: [
      "If you have questions about this Privacy Policy or how we handle your data, please reach out via our Contact page.",
    ],
  },
];

export default function PrivacyPage() {
  const t = useT();
  return <LegalPage title={t("legal.privacyTitle")} sections={SECTIONS} />;
}
