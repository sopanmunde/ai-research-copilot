import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";

function getIconComponent(name: string) {
  const pascalCaseName = name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  return (LucideIcons as any)[pascalCaseName] || (LucideIcons as any)[name];
}

export function PageShell({
  badge,
  title,
  subtitle,
  children,
}: {
  badge?: string | React.ReactNode;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_60%)] pointer-events-none" />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl relative">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          {badge && (
            <div className="relative mb-2">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
              <Badge variant="secondary" className="relative">{badge}</Badge>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-2xl text-lg text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Section({
  title,
  children,
  className = "",
  delay,
}: {
  title?: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <section className={`relative py-12 mt-12 ${className}`}>
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      {title && <h2 className="text-2xl font-bold mb-6 text-foreground">{title}</h2>}
      {children}
    </section>
  );
}

export function CardGrid({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  description,
  children,
  className = "",
  delay,
}: {
  icon?: string;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const IconComponent = icon ? getIconComponent(icon) : null;
  
  return (
    <Card className={`group relative h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 bg-card/80 backdrop-blur-sm ${className}`}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <CardHeader className="relative">
        {IconComponent && (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center mb-4 border border-border/60 shadow-sm group-hover:border-primary/30 group-hover:shadow-primary/10 transition-all duration-300">
            <IconComponent className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
          </div>
        )}
        <CardTitle className="group-hover:text-primary transition-colors">{title}</CardTitle>
        {description && <CardDescription className="leading-relaxed">{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent className="relative">{children}</CardContent>}
    </Card>
  );
}

export function MacPanel({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <Card className={`overflow-hidden border border-border ${className}`}>
      <div className="h-10 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
      </div>
      <div className="p-0 bg-background">
        {children}
      </div>
    </Card>
  );
}

export function MacBadge({ children, className = "", color = "secondary" }: { children: React.ReactNode, className?: string, color?: string }) {
  return (
    <Badge variant={color as any} className={`font-mono text-xs ${className}`}>
      {children}
    </Badge>
  );
}
