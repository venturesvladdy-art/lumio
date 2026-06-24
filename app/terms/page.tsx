"use client";

import { useT } from "@/lib/i18n";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

const SECTIONS: LegalSection[] = [
  {
    heading: "Acceptance of Terms",
    body: [
      "These Terms of Service (\"Terms\") govern your access to and use of SkillSprinter (the \"Service\"). By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.",
    ],
  },
  {
    heading: "Eligibility",
    body: [
      "You must be able to form a binding contract to use the Service and must comply with all applicable laws. If you use the Service on behalf of an organization, you represent that you are authorized to accept these Terms for it.",
    ],
  },
  {
    heading: "Accounts",
    body: [
      "You are responsible for the information associated with your account and for all activity that occurs under it. Keep your access credentials secure and notify us promptly of any unauthorized use.",
    ],
  },
  {
    heading: "Plans, Billing, and Cancellation",
    body: [
      "The Service offers a free Basic plan and paid Smart and Guru plans. Paid plans are billed in advance on a monthly or yearly basis and renew automatically until cancelled.",
      "You can cancel at any time; cancellation takes effect at the end of the current billing period, and you retain access until then. Except where required by law, payments are non-refundable.",
      "We may change plan features or pricing prospectively. We will provide notice of material changes, and continued use after changes take effect constitutes acceptance.",
    ],
  },
  {
    heading: "Acceptable Use",
    body: [
      "You agree not to misuse the Service, including by attempting to disrupt it, access it without authorization, scrape or resell content, or use it for unlawful purposes. We may suspend or terminate accounts that violate these Terms.",
    ],
  },
  {
    heading: "Intellectual Property",
    body: [
      "The Service, including its design, software, and original content, is owned by SkillSprinter or its licensors and protected by intellectual-property laws. We grant you a limited, non-exclusive, non-transferable license to use the Service for personal, non-commercial learning.",
    ],
  },
  {
    heading: "AI-Generated Content",
    body: [
      "Learning questions, answers, and explanations may be generated with the assistance of AI. While we strive for accuracy, such content may contain errors and is provided for educational purposes only. It is not professional, legal, medical, or financial advice. Verify important information independently.",
    ],
  },
  {
    heading: "Disclaimers",
    body: [
      "The Service is provided \"as is\" and \"as available\" without warranties of any kind, whether express or implied, including fitness for a particular purpose and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or achieve any particular learning outcome.",
    ],
  },
  {
    heading: "Limitation of Liability",
    body: [
      "To the maximum extent permitted by law, SkillSprinter will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, use, or profits, arising from your use of the Service.",
    ],
  },
  {
    heading: "Termination",
    body: [
      "You may stop using the Service at any time. We may suspend or terminate your access if you breach these Terms or if we discontinue the Service. Provisions that by their nature should survive termination will survive.",
    ],
  },
  {
    heading: "Governing Law",
    body: [
      "These Terms are governed by the laws of the jurisdiction in which SkillSprinter operates, without regard to its conflict-of-laws rules. Disputes will be resolved in the competent courts of that jurisdiction, unless otherwise required by applicable law.",
    ],
  },
  {
    heading: "Changes to These Terms",
    body: [
      "We may update these Terms from time to time. We will post the updated version with a new effective date, and material changes may be communicated to you directly. Continued use after changes take effect constitutes acceptance.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "Questions about these Terms can be sent to us via our Contact page.",
    ],
  },
];

export default function TermsPage() {
  const t = useT();
  return <LegalPage title={t("legal.termsTitle")} sections={SECTIONS} />;
}
