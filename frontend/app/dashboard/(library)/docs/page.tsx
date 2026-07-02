"use client";

import { DashboardDocsTable } from "@/components/DashboardDocsTable"
import DocumentViewerDemo from "@/components/DocumentViewerDemo"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardDocsPage() {
  return (
    <div className="relative min-h-full bg-background pb-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_60%)] pointer-events-none" />

      <div className="relative px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
              <span className="relative inline-flex items-center rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                Data Overview
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Document Library
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Browse and manage your uploaded documents and conversations. Use the
            tables below to search, sort, and organize your research data.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="library">Library Table</TabsTrigger>
            <TabsTrigger value="viewer">Document Viewer</TabsTrigger>
          </TabsList>

          <TabsContent value="library">
            <DashboardDocsTable />
          </TabsContent>

          <TabsContent value="viewer">
            <DocumentViewerDemo />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

