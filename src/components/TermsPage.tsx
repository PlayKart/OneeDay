import React from "react";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  Scale, 
  HeartPulse, 
  ShieldAlert, 
  Key, 
  ShieldCheck, 
  AlertTriangle, 
  Database, 
  Cpu, 
  Trash2, 
  AlertCircle, 
  BookOpen, 
  Clock, 
  HelpCircle,
  Mail,
  User,
  Info
} from "lucide-react";

interface TermsPageProps {
  onBack: () => void;
}

const SECTIONS = [
  { id: "acceptance", label: "01. Acceptance of Terms", icon: ShieldCheck },
  { id: "eligibility", label: "02. Eligibility", icon: Info },
  { id: "user-accounts", label: "03. Accounts & Guest Mode", icon: Key },
  { id: "user-content", label: "04. User Content Ownership", icon: User },
  { id: "acceptable-use", label: "05. Acceptable & Fair Use", icon: ShieldAlert },
  { id: "ai-usage", label: "06. AI Usage & Processing", icon: Cpu },
  { id: "ai-coach", label: "07. AI Coach Disclaimer", icon: HeartPulse },
  { id: "features-beta", label: "08. Habit Features & Beta", icon: SparklesIcon },
  { id: "service-availability", label: "09. Service Availability", icon: Clock },
  { id: "data-loss", label: "10. Data Loss Disclaimer", icon: Database },
  { id: "termination", label: "11. Termination by User", icon: Trash2 },
  { id: "intellectual-property", label: "12. Intellectual Property", icon: Scale },
  { id: "liability", label: "13. Limitation of Liability", icon: AlertTriangle },
  { id: "privacy", label: "14. Privacy Reference", icon: ShieldCheck },
  { id: "changes", label: "15. Changes to Terms", icon: RefreshIcon },
  { id: "governing-law", label: "16. Governing Law", icon: Scale },
  { id: "contact", label: "17. Contact & Support", icon: Mail },
];

function SparklesIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5 5 3Z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
    </svg>
  );
}

function RefreshIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  );
}

