import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Shield, Lock, Eye, Database, Cpu, Trash2 } from "lucide-react";

interface PrivacyPageProps {
  onBack: () => void;
}

export function PrivacyPage({ onBack }: PrivacyPageProps) {
  const contactEmail = import.meta.env.VITE_SUPPORT_EMAIL || "privacy@oneday.app";

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
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Privacy Policy</h1>
          <p className="text-slate-500 font-medium text-sm">Last Updated: July 12, 2026</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 w-full" />

        {/* Intro Highlight */}
        <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-medium">
          At OneDay, your privacy is a core component of the discipline system we build together. 
          We are committed to being fully transparent about the data we collect, how it is secured, 
          and how we utilize AI technologies to support your daily habit consistency.
        </p>

        {/* Sections */}
        <div className="space-y-10 text-slate-400 leading-relaxed text-sm md:text-base">
          
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">01.</span> Introduction
            </h2>
            <p>
              OneDay ("we", "our", "us") operates the website and applications designed to assist users in habit tracking and productivity coaching. This Privacy Policy details our practices concerning the collection, storage, and processing of personal data for users accessing our services. By using OneDay, you explicitly consent to the data collection and usage practices described in this policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">02.</span> Information We Collect
            </h2>
            <p>
              To deliver our premium tracking and coaching services, we collect several types of data depending on how you interact with our system:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-200">Account Credentials:</strong> Email address, profile picture, and full name provided during Google Auth authentication. For Guest mode, a temporary anonymous session ID is generated.
              </li>
              <li>
                <strong className="text-slate-200">Habit & Progress Data:</strong> Active routines, flexible scheduling configurations, completed check-ins, timestamps, and active streak counts.
              </li>
              <li>
                <strong className="text-slate-200">AI Coach Dialogues:</strong> Message content, inquiries, and custom coaching logs generated during your interactive AI Coach conversation.
              </li>
              <li>
                <strong className="text-slate-200">Technical Telemetry:</strong> Client-side local storage parameters, device viewport configurations, browser identifiers, and cookie variables.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">03.</span> How We Use Information
            </h2>
            <p>
              We process your data strictly to maintain, protect, and scale your personal discipline protocol:
            </p>
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Eye size={16} className="text-slate-400" /> Custom Analytics
                </div>
                <p className="text-xs text-slate-500">
                  Calculating consistency metrics, analyzing streaks, and offering visual progress insights.
                </p>
              </div>
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Cpu size={16} className="text-slate-400" /> AI Personalization
                </div>
                <p className="text-xs text-slate-500">
                  Feeding contextual progress details to the OpenRouter AI Coach to give you highly specific feedback.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">04.</span> AI Coach Usage
            </h2>
            <p>
              Your interactions with the AI Coach are designed to be an eye-to-eye private conversation. When you speak to the coach, the messaging context along with a summary of your recent habit completions is forwarded to our AI processing partner. Chat history is stored securely in our database to maintain conversational thread consistency, and is never used to train global AI models or sold to marketing aggregators.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">05.</span> Habit & Progress Data
            </h2>
            <p>
              Because discipline is built on persistent routines, details of your active habit grid, individual completion histories, streak states, and streak freezes are recorded on cloud servers. This data is privately bound to your user ID and is only decrypted for display inside your personal client dashboard.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">06.</span> Firebase Authentication
            </h2>
            <p>
              We utilize Google Firebase Authentication for identity management. Firebase stores your basic account profile, including Google identifiers, authentication tokens, and login timestamps securely. This system verifies your identity during sign-in without exposing password hashes to our servers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">07.</span> Supabase Database
            </h2>
            <p>
              Your active habits, streak progress records, and messaging logs are securely written to our dedicated Supabase PostgreSQL database. Supabase acts as our primary cloud database, employing modern row-level security (RLS) policies to isolate your data from other users.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">08.</span> OpenRouter AI Processing
            </h2>
            <p>
              To generate intelligent motivational feedback and habits advice, we transmit contextual prompt payloads through OpenRouter. These payloads contain your active messages and habit statistics. OpenRouter routes these queries securely to high-performance language models. No personal identifying information like email addresses is attached to these prompts.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">09.</span> Cookies & Local Storage
            </h2>
            <p>
              We use standard browser local storage and cookies to maintain your login session active across tabs, to cache your interface preferences (such as tutorials seen), and to remember your acceptance of our Terms & Conditions and Privacy Policy. This ensures you do not have to review and accept the policies during every session.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">10.</span> Data Security
            </h2>
            <p>
              We enforce high-security standards to prevent unauthorized access. All network traffic between your client device and our servers is secured via standard HTTPS/TLS encryption. Access within our database systems is guarded by robust authorization tokens and strict system-level credentials.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">11.</span> User Rights
            </h2>
            <p>
              You hold complete sovereignty over your data. At any point, you can access your profile settings to review, modify, or export details of your progress logs, current habits list, and active streaks.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">12.</span> Account Deletion
            </h2>
            <p className="flex items-center gap-2">
              <Trash2 size={16} className="text-red-400" />
              <span>You have the right to request the permanent deletion of your account. Deletion of your account erases all your Firebase authentication records, your entire habit completion log, chat session records, and coach histories from our databases. If you wish to permanently delete your data, you can do so in the Settings panel of the application or contact us at the address below.</span>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">13.</span> Contact Information
            </h2>
            <p>
              For concerns regarding this policy, data modification requests, or deletion processing, please write directly to our engineering team at:
            </p>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 inline-flex">
              <a href={`mailto:${contactEmail}`} className="font-mono text-slate-300 hover:text-white transition-colors text-sm font-semibold">
                {contactEmail}
              </a>
            </div>
          </section>

        </div>

        {/* Footer Back */}
        <div className="pt-8 flex justify-center">
          <button
            onClick={onBack}
            className="bg-white text-black px-8 py-3.5 rounded-full text-sm font-bold tracking-tight hover:bg-slate-200 transition-all cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </motion.div>
  );
}
