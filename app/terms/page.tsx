"use client";

import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { TERMS_UPDATED } from "@/lib/legal";

const SECTIONS: LegalSection[] = [
  {
    heading: "Acceptance of Terms",
    body: [
      'These Terms of Service ("Terms") form a binding agreement between you and Vladdy Ventures LLC ("SkillSprinter," "we," "us," or "our") and govern your access to and use of the SkillSprinter application and website (the "Service").',
      "When you create an account, you will be asked to affirmatively indicate your agreement to these Terms and our Privacy Policy by checking a box or clicking a button. By doing so, or by otherwise accessing or using the Service, you agree to be bound by these Terms. **If you do not agree, do not create an account or use the Service.**",
      "These Terms incorporate by reference our Privacy Policy and any plan-specific or in-product terms we present to you. We record the version of the Terms you accept and the date of acceptance.",
      { callout: "**Section 14 (Arbitration and Class Action Waiver) affects your legal rights. Please read it carefully.**" },
    ],
  },
  {
    heading: "Eligibility and Age Requirements",
    body: [
      "The Service is offered only to users located in the United States. By using the Service, you represent that you are accessing it from within the United States.",
      "**You must be at least 13 years old to use the Service.** The Service is not directed to, and may not be used by, children under 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13 without verifiable parental consent, we will delete that information and terminate the account. If you believe a child under 13 has provided us information, contact us at privacy@skillsprinter.com.",
      "If you are between 13 and 18, you represent that your parent or legal guardian has reviewed and agreed to these Terms on your behalf. You must be old enough to form a binding contract, or have such consent, to use the Service.",
      "If you use the Service on behalf of an organization, you represent that you are authorized to accept these Terms for it, and \"you\" includes that organization.",
    ],
  },
  {
    heading: "Accounts",
    body: [
      "You are responsible for the accuracy of the information associated with your account and for all activity that occurs under it. Keep your access credentials secure, do not share them, and notify us promptly at support@skillsprinter.com of any unauthorized use or security breach. We are not liable for losses arising from unauthorized use of your account that results from your failure to safeguard your credentials.",
      "We may terminate or reclaim accounts that are inactive for an extended period or that contain false registration information.",
    ],
  },
  {
    heading: "Plans, Billing, Auto-Renewal, and Cancellation",
    body: [
      "**Plans.** The Service offers a free Basic plan and paid Smart and Guru plans. Current features and prices are shown at the point of purchase.",
      "**Auto-renewal and express consent.** Paid plans are sold as automatically renewing subscriptions billed in advance on a monthly or annual basis. Before you are charged, we will clearly and conspicuously disclose the subscription term, the renewal frequency, the amount you will be charged, and how to cancel, and we will obtain your separate express affirmative consent to these auto-renewal terms. Your subscription will automatically renew at the then-current price for successive periods until you cancel.",
      "**Cancellation.** You may cancel at any time through your account settings using our online cancellation method (\"click to cancel\"), without having to call us or complete additional obstructive steps. Cancellation takes effect at the end of the current billing period; you retain access until then.",
      "**Renewal and price-change notices.** We will send the renewal, price-change, and periodic reminder notices required by applicable law, within the timeframes those laws specify, including advance notice before any price increase takes effect.",
      "**Refunds.** Except where required by applicable law, payments are non-refundable, and partial billing periods are not refunded.",
      "**Changes to plans and pricing.** We may change plan features or pricing on a going-forward basis. We will provide advance notice of material changes as required by law, and such changes will not take effect until your next billing period. If you do not agree to a change, you may cancel before it takes effect.",
    ],
  },
  {
    heading: "Acceptable Use",
    body: [
      "You agree not to misuse the Service. Prohibited conduct includes:",
      {
        bullets: [
          "attempting to disrupt, damage, or overload the Service, or to access it or other users' data without authorization;",
          "scraping, crawling, harvesting, or systematically extracting content or data from the Service;",
          "reselling, sublicensing, or commercially exploiting the Service or its content without our written permission;",
          "using the Service for any unlawful, infringing, harassing, or fraudulent purpose; or",
          "circumventing any security, rate-limiting, or access-control measure.",
        ],
      },
      "**AI-specific restrictions.** You additionally agree not to:",
      {
        bullets: [
          "use the Service or its outputs to develop, train, fine-tune, or improve any competing AI model, dataset, or machine-learning system;",
          "attempt to extract, reconstruct, or reverse-engineer any model, prompt, weights, training data, or underlying system through the outputs or otherwise;",
          'submit prompts or inputs designed to bypass, manipulate, or override the Service\'s safety, content, or operational controls (including "prompt injection" or "jailbreak" techniques);',
          "use automated means to generate inputs or harvest outputs at scale; or",
          "use AI-generated outputs in any way that misrepresents them as human-created where doing so is deceptive or unlawful.",
        ],
      },
      "We may investigate suspected violations and may suspend or terminate accounts that violate these Terms.",
    ],
  },
  {
    heading: "Intellectual Property",
    body: [
      "The Service, including its design, software, models, and original content, is owned by SkillSprinter or its licensors and is protected by U.S. and international intellectual-property laws. Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to use the Service for your personal, non-commercial learning. All rights not expressly granted are reserved. The SkillSprinter name and logo are trademarks of Vladdy Ventures LLC and may not be used without permission.",
    ],
  },
  {
    heading: "User Submissions and License to SkillSprinter",
    body: [
      'The Service allows you to submit content, including answers, responses, corrections, feedback, and other inputs ("User Submissions").',
      "**Ownership.** As between you and us, you retain whatever ownership rights you have in your User Submissions.",
      "**License you grant us.** You grant SkillSprinter a worldwide, perpetual, irrevocable, non-exclusive, royalty-free, fully paid, transferable, and sublicensable license to host, store, reproduce, modify, create derivative works from, analyze, and use your User Submissions for any business purpose, including operating, improving, personalizing, and developing the Service and our models and features, and for research and analytics. Where we use User Submissions to improve or train our models, we use them in deidentified or aggregated form except as needed to operate the Service.",
      "**Your representations.** You represent that you own or have the necessary rights to your User Submissions and that they do not violate any law or third-party right. Do not submit content you are not entitled to share or that contains sensitive personal information about yourself or others.",
      "**Feedback.** Any suggestions or feedback you provide are non-confidential, and we may use them without restriction or obligation to you.",
    ],
  },
  {
    heading: "AI-Generated Content",
    body: [
      "Learning questions, answers, explanations, and other materials may be generated or assisted by artificial-intelligence systems. While we strive for accuracy, **AI-generated content may be incomplete, inaccurate, or out of date, and is provided for general educational purposes only.** It is not professional, legal, medical, financial, or other regulated advice, and is not a substitute for accredited education or qualified professional instruction. Verify important information independently before relying on it. You can report errors or concerns about AI-generated content to us at support@skillsprinter.com.",
    ],
  },
  {
    heading: "Disclaimers",
    body: [
      'To the maximum extent permitted by law, the Service is provided "as is" and "as available" without warranties of any kind, whether express, implied, or statutory, including implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement. We do not warrant that the Service will be uninterrupted, secure, error-free, or that it will achieve any particular learning outcome. Some jurisdictions do not allow certain warranty exclusions, so some of the above may not apply to you.',
    ],
  },
  {
    heading: "Limitation of Liability",
    body: [
      "To the maximum extent permitted by law, SkillSprinter and its officers, employees, and licensors will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or any loss of data, use, goodwill, or profits, arising from or relating to your use of or inability to use the Service, even if advised of the possibility of such damages.",
      "To the maximum extent permitted by law, our total aggregate liability for all claims arising out of or relating to the Service or these Terms will not exceed the greater of (a) the total amounts you paid to us for the Service in the twelve (12) months before the event giving rise to the claim, or (b) one hundred U.S. dollars (US$100).",
      "Some jurisdictions do not allow certain limitations, so some of the above may not apply to you. Nothing in these Terms limits liability that cannot be limited under applicable law.",
    ],
  },
  {
    heading: "Indemnification",
    body: [
      "You agree to indemnify and hold harmless SkillSprinter and its officers, employees, and licensors from any claims, damages, liabilities, and reasonable legal fees arising out of your User Submissions, your misuse of the Service, or your violation of these Terms or of any law or third-party right.",
    ],
  },
  {
    heading: "Termination",
    body: [
      "You may stop using the Service and delete your account at any time. We may suspend or terminate your access if you breach these Terms, if required by law, or if we discontinue the Service. On termination, your license to use the Service ends. Sections that by their nature should survive termination — including Sections 6, 7, 9, 10, 11, 14, 15, and 16 — will survive.",
    ],
  },
  {
    heading: "Changes to These Terms",
    body: [
      "We may update these Terms from time to time. We will post the updated version with a new effective date and, for material changes, will notify you through the Service or by email before they take effect. Changes are not retroactive and do not apply to disputes arising before their effective date. Continued use of the Service after changes take effect constitutes acceptance.",
    ],
  },
  {
    heading: "Governing Law, Arbitration, and Class Action Waiver",
    body: [
      "**Governing law.** These Terms are governed by the laws of the State of Texas, without regard to its conflict-of-laws rules.",
      "**Informal resolution.** Before filing a claim, you agree to first contact us at legal@skillsprinter.com and attempt to resolve the dispute informally for at least 30 days.",
      "**Binding arbitration.** Except as provided below, any dispute arising out of or relating to these Terms or the Service will be resolved by **binding individual arbitration** administered by the American Arbitration Association under its applicable rules, rather than in court. Either party may bring qualifying claims in small-claims court.",
      "**Class action waiver.** **You and SkillSprinter agree that each may bring claims against the other only in an individual capacity, and not as a plaintiff or class member in any class, collective, or representative proceeding.** The arbitrator may not consolidate more than one person's claims.",
      "**Opt-out.** You may opt out of arbitration within 30 days of first accepting these Terms by emailing legal@skillsprinter.com with your name and a statement that you opt out. If you opt out, disputes will be resolved in the state or federal courts located in Texas, and you and SkillSprinter consent to that jurisdiction and venue.",
    ],
  },
  {
    heading: "Notices",
    body: [
      "**Notices to you.** We may provide legal and other notices to you by email to the address associated with your account, by posting within the Service, or by other reasonable means. Notices are deemed given when sent or posted. It is your responsibility to keep your account email address current.",
      "**Notices to us.** Except where another address is specified in these Terms (for example, the DMCA agent in Section 16), legal notices to SkillSprinter must be sent by email to legal@skillsprinter.com. Notices are deemed given when we acknowledge receipt or one business day after sending, whichever is earlier.",
    ],
  },
  {
    heading: "Copyright and DMCA Policy",
    body: [
      'SkillSprinter respects intellectual-property rights and responds to clear notices of alleged copyright infringement under the Digital Millennium Copyright Act ("DMCA").',
      "**Reporting infringement.** If you believe content on the Service infringes your copyright, send a written notice to our designated agent that includes: (a) your physical or electronic signature; (b) identification of the copyrighted work claimed to be infringed; (c) identification of the allegedly infringing material and information reasonably sufficient to locate it; (d) your contact information; (e) a statement that you have a good-faith belief that the use is not authorized by the copyright owner, its agent, or the law; and (f) a statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on its behalf.",
      "**Designated DMCA agent.** Copyright Agent, Vladdy Ventures LLC — Email: legal@skillsprinter.com",
      "**Counter-notice.** If you believe your content was removed in error, you may submit a counter-notice to the same agent containing the information required by the DMCA, including your signature, identification of the removed material and its prior location, a statement under penalty of perjury that you have a good-faith belief the material was removed by mistake or misidentification, and your consent to the jurisdiction of the federal courts in Texas.",
      "**Repeat infringers.** We will, in appropriate circumstances, terminate the accounts of users who are repeat infringers.",
    ],
  },
  {
    heading: "General",
    body: [
      "These Terms are the entire agreement between you and us regarding the Service. If any provision is found unenforceable, the rest remains in effect. Our failure to enforce a provision is not a waiver. You may not assign these Terms; we may assign them in connection with a merger, acquisition, or sale of assets. There are no third-party beneficiaries.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "Vladdy Ventures LLC",
      "General: contact@skillsprinter.com",
      "Support: support@skillsprinter.com",
      "Legal: legal@skillsprinter.com",
      "Privacy: privacy@skillsprinter.com",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      sections={SECTIONS}
      dateLabel={`Last updated: ${TERMS_UPDATED}`}
      showDraft={false}
    />
  );
}
