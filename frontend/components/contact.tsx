"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Mail, MessageSquare, Send, User, Check, Zap, Bot,
  ArrowRight, ShieldCheck, Activity, Cpu, HelpCircle,
  Brain, GitMerge, FileText, Terminal
} from "lucide-react";

export function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);
  const [sentiment, setSentiment] = useState("Awaiting text...");
  const [intent, setIntent] = useState("Awaiting intent...");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "message") {
      if (value.length < 5) {
        setSentiment("Awaiting text...");
        setIntent("Awaiting intent...");
      } else {
        const lower = value.toLowerCase();
        if (lower.includes("price") || lower.includes("pricing") || lower.includes("cost") || lower.includes("buy")) {
          setIntent("Sales / Commercial");
        } else if (lower.includes("bug") || lower.includes("error") || lower.includes("fail") || lower.includes("broken")) {
          setIntent("Technical Support");
        } else if (lower.includes("partner") || lower.includes("collab") || lower.includes("integrate")) {
          setIntent("Other Inquiry");
        } else {
          setIntent("General Inquiry");
        }

        if (lower.includes("love") || lower.includes("great") || lower.includes("good") || lower.includes("thanks")) {
          setSentiment("Positive (Confidence: 98%)");
        } else if (lower.includes("bad") || lower.includes("slow") || lower.includes("worst") || lower.includes("frustrated")) {
          setSentiment("Urgent / Escalated (Confidence: 94%)");
        } else {
          setSentiment("Neutral (Confidence: 89%)");
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setIsSubmitting(true);
    setSubmitStep(1); // Intent Analysis
  };

  useEffect(() => {
    if (!isSubmitting) return;

    let timer: NodeJS.Timeout;
    if (submitStep === 1) {
      timer = setTimeout(() => setSubmitStep(2), 1500); // Route Determination
    } else if (submitStep === 2) {
      timer = setTimeout(() => setSubmitStep(3), 1500); // Auto-drafting Reply
    } else if (submitStep === 3) {
      timer = setTimeout(() => setSubmitStep(4), 1800); // Complete
    }

    return () => clearTimeout(timer);
  }, [isSubmitting, submitStep]);

  const resetForm = () => {
    setForm({ name: "", email: "", message: "" });
    setIsSubmitting(false);
    setSubmitStep(0);
    setSentiment("Awaiting text...");
    setIntent("Awaiting intent...");
  };

  return (
    <section id="contact" className="relative py-24 px-4 bg-zinc-950 overflow-hidden border-t border-zinc-900">
      {/* Background Accent Glow */}
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[500px] rounded-full blur-3xl opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute top-0 left-1/4 w-[600px] h-[500px] rounded-full blur-3xl opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 mb-4 tracking-wider"
          >
            <Bot className="w-3.5 h-3.5" />
            AGENTIC GATEWAY
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4"
          >
            Connect with TriVisionX
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base"
          >
            Submit an inquiry below to witness our dispatch router parse, classify, and route your request to the right department autonomously.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Side: Modern Glassmorphic Form Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 md:p-8 backdrop-blur-xl shadow-2xl relative h-full flex flex-col justify-center"
          >
            <AnimatePresence mode="wait">
              {!isSubmitting || submitStep < 4 ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="space-y-1">
                    <label htmlFor="name" className="text-xs font-mono font-medium text-zinc-500 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-purple-400" />
                      FULL NAME
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      disabled={isSubmitting}
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full h-10 px-3 rounded-lg border border-zinc-800 bg-zinc-950/50 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="email" className="text-xs font-mono font-medium text-zinc-500 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-purple-400" />
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      disabled={isSubmitting}
                      value={form.email}
                      onChange={handleChange}
                      placeholder="jane@example.com"
                      className="w-full h-10 px-3 rounded-lg border border-zinc-800 bg-zinc-950/50 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="message" className="text-xs font-mono font-medium text-zinc-500 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 text-purple-400" />
                      MESSAGE DETAILS
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      disabled={isSubmitting}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Ask about pricing plans, technical integration support, or partnership inquiries..."
                      className="w-full p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !form.name || !form.email || !form.message}
                    className="relative w-full h-11 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Submit to Dispatcher
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <ShieldCheck className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Message Dispatched!</h3>
                  <p className="text-zinc-400 text-xs max-w-xs mb-6 leading-relaxed">
                    Thank you, {form.name}. The AI Routing Agent successfully routed your {intent} query to the appropriate team.
                  </p>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-9 px-4 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition-all duration-200 cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Side: Interactive Agentic Routing Flow (Visual Graph & Logs) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-7 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 md:p-8 shadow-2xl space-y-6 flex flex-col justify-between"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-bold text-zinc-300 tracking-wider">
                  REAL-TIME DISPATCH ROUTER
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                <Activity className="w-3 h-3 text-purple-400" />
                <span>ONLINE</span>
              </div>
            </div>

            {/* Live Node Flow Diagram */}
            <div className="relative w-full h-20 bg-zinc-950/40 rounded-xl border border-zinc-900 px-4 overflow-hidden flex items-center justify-between">
              {/* Connector line background */}
              <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-[2px] bg-zinc-900" />

              {/* Connector line active progression */}
              <div
                className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-[2px]"
                style={{ transformOrigin: "left", width: "calc(100% - 64px)" }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-purple-400 to-emerald-400"
                  style={{ transformOrigin: "left" }}
                  initial={{ scaleX: 0 }}
                  animate={{
                    scaleX: isSubmitting ? (Math.min(submitStep, 3) / 3) : 0
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Node 1: Ingestion */}
              <div className="relative flex flex-col items-center gap-1 z-10">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${isSubmitting
                  ? "border-purple-500 bg-purple-500/10 text-purple-400 shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                  : "border-zinc-800 bg-zinc-950 text-zinc-600"
                  }`}>
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 font-medium">Ingest</span>
              </div>

              {/* Node 2: Classification */}
              <div className="relative flex flex-col items-center gap-1 z-10">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${submitStep >= 1
                  ? "border-purple-500 bg-purple-500/10 text-purple-400 shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                  : "border-zinc-800 bg-zinc-950 text-zinc-600"
                  }`}>
                  <Brain className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 font-medium">Classify</span>
              </div>

              {/* Node 3: Routing */}
              <div className="relative flex flex-col items-center gap-1 z-10">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${submitStep >= 2
                  ? "border-purple-500 bg-purple-500/10 text-purple-400 shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                  : "border-zinc-800 bg-zinc-950 text-zinc-600"
                  }`}>
                  <GitMerge className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 font-medium">Route</span>
              </div>

              {/* Node 4: Auto-Draft */}
              <div className="relative flex flex-col items-center gap-1 z-10">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${submitStep >= 3
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                  : "border-zinc-800 bg-zinc-950 text-zinc-600"
                  }`}>
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-mono text-zinc-500 font-medium">Draft</span>
              </div>
            </div>

            {/* Ingestion Stream Visualization */}
            <div className="space-y-4 font-mono text-[11px]">
              {/* Ingestion step */}
              <div className="flex items-start gap-4">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSubmitting ? "border-purple-400 bg-purple-500/10 text-purple-400" : "border-zinc-800 text-zinc-600"
                  }`}>
                  <span className="text-[9px]">1</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center text-zinc-300 font-bold mb-1">
                    <span>Message Ingestion</span>
                    {isSubmitting ? (
                      <span className="text-emerald-400 text-[10px]">INGESTED</span>
                    ) : (
                      <span className="text-zinc-600 text-[10px]">AWAITING</span>
                    )}
                  </div>
                  <p className="text-zinc-500 leading-relaxed text-[10px]">
                    Reads inbound email/message payloads and normalizes encoding structure.
                  </p>
                </div>
              </div>

              {/* Classification step */}
              <div className="flex items-start gap-4">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${submitStep >= 1 ? "border-purple-400 bg-purple-500/10 text-purple-400" : "border-zinc-800 text-zinc-600"
                  }`}>
                  <span className="text-[9px]">2</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center text-zinc-300 font-bold mb-1">
                    <span>Intent & Sentiment Classification</span>
                    {submitStep >= 1 ? (
                      <span className="text-purple-400 text-[10px]">ANALYZING...</span>
                    ) : (
                      <span className="text-zinc-600 text-[10px]">PENDING</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-2.5 bg-zinc-950 rounded-lg border border-zinc-900 mt-2 text-[10px]">
                    <div>
                      <div className="text-zinc-600">INTENT CLASSIFIER:</div>
                      <div className={form.message.length >= 5 ? "text-purple-400 font-bold" : "text-zinc-700"}>
                        {intent}
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-600">SENTIMENT VALUE:</div>
                      <div className={form.message.length >= 5 ? "text-purple-400 font-bold" : "text-zinc-700"}>
                        {sentiment}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispatching step */}
              <div className="flex items-start gap-4">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${submitStep >= 2 ? "border-purple-400 bg-purple-500/10 text-purple-400" : "border-zinc-800 text-zinc-600"
                  }`}>
                  <span className="text-[9px]">3</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center text-zinc-300 font-bold mb-1">
                    <span>Agent Destination Routing</span>
                    {submitStep >= 2 ? (
                      <span className="text-purple-400 text-[10px]">ROUTING...</span>
                    ) : (
                      <span className="text-zinc-600 text-[10px]">PENDING</span>
                    )}
                  </div>
                  <p className="text-zinc-500 leading-relaxed text-[10px]">
                    Resolves department endpoint and queues communication into the active handler workflow.
                  </p>
                  {submitStep >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-400 text-[10px] mt-2 space-y-1 font-mono"
                    >
                      <div className="flex justify-between text-zinc-500">
                        <span>Destination Resolved:</span>
                        <span className="text-purple-400 font-bold">
                          {intent.includes("Sales") ? "sales@trivisionx" : "support@trivisionx"}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-500">
                        <span>Database Session ID:</span>
                        <span className="text-zinc-300">sso_inquiry_9a3f</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Auto reply draft step */}
              <div className="flex items-start gap-4">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${submitStep >= 3 ? "border-purple-400 bg-purple-500/10 text-purple-400" : "border-zinc-800 text-zinc-600"
                  }`}>
                  <span className="text-[9px]">4</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center text-zinc-300 font-bold mb-1">
                    <span>Auto-Draft Response</span>
                    {submitStep === 3 ? (
                      <span className="text-purple-400 text-[10px]">COMPILING...</span>
                    ) : submitStep >= 4 ? (
                      <span className="text-emerald-400 text-[10px]">COMPLETED</span>
                    ) : (
                      <span className="text-zinc-600 text-[10px]">PENDING</span>
                    )}
                  </div>
                  <p className="text-zinc-500 leading-relaxed text-[10px]">
                    Drafts a contextual response based on the category using the designated LLM, ready for verification.
                  </p>
                  {submitStep >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-500 text-[10px] mt-2 space-y-1 font-mono"
                    >
                      <span className="text-zinc-600 text-[9px] uppercase font-bold tracking-wider">Draft Response:</span>
                      <p className="text-zinc-300 italic text-[9.5px] leading-relaxed mt-1">
                        "Hi {form.name || "there"}, thank you for your query regarding {intent.toLowerCase()}. An agent has been assigned to your request and will follow up within 2 hours."
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Router Logs Console */}
            <div className="bg-zinc-950 border border-zinc-900/60 rounded-xl p-4 space-y-2.5 font-mono text-[9px] text-zinc-400">
              <div className="flex items-center gap-2 text-zinc-500 border-b border-zinc-900 pb-2">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold tracking-wider text-[8px] uppercase">Router Console Outputs</span>
              </div>
              <div className="space-y-1.5 leading-relaxed">
                {form.message.length >= 5 ? (
                  <>
                    <div className="text-zinc-500 flex justify-between">
                      <span>[PAYLOAD] Length: {form.message.length} chars</span>
                      <span>STATUS: OK</span>
                    </div>
                    <div className="text-purple-400">
                      [CLASSIFY] Intent matching: "{intent}"
                    </div>
                    <div className="text-purple-300">
                      [CLASSIFIER] Sentiment evaluation: {sentiment}
                    </div>
                  </>
                ) : (
                  <div className="text-zinc-600 italic">
                    [AWAITING] Start typing a message to begin stream...
                  </div>
                )}

                {submitStep >= 1 && (
                  <div className="text-purple-400 animate-pulse">
                    [TRANSIT] Processing LangGraph transition to routing node...
                  </div>
                )}
                {submitStep >= 2 && (
                  <div className="text-blue-400">
                    [ENDPOINT] Directed message to database query engine ➜ {intent.includes("Sales") ? "sales@trivisionx" : "support@trivisionx"}
                  </div>
                )}
                {submitStep >= 3 && (
                  <div className="text-emerald-400 font-bold">
                    [SUCCESS] LLM reply compiled. Auto-reply response payload dispatched.
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
