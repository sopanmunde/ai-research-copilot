"use client";

import { useState } from "react";
import DocumentViewer from "@/components/DocumentViewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText, FileImage, FileCode, FileJson, FileSpreadsheet,
  FileVideo, FileAudio, File as FileIcon, Eye, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_FILES = [
  {
    id: "md",
    name: "README.md",
    size: 2048,
    uploadedAt: new Date().toISOString(),
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    content: `# TriVisionX Documentation

Welcome to the **TriVisionX** platform — an AI-powered research assistant.

## Features

- 🧠 **Multi-agent RAG pipeline** for deep document research
- 📎 **File upload** supporting PDFs, images, code, and more
- 💬 **Conversation management** with folder organization
- 🔍 **Semantic search** across all uploaded content

## Getting Started

\`\`\`bash
git clone https://github.com/trivisionx/ai
cd trivisionx-ai
bun install
bun dev
\`\`\`

## Architecture

| Component | Description |
|---|---|
| \`ChatPane\` | Main conversation interface |
| \`Composer\` | Message input with file upload |
| \`Sidebar\` | Conversation management |
| \`DocumentLibrary\` | File management panel |

> **Note:** Make sure to set your environment variables in \`.env.local\` before starting.

## License

MIT © TriVisionX Team
`,
  },
  {
    id: "json",
    name: "config.json",
    size: 512,
    uploadedAt: new Date().toISOString(),
    icon: FileJson,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    content: JSON.stringify({
      version: "1.0.0",
      app: "TriVisionX",
      settings: {
        theme: "dark",
        language: "en",
        maxUploadMB: 100,
        supportedModels: ["Fast", "Gemini", "Claude Sonnet 4", "Assistant"],
      },
      features: {
        ragEnabled: true,
        webSearch: true,
        fileUpload: true,
        agentMode: true,
      },
    }, null, 2),
  },
  {
    id: "csv",
    name: "analytics.csv",
    size: 1024,
    uploadedAt: new Date().toISOString(),
    icon: FileSpreadsheet,
    color: "text-green-500",
    bg: "bg-green-500/10 border-green-500/20",
    content: `Date,Users,Sessions,Pages Viewed,Avg Duration
2026-06-01,1240,2100,8400,3.5
2026-06-02,1380,2350,9200,3.8
2026-06-03,980,1600,6100,2.9
2026-06-04,1560,2800,11200,4.1
2026-06-05,1720,3100,12400,4.5
2026-06-06,2100,3800,15200,5.1
2026-06-07,2450,4200,16800,5.6`,
  },
  {
    id: "py",
    name: "agent.py",
    size: 3072,
    uploadedAt: new Date().toISOString(),
    icon: FileCode,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    content: `"""
TriVisionX Research Agent
Multi-agent RAG pipeline for document analysis
"""

from langchain.agents import AgentExecutor
from langchain.prompts import ChatPromptTemplate
from typing import List, Dict, Any


class ResearchAgent:
    """Multi-agent research pipeline."""

    def __init__(self, llm, vector_store):
        self.llm = llm
        self.vector_store = vector_store
        self.tools = self._build_tools()

    def _build_tools(self) -> List:
        """Build agent tool set."""
        return [
            self._retrieval_tool(),
            self._summarization_tool(),
            self._citation_tool(),
        ]

    def _retrieval_tool(self):
        """Semantic document retrieval."""
        def retrieve(query: str) -> List[Dict[str, Any]]:
            docs = self.vector_store.similarity_search(query, k=5)
            return [{"content": d.page_content, "source": d.metadata} for d in docs]
        return retrieve

    async def run(self, query: str) -> str:
        """Execute the research pipeline."""
        context = self._retrieval_tool()(query)
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a research assistant. Use the context to answer accurately."),
            ("user", "Context:\\n{context}\\n\\nQuestion: {query}"),
        ])
        response = await self.llm.ainvoke(
            prompt.format(context=context, query=query)
        )
        return response.content


if __name__ == "__main__":
    import asyncio
    # Example usage
    agent = ResearchAgent(llm=None, vector_store=None)
    result = asyncio.run(agent.run("What are the main findings?"))
    print(result)
`,
  },
  {
    id: "txt",
    name: "notes.txt",
    size: 768,
    uploadedAt: new Date().toISOString(),
    icon: FileText,
    color: "text-zinc-500",
    bg: "bg-zinc-500/10 border-zinc-500/20",
    content: `Meeting Notes — June 30, 2026
================================

Attendees: Sopan, Team Lead, Dev Team

Topics Discussed:
-----------------
1. DocumentViewer feature rollout
   - Support for PDF, images, text, video, audio
   - Integrated into DocumentLibrary panel
   - Using shadcn Sheet + ReactMarkdown

2. Performance improvements
   - Lazy load viewer content
   - Stream large text files

3. Next Sprint
   - Add annotation support
   - Add page navigation for PDFs
   - Export notes from viewer

Action Items:
-------------
[ ] Sopan: Test viewer with large PDFs
[ ] Dev: Add keyboard shortcuts (Esc to close)
[ ] Team: Review UX on mobile

Next Meeting: July 7, 2026
`,
  },
  {
    id: "svg",
    name: "logo.svg",
    size: 1200,
    uploadedAt: new Date().toISOString(),
    icon: FileImage,
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
    url: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="url(#g)"/>
  <text x="100" y="120" font-size="80" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold">TV</text>
</svg>`),
  },
];

const TYPE_LABELS = {
  md: "Markdown",
  json: "JSON",
  csv: "CSV Table",
  py: "Python",
  txt: "Plain Text",
  svg: "SVG Image",
};

export default function DocumentViewerDemo() {
  const [selected, setSelected] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      const type = file.type;
      const isText = type.startsWith("text/") || ["application/json"].includes(type);
      const isImage = type.startsWith("image/");
      const isVideo = type.startsWith("video/");
      const isAudio = type.startsWith("audio/");

      if (isText) {
        reader.onload = ev => {
          setUploadedFiles(prev => [...prev, {
            id: file.name + Date.now(),
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            content: ev.target.result,
          }]);
        };
        reader.readAsText(file);
      } else if (isImage || isVideo || isAudio || file.name.endsWith(".pdf")) {
        reader.onload = ev => {
          setUploadedFiles(prev => [...prev, {
            id: file.name + Date.now(),
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            url: ev.target.result,
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadedFiles(prev => [...prev, {
          id: file.name + Date.now(),
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        }]);
      }
    });
    e.target.value = "";
  }

  const allFiles = [...DEMO_FILES, ...uploadedFiles];

  return (
    <div className="relative min-h-full bg-zinc-50 dark:bg-zinc-950 pb-16">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.04),transparent_60%)] pointer-events-none" />

      <div className="relative px-6 py-8 lg:px-8 max-w-5xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="rounded-full text-[11px] font-semibold">Document Viewer</Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Open any file
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Preview PDFs, images, code, markdown, CSV tables, videos, audio, and more — all in one panel.
          </p>
        </div>

        {/* Upload button */}
        <div className="mb-8">
          <label htmlFor="file-upload-demo" className="cursor-pointer">
            <Button variant="outline" className="gap-2 rounded-xl border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md transition-all" asChild>
              <span>
                <Upload className="h-4 w-4" />
                Upload your own file
              </span>
            </Button>
          </label>
          <input
            id="file-upload-demo"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* File grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allFiles.map(file => {
            const FileIconComp = file.icon || FileIcon;
            const fileColor = file.color || "text-zinc-500";
            const fileBg = file.bg || "bg-zinc-500/10 border-zinc-500/20";
            const ext = (file.name?.split(".").pop() || "").toUpperCase();
            const label = TYPE_LABELS[file.id] || ext;

            return (
              <Card
                key={file.id}
                className="group cursor-pointer border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200"
                onClick={() => setSelected(file)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border", fileBg)}>
                      <FileIconComp className={cn("h-5 w-5", fileColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{file.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 font-bold">{ext}</Badge>
                        {file.size && (
                          <span className="text-[11px] text-zinc-400">
                            {file.size < 1024 ? `${file.size} B` : `${(file.size / 1024).toFixed(1)} KB`}
                          </span>
                        )}
                      </div>
                      {label && label !== ext && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">{label}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {allFiles.length === 0 && (
          <div className="text-center py-20 text-zinc-400 text-sm">
            Upload files above to preview them.
          </div>
        )}
      </div>

      {/* Document viewer panel */}
      <DocumentViewer
        open={!!selected}
        onClose={() => setSelected(null)}
        file={selected}
      />
    </div>
  );
}
