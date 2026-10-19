'use client';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import LegalPage from '@/components/LegalPage';

const P = ({ children }) => (
  <p className="text-sm leading-relaxed text-[#6E6254]">{children}</p>
);

const UL = ({ items }) => (
  <ul className="ml-1 space-y-2">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#6E6254]">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C4A35A]" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const sections = [
  {
    title: 'Who this platform is for',
    content: (
      <div className="space-y-4">
        <P>Vivah Dwar is a matrimonial service for adults who are legally eligible to marry. Registration is only for people aged 18 or older. The platform is not directed at children, and we do not knowingly allow a minor to create or keep an account.</P>
        <P>If we learn that an account belongs to someone under 18, we remove the account and the personal information associated with it.</P>
      </div>
    ),
  },
  {
    title: 'Standards against child sexual abuse and exploitation',
    content: (
      <div className="space-y-4">
        <P>Vivah Dwar has zero tolerance for child sexual abuse and exploitation. The following are prohibited on the website, in the app, in profiles, in photos, in video, and in chat:</P>
        <UL items={[
          'Child sexual abuse material (CSAM), including any sexual image, video, or description of a person under 18.',
          'Any sexual content involving a minor, or any content that sexualises a child.',
          'Grooming, solicitation, or an attempt to move a minor into a sexual or exploitative conversation.',
          'A profile that presents a minor as available for marriage, dating, or any intimate contact.',
          'Sharing, requesting, or storing CSAM, including links to such material.',
        ]} />
        <P>This prohibition applies to every member, visitor, and administrator. A verified badge does not exempt anyone from these standards.</P>
      </div>
    ),
  },
  {
    title: 'How we reduce the risk',
    content: (
      <UL items={[
        'Account creation requires the person to be at least 18.',
        'Profiles are reviewed before they are shown in search.',
        'Government identity documents may be reviewed for verification and are not shown publicly on the profile.',
        'Members can block another member and can report a profile from inside the app.',
        'We do not design the service, store listing, or registration flow for children.',
      ]} />
    ),
  },
  {
    title: 'How to report a child safety concern',
    content: (
      <div className="space-y-4">
        <P>Anyone can report a concern from inside the VivahDwar app. Open the member’s profile, choose report, and select the closest reason. The report reasons include <strong className="text-[#2C2416]">Underage user</strong> and <strong className="text-[#2C2416]">Inappropriate photos</strong>. Other reasons, including harassment and fake profiles, can also be used when they fit.</P>
        <P>You can also email the child-safety contact below. Please include the profile name or link, what you saw, and when you saw it. Do not send sexual images of a minor by email. Describe the content and where it appears so our team can find and remove it.</P>
        <P>Reports can be made by members and by people who do not have an account.</P>
      </div>
    ),
  },
  {
    title: 'What we do with a report',
    content: (
      <div className="space-y-4">
        <P>The trust and safety team reviews child-safety reports as a priority. Depending on what we find, we may hide the profile, remove the content, suspend or permanently ban the account, and preserve the records needed for an investigation.</P>
        <P>
          Where we confirm child sexual abuse material or exploitation, we remove it from the service and report it to the competent authority. In India, that includes the National Cyber Crime Reporting Portal at{' '}
          <a href="https://cybercrime.gov.in" className="font-semibold text-[#8F6B2E] hover:underline">cybercrime.gov.in</a>
          {' '}and the law-enforcement agency with jurisdiction. If another country’s law requires a report, we make that report as well.
        </P>
        <P>We do not require a user to confront the other member before reporting. A false report made to harm someone may itself lead to action on the reporter’s account.</P>
      </div>
    ),
  },
  {
    title: 'Compliance with child safety laws',
    content: (
      <div className="space-y-4">
        <P>Vivah Dwar complies with the child-safety laws that apply to this service, including Indian law on child sexual abuse material and the Protection of Children from Sexual Offences Act, 2012 (POCSO), where it applies. We cooperate with lawful requests from police and other competent authorities.</P>
        <P>
          These standards sit alongside our <Link href="/terms" className="font-semibold text-[#8F6B2E] hover:underline">Terms of Service</Link> and <Link href="/privacy" className="font-semibold text-[#8F6B2E] hover:underline">Privacy Policy</Link>. The Privacy Policy states that we do not knowingly collect personal information from anyone under 18.
        </P>
      </div>
    ),
  },
  {
    title: 'Child safety contact',
    content: (
      <div className="space-y-4 rounded-xl border border-[#E8DCC8] bg-[#F8F1E3] p-4">
        <P>The designated point of contact for child sexual abuse material prevention and for these standards is:</P>
        <P>
          Child safety<br />
          <a href="mailto:safety@vivahdwar.com" className="font-semibold text-[#8F6B2E] hover:underline">safety@vivahdwar.com</a>
        </P>
        <P>This contact can speak about Vivah Dwar’s CSAM prevention practices and compliance. Related mailboxes:</P>
        <ul className="ml-1 space-y-2">
          {[
            ['Privacy', 'privacy@vivahdwar.com'],
            ['Grievance officer', 'grievance@vivahdwar.com'],
            ['Security', 'security@vivahdwar.com'],
          ].map(([label, email]) => (
            <li key={email} className="flex items-start gap-2.5 text-sm leading-relaxed text-[#6E6254]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C4A35A]" />
              <span>
                {label}: <a href={`mailto:${email}`} className="font-semibold text-[#8F6B2E] hover:underline">{email}</a>
              </span>
            </li>
          ))}
        </ul>
        <P>
          Website: <a href="https://vivahdwar.com" className="font-semibold text-[#8F6B2E] hover:underline">https://vivahdwar.com</a>
        </P>
      </div>
    ),
  },
];

export default function ChildSafetyPage() {
  return (
    <LegalPage
      title="Child safety standards"
      subtitle="Published standards against child sexual abuse and exploitation (CSAE) on the Vivah Dwar matrimonial platform. This page applies to vivahdwar.com and the VivahDwar mobile application."
      icon={Shield}
      iconBg="vd-gradient-gold"
      lastUpdated="17 October 2026"
      sections={sections}
      relatedLinks={[
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
        { label: 'Safety tips', href: '/safety' },
        { label: 'Contact', href: '/contact' },
      ]}
    />
  );
}