export function TermsPage({ onBack }: TermsPageProps) {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || "support@oneday.app";

  const handleAnchorClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; // Offset for sticky navbar / header padding
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-[#000000] text-white font-sans selection:bg-white/30 px-6 py-20 md:py-28 flex flex-col items-center"
    >
      <div className="max-w-6xl w-full space-y-12">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold tracking-tight cursor-pointer self-start"
        >
          <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
          Back to home
        </button>

        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex p-3 bg-white/5 border border-white/10 rounded-2xl">
            <Scale size={32} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Terms & Conditions</h1>
          <p className="text-slate-500 font-medium text-sm">Last Updated: July 12, 2026</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 w-full" />

        {/* Intro Highlight */}
        <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-semibold max-w-3xl">
          These Terms & Conditions constitute a legally binding agreement between you and OneDay. 
          By creating an account, launching guest sessions, or utilizing our tracking framework, 
          you agree to adhere strictly to these operational boundaries.
        </p>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 pt-4">
          
          {/* Sticky Sidebar Table of Contents */}
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-28 space-y-6">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                <BookOpen size={16} className="text-slate-400" />
                <span>Table of Contents</span>
              </div>
              <nav className="flex flex-col space-y-1.5 border-l border-white/10 pl-3">
                {SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={(e) => handleAnchorClick(e, sec.id)}
                    className="text-xs font-medium text-slate-500 hover:text-white transition-colors py-1 block hover:translate-x-1 duration-150 transform"
                  >
                    {sec.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Terms Content Columns */}
          <div className="lg:col-span-3 space-y-14 text-slate-400 leading-relaxed text-sm md:text-base">

            {/* Mobile Table of Contents */}
            <div className="lg:hidden bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                <BookOpen size={16} className="text-slate-400" />
                <span>Table of Contents</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {SECTIONS.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={(e) => handleAnchorClick(e, sec.id)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {sec.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Sections */}
            
            <section id="acceptance" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 01</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Acceptance of Terms</h2>
              </div>
              <p>
                By accessing, browsing, or utilizing the OneDay interactive web application and its productivity suites, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms & Conditions. If you do not consent to these terms in their entirety, you are strictly prohibited from utilizing our service and must immediately terminate your session.
              </p>
            </section>

            <section id="eligibility" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 02</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Eligibility</h2>
              </div>
              <p>
                You must be at least thirteen (13) years of age to register an account or interact with our habit tracking platform. If you are under the age of eighteen (18) but at least thirteen (13), you represent and warrant that you have reviewed these Terms with a parent or legal guardian who accepts full responsibility for your adherence to this agreement.
              </p>
            </section>

            <section id="user-accounts" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 03</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Accounts & Guest Mode</h2>
              </div>
              <p>
                OneDay currently supports secure authentication through Firebase Authentication (specifically utilizing Google Sign-In protocols) as well as a localized Guest Mode.
              </p>
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <ShieldCheck size={16} className="text-slate-400" /> Firebase Auth (Google)
                  </div>
                  <p className="text-xs text-slate-500">
                    Accounts authenticated via Google Sign-In are securely bound on our database servers. You are solely responsible for maintaining the security of your Google credentials.
                  </p>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" /> Guest Mode Notice
                  </div>
                  <p className="text-xs text-slate-500">
                    Guest data is stored temporarily using browser local storage. Guest data and metrics may be permanently lost if browser cache or cookies are cleared, or if the guest session expires. OneDay holds zero liability for data loss in Guest Mode.
                  </p>
                </div>
              </div>
            </section>

            <section id="user-content" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 04</span>
                <h2 className="text-xl font-bold text-white tracking-tight">User Content Ownership</h2>
              </div>
              <p>
                You retain full, absolute, and uncompromised ownership of all user-generated content you submit, create, or enter into the OneDay platform. This includes your custom habit names, routine titles, personalized task notes, text-based chat messages, and personal progress entries. OneDay does not claim any ownership rights over your personal inputs or progress metrics.
              </p>
              <p>
                In contrast, OneDay retains full and exclusive ownership of the application itself, including all design elements, layout styling, visual branding, color palettes, micro-animations, logo assets, software algorithms, databases, and underlying source code.
              </p>
            </section>

            <section id="acceptable-use" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 05</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Acceptable & Fair Use</h2>
              </div>
              <p>
                You agree to use OneDay strictly for legal, constructive, and personal growth purposes. You are strictly forbidden from abusing the application systems. Specifically, you must not:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Abuse the AI Coach through excessive automated queries, botting, or automated API scripting.</li>
                <li>Conduct prompt injection attacks, bypass system filters, or attempts to force the AI to return malicious or illegal responses.</li>
                <li>Deploy data scrapers, crawlers, indexers, or reverse-engineering systems to harvest our algorithms or source code.</li>
                <li>Conduct denial-of-service (DoS) attacks, exploit database schemas, or engage in activity that compromises network stability.</li>
              </ul>
            </section>

            <section id="ai-usage" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 06</span>
                <h2 className="text-xl font-bold text-white tracking-tight">AI Usage & Processing</h2>
              </div>
              <p>
                To provide smart context-aware tracking feedback, your text prompts and brief habit summaries may be securely forwarded to high-performance AI providers (such as OpenRouter, Google Gemini, or other configured providers) solely to generate conversational coaching responses. These payloads are processed securely and do not include sensitive credentials or personally identifying email records.
              </p>
            </section>

            <section id="ai-coach" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 07</span>
                <h2 className="text-xl font-bold text-white tracking-tight">AI Coach Disclaimer</h2>
              </div>
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                <div className="font-bold text-white text-base flex items-center gap-2">
                  <HeartPulse size={18} className="text-red-400" />
                  <span>Important AI & Health Disclaimer</span>
                </div>
                <p className="text-sm text-slate-400">
                  The AI Coach responses are generated fully automatically using complex language models. Because of the nature of artificial intelligence, responses may occasionally be inaccurate, incomplete, or inappropriate. You must always exercise your own mature judgment and common sense when interpreting or executing suggestions.
                </p>
                <div className="h-px bg-white/5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong>The AI Coach is NOT a qualified human counselor, therapist, doctor, attorney, or financial advisor.</strong> The automated messages should never be relied upon for, or treated as, medical, clinical psychological, legal, or financial advice. If you are experiencing physical or mental health distress, please consult a qualified human healthcare professional.
                </p>
              </div>
            </section>

            <section id="features-beta" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 08</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Habit Features & Beta Status</h2>
              </div>
              <p>
                Our habit tracking mechanisms, daily streak counters, visual safety freezes, and data charts are productivity-focused tools designed to facilitate your daily discipline. Some modules of OneDay are currently categorized as experimental or in Beta. These features are subject to constant development, may occasionally display layout inconsistencies, and can be modified or permanently removed at any time without prior notice.
              </p>
            </section>

            <section id="service-availability" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 09</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Service Availability</h2>
              </div>
              <p>
                We strive to keep the OneDay servers running seamlessly. However, the platform may experience unexpected downtime, system maintenance, software updates, or feature modifications. We reserve the absolute right to suspend, pause, or restrict access to the application for operational or security purposes without prior announcement.
              </p>
            </section>

            <section id="data-loss" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 10</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Data Loss Disclaimer</h2>
              </div>
              <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl flex gap-3.5 items-start">
                <AlertCircle size={20} className="text-slate-400 mt-1 flex-shrink-0" />
                <p className="text-sm text-slate-400">
                  While we implement security backups and use reliable cloud storage solutions, you acknowledge that technical errors may occur. Unexpected server outages, database schema migrations, client-side browser storage clearance, cloud service failures, or third-party service provider issues (such as Google Firebase, Supabase PostgreSQL, or OpenRouter) may occasionally affect, corrupt, or permanently wipe your stored metrics or messages. OneDay provides no warranties regarding complete data preservation.
                </p>
              </div>
            </section>

            <section id="termination" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 11</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Termination by User</h2>
              </div>
              <p>
                You hold complete freedom to terminate your use of OneDay at any point. Authenticated users can permanently delete their accounts and wipe all associated data directly via the Settings page inside the application. Wiping your account permanently deletes your database record, active habits, completed tracking calendars, and coaching conversation history in accordance with our Privacy Policy.
              </p>
            </section>

            <section id="intellectual-property" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 12</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Intellectual Property</h2>
              </div>
              <p>
                The name "OneDay", the OneDay app icon, all software frameworks, customized visual design languages, interface styling, database schemas, and administrative source code are the proprietary intellectual property of OneDay. You are granted a limited, non-transferable, non-assignable, and revocable license to access our platform solely for personal, non-commercial habit tracking.
              </p>
            </section>

            <section id="liability" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 13</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Limitation of Liability</h2>
              </div>
              <p>
                OneDay is provided strictly on an "as-is" and "as-available" basis without any warranties of any kind, either express or implied. Under no circumstances shall the OneDay creators, developers, or hosting affiliates be liable for any indirect, incidental, special, or consequential damages, including but not limited to loss of data, productivity losses, behavioral setbacks, personal scheduling interruptions, or physical/mental fatigue arising out of your use or inability to use this platform.
              </p>
            </section>

            <section id="privacy" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 14</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Privacy Reference</h2>
              </div>
              <p>
                Your personal details, cookies usage, cloud database storage, and AI prompts are governed by our complete Privacy Policy, which is fully integrated into these Terms and Conditions by reference.
              </p>
            </section>

            <section id="changes" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 15</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Changes to Terms</h2>
              </div>
              <p>
                We reserve the absolute right to edit, update, or modify these Terms & Conditions at any point. When changes occur, we will modify the "Last Updated" timestamp at the top of this page. Your continued use of the platform following the posting of any changes constitutes your binding acceptance of the updated terms.
              </p>
            </section>

            <section id="governing-law" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 16</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Governing Law</h2>
              </div>
              <p>
                These Terms & Conditions and your usage relationship with OneDay shall be updated and formally designated under specific local statutes once OneDay officially establishes its legal business entity. Until such formal establishment, any disputes, claims, or interpretative legal conflicts arising out of this agreement shall be addressed and resolved under neutral, mutually agreed arbitration guidelines.
              </p>
            </section>

            <section id="contact" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-white/5 border border-white/10 text-white px-2 py-1 rounded">SEC 17</span>
                <h2 className="text-xl font-bold text-white tracking-tight">Contact & Support</h2>
              </div>
              <p>
                For inquiries regarding these Terms & Conditions, reporting technical abuse, requesting custom support, or resolving system errors, please contact us at:
              </p>
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5 inline-flex">
                <Mail size={16} className="text-slate-400" />
                <a href={`mailto:${supportEmail}`} className="font-mono text-slate-300 hover:text-white transition-colors text-sm font-semibold">
                  {supportEmail}
                </a>
              </div>
            </section>

          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 w-full" />

        {/* Footer Back */}
        <div className="pt-8 flex justify-center">
          <button
            onClick={onBack}
            className="bg-white text-black px-10 py-4 rounded-full text-sm font-bold tracking-tight hover:bg-slate-200 transition-all cursor-pointer shadow-lg shadow-white/5 hover:scale-[1.02] duration-200"
          >
            I Accept the Terms
          </button>
        </div>
      </div>
    </motion.div>
  );
}
