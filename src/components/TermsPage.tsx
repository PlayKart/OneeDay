import { motion } from "motion/react";
import { ArrowLeft, Scale, ShieldAlert, Key, ShieldCheck, HeartPulse, Sparkles } from "lucide-react";

interface TermsPageProps {
  onBack: () => void;
}

export function TermsPage({ onBack }: TermsPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-[#000000] text-white font-sans selection:bg-white/30 px-6 py-24 md:py-32 flex flex-col items-center"
    >
      <div className="max-w-3xl w-full space-y-12">
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
        <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-medium">
          These Terms & Conditions constitute a binding agreement between you and OneDay. 
          By creating an account, launching guest sessions, or utilizing our tracking framework, 
          you agree to adhere strictly to these operational boundaries.
        </p>

        {/* Sections */}
        <div className="space-y-10 text-slate-400 leading-relaxed text-sm md:text-base">

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">01.</span> Acceptance of Terms
            </h2>
            <p>
              By accessing or using OneDay, you represent that you have read, understood, and agreed to be bound by these Terms & Conditions. If you do not agree to these terms, you are prohibited from utilizing our service and must discontinue access immediately.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">02.</span> Eligibility
            </h2>
            <p>
              You must be at least thirteen (13) years of age to register or use our habit tracking platform. If you are under 18, you represent that you have reviewed these terms with a parent or legal guardian who agrees to be responsible for your adherence to this agreement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">03.</span> User Accounts
            </h2>
            <p>
              Accessing core features requires authenticating through Firebase Google Sign-In or generating an anonymous Guest profile.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-200">Account Security:</strong> You are solely responsible for maintaining the confidentiality of your credentials and Google session security.
              </li>
              <li>
                <strong className="text-slate-200">Guest Profiles:</strong> Guest profiles store tracking statistics locally and temporarily on cloud nodes. Clearing browser cookies or cache may cause permanent loss of Guest profile statistics, for which we hold no liability.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">04.</span> Acceptable Use
            </h2>
            <p>
              You agree to use OneDay only for legal, constructive, and personal growth purposes. You are strictly prohibited from:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Deploying automated crawlers, bots, or scripts that disrupt our network stability.</li>
              <li>Sending malicious payloads, spam, or abusive inputs into the AI Coach.</li>
              <li>Exploiting system glitches, cheating the streak logic, or reverse-engineering application protocols.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">05.</span> AI Coach Disclaimer
            </h2>
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <HeartPulse size={16} className="text-red-400" /> Professional Health Disclaimer
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The OneDay AI Coach provides automated productivity insights, motivational reminders, and structured behavioral suggestions. 
                <strong> The AI Coach is NOT a medical, therapeutic, psychological, or clinical mental health counselor. </strong> 
                It does not offer clinical diagnoses, therapeutic treatments, or medical interventions. Do not treat the Coach's prompts as professional mental health or medical advice. Consult qualified human professionals for health concerns.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">06.</span> Habit Tracking Features
            </h2>
            <p>
              Our streak counts, completion checks, calendar maps, and safety freezes are self-reported productivity metrics. OneDay strives to ensure the correct processing and preservation of these statistics but makes no guarantees regarding continuous service availability or absolute immunity to technical storage discrepancies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">07.</span> Intellectual Property
            </h2>
            <p>
              All user interfaces, design schemes, typography pairings, color palettes, micro-animations, logo symbols, and system code are the intellectual property of OneDay. You are granted a limited, personal, non-transferable, and revocable license to access our platform solely for personal tracking.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">08.</span> Limitation of Liability
            </h2>
            <p>
              OneDay is provided on an "as-is" and "as-available" basis without representations or warranties of any kind. Under no circumstances shall the OneDay team, creators, or affiliates be liable for indirect, incidental, or special damages, including but not limited to loss of data, productivity setbacks, personal habits interruption, or mental fatigue resulting from using or failing to access our features.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">09.</span> Account Suspension
            </h2>
            <p>
              We reserve the absolute right to suspend, terminate, or delete user accounts or guest sessions immediately, without prior notice, if we find behavior violating these Terms & Conditions or engaging in abusive interactions with other server systems.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">10.</span> Privacy Reference
            </h2>
            <p>
              Your data collection, cookies persistence, and AI Coach logging are governed by our complete Privacy Policy, which is fully incorporated into these Terms by reference.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">11.</span> Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms & Conditions at any point. When updates occur, we will adjust the "Last Updated" timestamp at the top of this document. Continued usage of our system after modifications constitute absolute acceptance of the revised Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">12.</span> Governing Law
            </h2>
            <p>
              These Terms & Conditions and your relation to our systems are governed by and construed in accordance with the laws of the operating country, without regard to conflict of law principles.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">13.</span> Contact Information
            </h2>
            <p>
              For legal inquiries, clarifying terms questions, or reporting user abuse, please write to us at:
            </p>
            <p className="font-mono text-slate-300 text-sm bg-white/5 p-4 rounded-xl border border-white/5 inline-block">
              legal@oneday.app
            </p>
          </section>

        </div>

        {/* Footer Back */}
        <div className="pt-8 flex justify-center">
          <button
            onClick={onBack}
            className="bg-white text-black px-8 py-3.5 rounded-full text-sm font-bold tracking-tight hover:bg-slate-200 transition-all cursor-pointer"
          >
            I Accept
          </button>
        </div>
      </div>
    </motion.div>
  );
}
