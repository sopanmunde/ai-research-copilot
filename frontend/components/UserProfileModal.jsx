"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  AtSign,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Camera,
  Shield,
  Trash2,
  ChevronRight,
  Fingerprint,
  CreditCard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import ModernConfirmDialog from "./ModernConfirmDialog";
import { toast } from "sonner";

export function UserProfileModal({ isOpen, onClose, onUpdate = () => {} }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [deleteAccountConfirmOpen, setDeleteAccountConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    } else {
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        username: data.username || "",
        email: data.email || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiUrl}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          username: formData.username,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update profile");

      setSuccess("Profile updated successfully!");
      onUpdate(); // Trigger refresh in parent
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteAccount = () => {
    setDeleteAccountConfirmOpen(false);
    localStorage.removeItem("token");
    document.cookie = "auth_token=; path=/; max-age=0";
    toast.success("Account permanently deleted");
    setTimeout(() => {
      window.location.href = "/signup";
    }, 1200);
  };

  const initials =
    (
      (formData.first_name?.[0] || "") + (formData.last_name?.[0] || "")
    ).toUpperCase() ||
    formData.username?.[0]?.toUpperCase() ||
    "U";

  const inputClass = (field) =>
    `w-full rounded-xl border bg-muted/30 px-4 py-2.5 text-[14px] text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground ${
      focusedField === field
        ? "border-ring ring-1 ring-ring"
        : "border-border hover:border-ring/50"
    }`;

  const tabs = [
    { id: "general", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[24px] border-border bg-background shadow-2xl sm:rounded-[24px]">
        <div className="relative flex max-h-[85vh] flex-col">
          <DialogHeader className="px-8 pt-8 pb-4 text-left">
            <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
              Settings
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground font-medium">
              Manage your account and preferences
            </DialogDescription>
          </DialogHeader>
            <div className="relative flex h-full flex-col">

              <div className="px-8 mb-6">
                <div className="flex p-1 gap-1 rounded-xl bg-muted/50 border border-border/80">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-bold transition-all ${
                        activeTab === tab.id
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTabCompact"
                          className="absolute inset-0 rounded-lg bg-card border border-border shadow-sm"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                      <tab.icon className="relative z-10 h-3.5 w-3.5" />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 pb-10 scrollbar-none">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-6 w-6 animate-spin text-foreground" />
                    <p className="text-[13px] text-muted-foreground">Syncing data…</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {activeTab === "general" && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                      >
                        <div className="flex flex-col items-center py-4">
                          <div className="relative group/avatar mb-4">
                            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-primary text-3xl font-bold text-primary-foreground shadow-xl border-border">
                              {initials}
                            </div>
                            <button
                              type="button"
                              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl bg-background border border-border text-muted-foreground shadow-lg transition-all hover:bg-accent hover:text-foreground"
                            >
                              <Camera className="h-4.5 w-4.5" />
                            </button>
                          </div>
                          <h3 className="text-lg font-bold text-foreground">
                            {formData.first_name} {formData.last_name}
                          </h3>
                          <p className="text-[13px] text-muted-foreground font-medium">
                            {formData.email}
                          </p>
                        </div>

                        <div className="space-y-5">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                                First Name
                              </label>
                              <input
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                onFocus={() => setFocusedField("first_name")}
                                onBlur={() => setFocusedField(null)}
                                className={inputClass("first_name")}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                                Last Name
                              </label>
                              <input
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                onFocus={() => setFocusedField("last_name")}
                                onBlur={() => setFocusedField(null)}
                                className={inputClass("last_name")}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                              Username
                            </label>
                            <div className="relative">
                              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <input
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                onFocus={() => setFocusedField("username")}
                                onBlur={() => setFocusedField(null)}
                                className={`${inputClass("username")} pl-11`}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "security" && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                      >
                        <div className="rounded-2xl border-border bg-muted/30 p-2 space-y-1">
                          {[
                            {
                              icon: Fingerprint,
                              label: "Biometric Login",
                              status: "Active",
                            },
                            {
                              icon: Shield,
                              label: "2-Factor Auth",
                              status: "Off",
                            },
                          ].map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="flex w-full items-center justify-between rounded-xl px-4 py-3 hover:bg-background transition-colors border border-transparent hover:border-border/80 shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-background border border-border flex items-center justify-center">
                                  <item.icon className="h-4.5 w-4.5 text-muted-foreground" />
                                </div>
                                <span className="text-[14px] font-bold text-foreground">
                                  {item.label}
                                </span>
                              </div>
                              <span
                                className={`text-[11px] font-bold ${item.status === "Active" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                              >
                                {item.status}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="pt-6">
                          <button
                            type="button"
                            onClick={() => setDeleteAccountConfirmOpen(true)}
                            className="group flex w-full items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 hover:bg-destructive/20 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <Trash2 className="h-4.5 w-4.5 text-destructive" />
                              <span className="text-[14px] font-bold text-destructive">
                                Delete Account
                              </span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-destructive/50 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    <AnimatePresence>
                      {success && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-3 rounded-xl bg-foreground p-3.5 text-[13px] font-bold text-background shadow-xl"
                        >
                          <Check className="h-4 w-4" />
                          {success}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-3 pt-6">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-border bg-background py-3 text-[13px] font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="relative flex-[1.5] overflow-hidden rounded-xl bg-primary py-3 text-[13px] font-bold text-primary-foreground shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 hover:bg-primary/90"
                      >
                        <span className="relative flex items-center justify-center gap-2">
                          {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5" />
                          )}
                          Save Changes
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
        </div>
      </DialogContent>
      
      <ModernConfirmDialog
        isOpen={deleteAccountConfirmOpen}
        onClose={() => setDeleteAccountConfirmOpen(false)}
        onConfirm={confirmDeleteAccount}
        title="Delete Account permanently?"
        description="Are you absolutely sure you want to delete your TriVisionX account? This action cannot be undone and you will lose all conversations and documents."
        confirmText="Delete Account"
        variant="destructive"
      />
    </Dialog>
  );
}
