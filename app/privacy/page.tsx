"use client";

import { LegalPage, type LegalSection } from "@/components/LegalPage";

const SECTIONS: LegalSection[] = [
  {
    heading: "Introduction",
    body: [
      "This Privacy Policy explains how Vladdy Ventures LLC (\"Vladdy Ventures,\" \"we,\" \"us,\" \"our\"), the company that operates SkillSprinter, collects, uses, and shares your information when you use our website and learning services (the \"Service\"). It also describes the privacy rights available to residents of U.S. states with comprehensive privacy laws and how to exercise them.",
    ],
  },
  {
    heading: "Information We Collect",
    body: [
      "We collect the following categories of personal information:",
      "Account information: name and email address, collected when you sign up or sign in (including via Google or Apple).",
      "Learning data: the skills you select, your questionnaire answers, your generated learning plans, and your progress, including points (XP), levels, streaks, and badges.",
      "Usage and device data: technical information such as browser type, device type, IP address, approximate location derived from IP, and pages visited, collected to operate, secure, and improve the Service.",
      "Payment information: if you subscribe to a paid plan, payment is processed by our third-party payment provider; we do not store full payment card details.",
      "We do not intentionally collect sensitive personal information (such as health, religious, biometric, or precise geolocation data). Please do not submit sensitive information through the Service.",
    ],
  },
  {
    heading: "How We Use Your Information",
    body: [
      "We use personal information to: provide and personalize the Service, including generating learning plans tailored to your level and interests, tracking progress, and operating gamified features; process subscriptions; send service-related communications; respond to your requests; analyze usage in aggregate to improve content, features, and performance; and maintain the security and integrity of the Service and comply with law.",
    ],
  },
  {
    heading: "Automated Personalization",
    body: [
      "We use automated processing to generate and adapt your learning plans based on your questionnaire answers and progress. This profiling is used solely to tailor educational content and does not produce legal or similarly significant effects about you. Where state law gives you the right to opt out of certain profiling, you may contact us as described in Section 9.",
    ],
  },
  {
    heading: "AI Processing",
    body: [
      "To create your learning plans, your questionnaire answers and relevant learning data are sent to our third-party AI provider to generate questions and explanations. We share only what is needed for this purpose and do not send payment information. Our AI provider may retain this data and may use it to train or improve its own models; it is not contractually restricted from doing so. If you do not want your learning data processed in this way, please do not submit it through the Service.",
    ],
  },
  {
    heading: "Cookies and Similar Technologies",
    body: [
      "We use cookies and browser local storage to keep you signed in, remember your language preference, and store your learning progress. You can control cookies through your browser settings, though some features may not function without them.",
    ],
  },
  {
    heading: "How We Share Information",
    body: [
      "We share personal information only with service providers/processors who help us operate the Service (categories: hosting, analytics, AI processing, and payment processing), under contracts that require them to protect it and use it only for our purposes; and where required by law or to protect rights and safety.",
      "We do not sell your personal information, and we do not \"share\" it for cross-context behavioral advertising or process it for targeted advertising as those terms are defined under U.S. state privacy laws.",
    ],
  },
  {
    heading: "Universal Opt-Out / Global Privacy Control",
    body: [
      "Where required by law, we recognize opt-out preference signals, such as the Global Privacy Control (GPC), transmitted by your browser, and treat them as a request to opt out for that browser or device.",
    ],
  },
  {
    heading: "Your Privacy Rights",
    body: [
      "Depending on your state of residence, you may have the right to: confirm whether we process your personal information and access it; correct inaccuracies; obtain a portable copy; delete it; opt out of targeted advertising, sale, or certain profiling; and not be discriminated or retaliated against for exercising your rights.",
      "To exercise these rights, contact us at privacy@skillsprinter.com or via our Contact page. We will respond within the timeframe required by applicable law (generally within 45 days, with one extension where permitted). We may need to verify your identity before acting on your request. You may use an authorized agent where the law permits.",
      "Appeals. If we decline your request, you may appeal by replying to our response or contacting us at privacy@skillsprinter.com. We will inform you in writing of our decision within the period required by law. If your appeal is denied, you may contact your state attorney general.",
    ],
  },
  {
    heading: "Data Retention",
    body: [
      "We retain personal information for as long as your account is active and as needed to provide the Service, then for the period necessary to comply with legal obligations, resolve disputes, and enforce our agreements; after that we delete or de-identify it. You may request deletion of your account at any time.",
    ],
  },
  {
    heading: "Children's Privacy",
    body: [
      "The Service is not directed to, and we do not knowingly collect personal information from, children under 13. If you are under 13, please do not use the Service or provide any information. If we learn that we have collected personal information from a child under 13 without verifiable parental consent, we will delete it. If you believe a child has provided us personal information, contact us at privacy@skillsprinter.com.",
    ],
  },
  {
    heading: "Security",
    body: [
      "We use reasonable technical and organizational measures to protect your information. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    heading: "International / Out-of-State Transfers",
    body: [
      "We are based in the United States and process information in the U.S. If you access the Service from outside the U.S., your information will be processed here.",
    ],
  },
  {
    heading: "Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. We will post the updated version with a new effective date, and we will notify you of material changes where required by law.",
    ],
  },
  {
    heading: "Contact Us",
    body: [
      "Vladdy Ventures LLC",
      "privacy@skillsprinter.com",
      "For privacy questions or to exercise your rights, contact us at the email above or via our Contact page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="SkillSprinter Privacy Policy"
      sections={SECTIONS}
      dateLabel="Effective date: January 1, 2026"
      showDraft={false}
    />
  );
}
