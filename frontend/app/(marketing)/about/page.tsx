import { PageShell, Section } from "@/components/page-shell";
import type { Metadata } from "next";
import { Eye, Zap, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export const metadata: Metadata = { title: "About — TriVisionX", description: "Our mission, story, and the team behind TriVisionX." };

const values = [
  { icon: Eye, title: "Transparency First", desc: "Every AI output is traceable. We never hide behind a black box." },
  { icon: Zap, title: "Speed & Precision", desc: "We optimize for both — fast answers that are actually accurate." },
  { icon: Lock, title: "Privacy by Design", desc: "Your data is yours. We never train on customer data without consent." },
];

const stats = [
  { value: "2026", label: "Founded" },
  { value: "1", label: "Team members" },
  { value: "0", label: "Countries" },
  { value: "$0", label: "Raised" },
];

const team = [
  { name: "Sopan Munde", role: "CEO & Founder", initials: "SM", color: "bg-grey-500" },
];

export default function AboutPage() {
  return (
    <PageShell badge="Company" title="About TriVisionX" subtitle="We're on a mission to make autonomous AI research accessible to every organization on the planet.">

      {/* Stats bar */}
      <Card className="p-8 mb-16 bg-muted/30 border-dashed">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 divide-x divide-border">
          {stats.map((s) => (
            <div key={s.label} className="text-center px-4">
              <div className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">{s.value}</div>
              <div className="text-sm text-muted-foreground font-mono uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Section title="Our Story">
        <div className="prose prose-zinc dark:prose-invert max-w-none text-muted-foreground leading-loose">
          <p>TriVisionX was founded in 2026 by a team of AI researchers and engineers who believed that the future of knowledge work wasn&apos;t human-only or AI-only — it was deeply collaborative. We saw that existing AI tools were isolated assistants, not true research partners.</p>
          <p>So we built one. TriVisionX is the first platform to combine multi-agent orchestration, semantic vector retrieval, and real-time synthesis into a single, enterprise-ready product. Today, teams across research, finance, legal, and engineering use TriVisionX to accelerate their most complex thinking.</p>
        </div>
      </Section>

      <Section title="Our Values">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {values.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-6 hover:bg-card/80 transition-colors duration-300 cursor-pointer group border-border">
              <div className="inline-flex p-3 rounded-xl bg-secondary border border-border text-primary group-hover:scale-110 transition-transform mb-5">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-foreground mb-2 text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Meet the Team">
        <p className="text-muted-foreground mb-8">We&apos;re a remote-first, united by a passion for AI, distributed systems, and making research genuinely useful.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {team.map((member) => (
            <HoverCard key={member.name}>
              <HoverCardTrigger asChild>
                <div className="flex flex-col items-center gap-3 cursor-pointer group">
                  <Avatar className="w-16 h-16 border-2 border-transparent group-hover:border-primary transition-colors">
                    <AvatarFallback className={`${member.color} text-white font-mono text-lg`}>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{member.role}</p>
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-64">
                <div className="flex justify-between space-x-4">
                  <Avatar>
                    <AvatarFallback className={`${member.color} text-white`}>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">{member.name}</h4>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                    <p className="text-xs pt-2">Working on advancing the state of multi-agent AI from anywhere in the world.</p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
        <div className="mt-12 p-6 rounded-lg bg-card border border-border text-center">
          <p className="text-sm font-mono">We&apos;re hiring! View open roles at <a href="/careers" className="text-primary hover:underline">careers@trivisionx.ai</a></p>
        </div>
      </Section>
    </PageShell>
  );
}
