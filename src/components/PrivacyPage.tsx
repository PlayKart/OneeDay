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
          <p className="text-slate-500 font-medium text-sm">Last Updated: August 7, 2026</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 w-full" />

        {/* Intro Highlight */}
        <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-medium">
          At OneDay, your privacy is a core component of the discipline system we build together. 
          We are committed to being fully transparent about the onboarding data we collect, how age eligibility is verified, 
          how your personal profile is secured, and how we utilize AI technologies to support your daily habit consistency.
        </p>

        {/* Sections */}
        <div className="space-y-10 text-slate-400 leading-relaxed text-sm md:text-base">
          
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">01.</span> Introduction & Minimum Age Requirement
            </h2>
            <p>
              OneDay ("we", "our", "us") operates the website and applications designed to assist users in habit tracking, discipline building, and AI productivity coaching. This Privacy Policy details our practices concerning the collection, storage, and processing of personal data for users accessing our services. 
            </p>
            <p className="text-slate-300 font-semibold bg-white/[0.02] border border-white/5 p-4 rounded-xl">
              <strong>Minimum Age Requirement:</strong> You must be at least <strong>10 years old</strong> to create an account, complete onboarding, or use OneDay. Users between the ages of 10 and 17 must have the knowledge and consent of a parent or legal guardian to participate.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">02.</span> Information We Collect
            </h2>
            <p>
              To deliver a tailored tracking and coaching experience, we collect specific data during account setup and platform interaction:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-200">Onboarding & Profile Data:</strong> Full or display name, Date of Birth (DOB) and calculated age (used strictly for 10+ age eligibility verification), gender identity option, selected hobbies & creative interests, favorite sports & physical activities (up to 5), and your stated primary reason for joining OneDay.
              </li>
              <li>
                <strong className="text-slate-200">Account Credentials:</strong> Email address, profile picture, and authentication tokens provided via Firebase Authentication (Google Sign-In). For Guest Mode, a temporary session token is generated locally.
              </li>
              <li>
                <strong className="text-slate-200">Habit & Progress Data:</strong> Active routines, flexible scheduling configurations, completed check-ins, timestamps, level progress, titles unlocked, and active streak counts.
              </li>
              <li>
                <strong className="text-slate-200">AI Coach Dialogues:</strong> Messages, prompts, inquiries, and custom coaching logs generated during interactive AI Coach sessions.
              </li>
              <li>
                <strong className="text-slate-200">Technical Telemetry:</strong> Client-side local storage parameters, device viewport configurations, browser identifiers, and preference cookies.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">03.</span> How We Use Your Information
            </h2>
            <p>
              We process your data strictly to maintain, protect, and scale your personal discipline protocol:
            </p>
            <div className="grid md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Shield size={16} className="text-slate-400" /> Age Eligibility
                </div>
                <p className="text-xs text-slate-500">
                  Verifying that users are at least 10 years old and tailoring age-appropriate content boundaries.
                </p>
              </div>
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Eye size={16} className="text-slate-400" /> Custom Analytics
                </div>
                <p className="text-xs text-slate-500">
                  Calculating consistency metrics, analyzing streak patterns, and rendering visual progress insights.
                </p>
              </div>
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Cpu size={16} className="text-slate-400" /> AI Personalization
                </div>
                <p className="text-xs text-slate-500">
                  Synthesizing your hobbies, sports, motivation, and habit progress into customized AI coaching responses.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">04.</span> Age & Youth Data Protection
            </h2>
            <p>
              Because our platform is accessible to individuals aged 10 and older, we enforce strict safeguards regarding youth data:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400 text-sm">
              <li><strong>No Commercial Exploitation:</strong> Your Date of Birth, hobbies, sports, and personal disclosures are never sold, rented, or shared with third-party advertisers or data brokers.</li>
              <li><strong>Age-Appropriate Guardrails:</strong> Date of Birth is processed exclusively to calculate age and ensure compliance with our 10+ age requirement.</li>
              <li><strong>Parental Inquiries:</strong> Parents or legal guardians of users under 18 may contact us at any time to review, modify, or request deletion of their child's account and stored metrics.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">05.</span> AI Coach Processing (OpenRouter & Gemini)
            </h2>
            <p>
              Your interactions with the AI Coach are private. When you consult the AI Coach, contextual prompts containing relevant habit progress, selected hobbies, active sports, and personal goals are routed server-side via high-performance AI providers (OpenRouter / Google Gemini API). These payloads do not contain raw email addresses or account access tokens. Chat history is stored securely in our cloud database to maintain conversation continuity, and is never used to train public foundational AI models.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">06.</span> Habit & Onboarding Persistence (Supabase & Firebase)
            </h2>
            <p>
              We utilize Firebase Authentication for secure identity management and Google Sign-In. Your onboarding profile details, habit definitions, streak records, completion logs, and AI conversation histories are stored securely in our cloud database (Supabase PostgreSQL / Firebase Firestore). Advanced Row-Level Security (RLS) policies ensure that your personal records are strictly isolated and accessible only by your authenticated session.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">07.</span> Cookies & Local Storage
            </h2>
            <p>
              We use standard browser local storage and session cookies to maintain your login session active across browser tabs, to cache your interface preferences (such as tutorial states and onboarding completion flags), and to preserve Guest Mode routines locally.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">08.</span> Data Security
            </h2>
            <p>
              We enforce industry-standard security protocols. All network transmission between your browser and our servers is encrypted using HTTPS/TLS. Server database connections are protected with robust authentication tokens and restricted system roles.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">09.</span> User Rights & Profile Updates
            </h2>
            <p>
              You hold complete control over your data. You can review and update your onboarding information (display name, hobbies, sports, and reason for joining) at any time through the "About Me" section in your account settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">10.</span> Account & Data Deletion
            </h2>
            <p className="flex items-center gap-2">
              <Trash2 size={16} className="text-red-400 flex-shrink-0" />
              <span>You have the absolute right to permanently delete your account and all associated data. Requesting account deletion from the Settings panel or contacting support immediately erases your authentication credentials, onboarding details, DOB records, active habits, completion logs, and AI Coach conversation histories from our active cloud databases.</span>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-slate-600">11.</span> Contact Information
            </h2>
            <p>
              For concerns regarding this policy, parental requests, data modification inquiries, or account deletion processing, please write directly to our privacy and engineering team at:
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
