"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import Sidebar from "./Sidebar";
import ChatPane from "./ChatPane";
import Header from "./Header";
import { INITIAL_TEMPLATES, INITIAL_FOLDERS } from "./mockData";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { DashboardDocsTable } from "./DashboardDocsTable";
import { EmailDashboard } from "./EmailDashboard";
import { BrainDashboard } from "./BrainDashboard";
import { CalendarDashboard } from "./CalendarDashboard";
import { TaskDashboard } from "./TaskDashboard";
import { NotesDashboard } from "./NotesDashboard";

export default function AIAssistantUI() {
  const router = useRouter();
  const [theme, setTheme] = useState(() => {
    const saved =
      typeof window !== "undefined" && localStorage.getItem("theme");
    if (saved) return saved;
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    )
      return "dark";
    return "light";
  });

  useEffect(() => {
    try {
      if (theme === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.style.colorScheme = theme;
      localStorage.setItem("theme", theme);
    } catch { }
  }, [theme]);

  useEffect(() => {
    try {
      const media =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
      if (!media) return;
      const listener = (e) => {
        const saved = localStorage.getItem("theme");
        if (!saved) setTheme(e.matches ? "dark" : "light");
      };
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    } catch { }
  }, []);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
      }
    } catch { }
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("sidebar-collapsed");
        return raw
          ? JSON.parse(raw)
          : { pinned: true, recent: false, folders: true, templates: true };
      }
      return { pinned: true, recent: false, folders: true, templates: true };
    } catch {
      return { pinned: true, recent: false, folders: true, templates: true };
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed));
    } catch { }
  }, [collapsed]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("sidebar-collapsed-state");
        return saved ? JSON.parse(saved) : false;
      }
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "sidebar-collapsed-state",
        JSON.stringify(sidebarCollapsed),
      );
    } catch { }
  }, [sidebarCollapsed]);

  const [conversations, setConversations] = useState([]);
  const [isConversationsLoaded, setIsConversationsLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem("dashboard-selected-id");
      if (saved) {
        setSelectedId(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      if (selectedId) {
        localStorage.setItem("dashboard-selected-id", selectedId);
      } else {
        localStorage.removeItem("dashboard-selected-id");
      }
    } catch { }
  }, [selectedId, isMounted]);


  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);

  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  const [isThinking, setIsThinking] = useState(false);
  const [thinkingConvId, setThinkingConvId] = useState(null);
  const [isResponding, setIsResponding] = useState(false);
  const [agentState, setAgentState] = useState(null);
  const [providerSwitchEvent, setProviderSwitchEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedBot, setSelectedBot] = useState("Fast");

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        createNewChat();
      }
      if (!e.metaKey && !e.ctrlKey && e.key === "/") {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen, conversations]);

  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const apiUrl = API_BASE_URL;
        const res = await fetch(`${apiUrl}/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setConversations(
            data.map((c) => ({
              ...c,
              updatedAt:
                c.updated_at || c.updatedAt || new Date().toISOString(),
              messages: [],
              messageCount: c.messageCount || 0,
              preview: c.preview || "",
            })),
          );
          setIsConversationsLoaded(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (isConversationsLoaded) {
      const specialIds = ["new", "email", "docs", "brain", "calendar", "tasks", "notes"];
      if (!selectedId) {
        setSelectedId("new");
      } else if (!specialIds.includes(selectedId)) {
        const exists = conversations.some((c) => c.id === selectedId);
        if (!exists) {
          setSelectedId("new");
        }
      }
    }
  }, [isConversationsLoaded, selectedId, conversations]);

  useEffect(() => {
    if (!selectedId || selectedId === "new") return;
    const conv = conversations.find((c) => c.id === selectedId);
    if (conv && conv.messages.length === 0 && conv.messageCount > 0) {
      const fetchMessages = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
          const apiUrl = API_BASE_URL;
          const res = await fetch(
            `${apiUrl}/conversations/${selectedId}/messages`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (res.ok) {
            const msgs = await res.json();
            setConversations((prev) =>
              prev.map((c) =>
                c.id === selectedId
                  ? {
                    ...c,
                    messages: msgs,
                    messageCount: msgs.length,
                    preview:
                      msgs.length > 0
                        ? msgs[msgs.length - 1].content.slice(0, 120)
                        : c.preview,
                  }
                  : c,
              ),
            );
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchMessages();
    }
  }, [selectedId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        (c.preview || "").toLowerCase().includes(q),
    );
  }, [conversations, query]);

  const pinned = filtered
    .filter((c) => c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const recent = filtered
    .filter((c) => !c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 10);

  const folderCounts = React.useMemo(() => {
    const map = Object.fromEntries(folders.map((f) => [f.name, 0]));
    for (const c of conversations)
      if (map[c.folder] != null) map[c.folder] += 1;
    return map;
  }, [conversations, folders]);

  function togglePin(id) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
    );
  }

  function createNewChat() {
    setSelectedId("new");
    setSidebarOpen(false);
  }

  async function deleteConversation(id) {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/conversations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (selectedId === id) setSelectedId(null);
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  }

  async function renameConversation(id, newTitle) {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/conversations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, title: newTitle, updatedAt: new Date().toISOString() }
              : c,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to rename conversation", err);
    }
  }

  function createFolder(name) {
    if (!name) return;
    if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase()))
      return alert("Folder already exists.");
    setFolders((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), name },
    ]);
  }

  function deleteFolder(name) {
    setFolders((prev) => prev.filter((f) => f.name !== name));
    setConversations((prev) =>
      prev.map((c) => (c.folder === name ? { ...c, folder: null } : c)),
    );
  }

  function renameFolder(oldName, newName) {
    if (!newName || !newName.trim()) return;
    if (folders.some((f) => f.name.toLowerCase() === newName.toLowerCase()))
      return alert("Folder already exists.");
    setFolders((prev) =>
      prev.map((f) => (f.name === oldName ? { ...f, name: newName } : f)),
    );
    setConversations((prev) =>
      prev.map((c) => (c.folder === oldName ? { ...c, folder: newName } : c)),
    );
  }

  async function sendMessage(convId, content, mode = "research", fileRef = null, selectedBot = "Fast") {
    const token = localStorage.getItem("token");
    if (!content.trim() && !fileRef || !token) return;

    let targetConvId = convId;
    const now = new Date().toISOString();
    const userMsg = {
      id: Math.random().toString(36).slice(2),
      role: "user",
      content,
      createdAt: now,
      ...(fileRef ? { attachedFile: fileRef } : {}),
    };

    if (convId === "new") {
      try {
        const apiUrl = API_BASE_URL;
        const res = await fetch(`${apiUrl}/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title:
              content.trim().split(/\s+/).slice(0, 6).join(" ").slice(0, 50) ||
              "New Chat",
            folder: "Work Projects",
            pinned: false,
          }),
        });
        if (res.ok) {
          const item = await res.json();
          targetConvId = item.id;
          const initialConv = {
            ...item,
            updatedAt: now,
            messages: [userMsg],
            messageCount: 1,
            preview: content.slice(0, 80),
          };
          setConversations((prev) => [initialConv, ...prev]);
          setSelectedId(targetConvId);
        } else {
          return;
        }
      } catch (err) {
        console.error("Failed to create conversation", err);
        return;
      }
    } else {
      const targetConv = conversations.find((c) => c.id === convId);
      if (targetConv && targetConv.title === "New Chat") {
        let newTitle = content.trim().split(/\s+/).slice(0, 5).join(" ");
        if (newTitle.length < content.trim().length) newTitle += "...";
        renameConversation(convId, newTitle);
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const msgs = [...(c.messages || []), userMsg];
          return {
            ...c,
            messages: msgs,
            updatedAt: now,
            messageCount: msgs.length,
            preview: content.slice(0, 80),
          };
        }),
      );
    }

    const asstMsgId = Math.random().toString(36).slice(2);
    if (selectedBot !== "Fast") {
      setIsThinking(true);
      setThinkingConvId(targetConvId);
    }
    setIsResponding(true);
    setAgentState(null);
    setProviderSwitchEvent(null);

    try {
      const apiUrl = API_BASE_URL;
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          msg: content,
          conversation_id: targetConvId,
          mode,
          filename: fileRef ? fileRef.name : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let textContent = "";
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || ""; // keep the incomplete part in buffer
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              try {
                const data = JSON.parse(dataStr);

                if (data.error) {
                  throw new Error(data.error);
                }

                if (data.type === "token" && data.data) {
                  setIsThinking(false);
                  setThinkingConvId(null);

                  textContent += data.data;
                  setConversations((prev) =>
                    prev.map((c) => {
                      if (c.id !== targetConvId) return c;
                      const hasAsstMsg = c.messages.some((m) => m.id === asstMsgId);
                      let msgs;
                      if (!hasAsstMsg) {
                        msgs = [
                          ...c.messages,
                          {
                            id: asstMsgId,
                            role: "assistant",
                            content: textContent,
                            createdAt: new Date().toISOString(),
                          },
                        ];
                      } else {
                        msgs = c.messages.map((m) =>
                          m.id === asstMsgId ? { ...m, content: textContent } : m,
                        );
                      }
                      return { ...c, messages: msgs, preview: textContent.slice(0, 80) };
                    }),
                  );
                }

                if (data.node) {
                  setAgentState(data.node);
                }

                if (data.type === "citations" && data.data) {
                }

                if (data.type === "quality_score" && data.data) {
                  setConversations((prev) =>
                    prev.map((c) => {
                      if (c.id !== targetConvId) return c;
                      const msgs = c.messages.map((m) =>
                        m.id === asstMsgId ? { ...m, quality_score: data.data } : m,
                      );
                      return { ...c, messages: msgs };
                    }),
                  );
                }

                if (data.type === "provider_switch") {
                  setProviderSwitchEvent({ from: data.from, to: data.to, reason: data.reason });
                }

                if (data.done) {
                  setConversations((prev) =>
                    prev.map((c) => {
                      if (c.id !== targetConvId) return c;
                      const msgs = c.messages.map((m) =>
                        m.id === asstMsgId ? { ...m, sources: data.sources } : m,
                      );
                      return { ...c, messages: msgs };
                    }),
                  );
                  setAgentState(null);
                  setIsThinking(false);
                  setThinkingConvId(null);
                  setIsResponding(false);
                  setProviderSwitchEvent(null);
                }
              } catch (e) {
              }
            }
          }
        }
      }
      setIsResponding(false);
    } catch (error) {
      console.error("Error fetching response:", error);
      setIsResponding(false);
      setIsThinking(false);
      setThinkingConvId(null);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== targetConvId) return c;
          const msgs = c.messages.map((m) =>
            m.id === asstMsgId
              ? {
                  ...m,
                  content:
                    "Sorry, I couldn't process your request. Please try again.",
                }
              : m,
          );
          return { ...c, messages: msgs };
        }),
      );
    }
  }
  function editMessage(convId, messageId, newContent) {
    const now = new Date().toISOString();
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const msgs = (c.messages || []).map((m) =>
          m.id === messageId ? { ...m, content: newContent, editedAt: now } : m,
        );
        return {
          ...c,
          messages: msgs,
          preview: msgs[msgs.length - 1]?.content?.slice(0, 80) || c.preview,
        };
      }),
    );
  }

  function resendMessage(convId, messageId, selectedBot = "Fast") {
    const conv = conversations.find((c) => c.id === convId);
    const msg = conv?.messages?.find((m) => m.id === messageId);
    if (!msg) return;
    sendMessage(convId, msg.content, undefined, undefined, selectedBot);
  }

  function pauseThinking() {
    setIsThinking(false);
    setThinkingConvId(null);
    setIsResponding(false);
    setAgentState(null);
  }

  function handleUseTemplate(template) {
    if (composerRef.current) {
      composerRef.current.insertTemplate(template.content);
    }
  }

  const composerRef = useRef(null);

  const selected = useMemo(() => {
    if (selectedId === "new") {
      return {
        id: "new",
        title: "New Chat",
        messages: [],
        preview: "Say hello to start...",
      };
    }
    return conversations.find((c) => c.id === selectedId) || null;
  }, [selectedId, conversations]);

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Background radial glows to match landing page */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-0 dark:opacity-[0.06] transition-opacity duration-300 z-0"
        style={{
          background:
            "radial-gradient(ellipse, rgba(139,92,246,1) 0%, rgba(59,130,246,0.5) 40%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-0 dark:opacity-[0.04] transition-opacity duration-300 z-0"
        style={{
          background:
            "radial-gradient(ellipse, rgba(59,130,246,1) 0%, rgba(139,92,246,0.5) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex h-full w-full overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          conversations={conversations}
          pinned={pinned}
          recent={recent}
          folders={folders}
          folderCounts={folderCounts}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setSidebarOpen(false);
          }}
          togglePin={togglePin}
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          createFolder={createFolder}
          deleteFolder={deleteFolder}
          renameFolder={renameFolder}
          createNewChat={createNewChat}
          templates={templates}
          setTemplates={setTemplates}
          onUseTemplate={handleUseTemplate}
          onDeleteConversation={deleteConversation}
          onRenameConversation={renameConversation}
          user={user}
          onUserUpdate={fetchUser}
        />

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header
            createNewChat={createNewChat}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarOpen={setSidebarOpen}
            user={user}
            onUserUpdate={fetchUser}
            selectedBot={selectedBot}
            setSelectedBot={setSelectedBot}
          />
          {selectedId === "docs" ? (
            <div className="relative flex-1 overflow-y-auto bg-background pb-16">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_60%)] pointer-events-none" />
              <div className="relative px-6 py-8 lg:px-8 max-w-7xl mx-auto">
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
                    Gallery
                  </h1>
                  <p className="max-w-2xl text-base text-muted-foreground">
                    Browse and manage your uploaded documents, images, and conversations. Use the
                    tables below to search, sort, and organize your files.
                  </p>
                </div>
                <DashboardDocsTable />
              </div>
            </div>
          ) : selectedId === "calendar" ? (
            <CalendarDashboard />
          ) : selectedId === "email" ? (
            <EmailDashboard />
          ) : selectedId === "brain" ? (
            <BrainDashboard />
          ) : selectedId === "tasks" ? (
            <TaskDashboard />
          ) : selectedId === "notes" ? (
            <NotesDashboard />
          ) : (
            <ChatPane
              ref={composerRef}
              conversation={selected}
              user={user}
              onSend={(content, mode, fileRef) => {
                if (selected) sendMessage(selected.id, content, mode, fileRef, selectedBot);
              }}
              onEditMessage={(messageId, newContent) =>
                selected && editMessage(selected.id, messageId, newContent)
              }
              onResendMessage={(messageId) => {
                if (selected) resendMessage(selected.id, messageId, selectedBot);
              }}
              isThinking={isThinking && thinkingConvId === selected?.id}
              isResponding={isResponding}
              onPauseThinking={pauseThinking}
              agentState={agentState}
              providerSwitchEvent={providerSwitchEvent}
              onDismissProviderSwitch={() => setProviderSwitchEvent(null)}
              selectedBot={selectedBot}
            />
          )}
        </main>
      </div>
    </div>
  );
}
