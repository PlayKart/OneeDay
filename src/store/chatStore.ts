// src/store/chatStore.ts

import { create } from "zustand";
import { ChatSession, ChatMessage } from "../types";
import { chatService } from "../services/chatService";
import { safeArray } from "../utils";

interface ChatState {
  chatSessions: ChatSession[];
  activeChatId: string | null;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  sessionsLoading: boolean;
  searchQuery: string;

  setSearchQuery: (query: string) => void;
  fetchSessions: () => Promise<void>;
  createSession: (title?: string) => Promise<string>;
  selectSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
  pinSession: (id: string) => Promise<void>;
  archiveSession: (id: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  regenerateMessage: (messageId?: string) => Promise<void>;
  editPreviousMessage: (messageId: string, newContent: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chatSessions: [],
  activeChatId: null,
  chatMessages: [],
  chatLoading: false,
  sessionsLoading: false,
  searchQuery: "",

  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchSessions: async () => {
    set({ sessionsLoading: true });
    try {
      console.log("[chatStore] Fetching chat sessions from backend...");
      const sessions = await chatService.getSessions();
      const safeArr = safeArray(sessions) as ChatSession[];
      const sorted = [...safeArr].sort((a: any, b: any) => {
        const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });

      set({ chatSessions: sorted });

      if (sorted.length > 0) {
        const savedActiveId = localStorage.getItem("activeChatId") || get().activeChatId;
        const targetSession = sorted.find((s) => s.id === savedActiveId) || sorted[0];
        if (targetSession) {
          console.log(`[chatStore] Restoring/selecting session ${targetSession.id}`);
          await get().selectSession(targetSession.id);
        }
      } else {
        console.log("[chatStore] No sessions found, auto-creating first session silently.");
        await get().createSession("New Chat");
      }
    } catch (e) {
      console.warn("[chatStore] fetchSessions failed:", e);
    } finally {
      set({ sessionsLoading: false });
    }
  },

  createSession: async () => {
    set({ activeChatId: null, chatMessages: [] });
    localStorage.removeItem("activeChatId");
    return "";
  },

  selectSession: async (id: string) => {
    if (!id) return;
    localStorage.setItem("activeChatId", id);
    set({ activeChatId: id, chatLoading: true });
    try {
      const msgs = await chatService.getMessages(id);
      console.log(`[chatStore] Loaded ${msgs.length} messages for session ${id}:`, msgs);
      set({ chatMessages: safeArray(msgs), chatLoading: false });
    } catch (e) {
      console.error(`[chatStore] selectSession failed for ${id}:`, e);
      set({ chatLoading: false });
    }
  },

  deleteSession: async (id: string) => {
    const currentActiveId = get().activeChatId;
    set((state) => {
      const remaining = state.chatSessions.filter((s) => s.id !== id);
      const nextActive = currentActiveId === id ? (remaining[0]?.id || null) : currentActiveId;
      if (nextActive) {
        localStorage.setItem("activeChatId", nextActive);
      } else {
        localStorage.removeItem("activeChatId");
      }
      return {
        chatSessions: remaining,
        activeChatId: nextActive,
        chatMessages: currentActiveId === id ? [] : state.chatMessages,
      };
    });

    if (currentActiveId === id) {
      const remaining = get().chatSessions;
      if (remaining.length > 0) {
        await get().selectSession(remaining[0].id);
      } else {
        await get().createSession("New Chat");
      }
    }

    try {
      await chatService.deleteSession(id);
    } catch (e) {
      console.warn("Failed to delete session on backend:", e);
    }
  },

  renameSession: async (id: string, title: string) => {
    set((state) => ({
      chatSessions: state.chatSessions.map((s) => (s.id === id ? { ...s, title } : s)),
    }));

    try {
      await chatService.renameSession(id, title);
    } catch (e) {
      console.warn("Failed to rename session on backend:", e);
    }
  },

  pinSession: async (id: string) => {
    const session = get().chatSessions.find((s) => s.id === id);
    if (!session) return;
    const newPinned = !session.isPinned;

    set((state) => ({
      chatSessions: state.chatSessions.map((s) => (s.id === id ? { ...s, isPinned: newPinned } : s)),
    }));

    try {
      await chatService.pinSession(id, newPinned);
    } catch (e) {
      console.warn("Failed to pin session on backend:", e);
    }
  },

  archiveSession: async (id: string) => {
    const session = get().chatSessions.find((s) => s.id === id);
    if (!session) return;
    const newArchived = !session.isArchived;

    set((state) => ({
      chatSessions: state.chatSessions.map((s) => (s.id === id ? { ...s, isArchived: newArchived } : s)),
    }));

    try {
      await chatService.archiveSession(id, newArchived);
    } catch (e) {
      console.warn("Failed to archive session on backend:", e);
    }
  },

  sendChatMessage: async (messageText: string) => {
    let activeId = get().activeChatId;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sessionId: activeId || "",
      role: "user",
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    const tempAssistantMsgId = `assistant_${Date.now()}`;
    const placeholderAssistantMsg: ChatMessage = {
      id: tempAssistantMsgId,
      sessionId: activeId || "",
      role: "assistant",
      content: "...",
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg, placeholderAssistantMsg],
      chatLoading: true,
    }));

    try {
      const res = await chatService.sendMessage(activeId || null, messageText);
      const reply = res.reply || "Build discipline daily. Never miss twice.";
      const returnedSessionId = res.sessionId;

      if (returnedSessionId && returnedSessionId !== activeId) {
        activeId = returnedSessionId;
        set({ activeChatId: returnedSessionId });
        localStorage.setItem("activeChatId", returnedSessionId);
        await get().fetchSessions();
      }

      // Update assistant message with reply
      set((state) => ({
        chatMessages: state.chatMessages.map((m) =>
          m.id === tempAssistantMsgId ? { ...m, sessionId: activeId || "", content: reply, isStreaming: false } : m
        ),
        chatLoading: false,
      }));

      // Title Auto Update logic (Max 3 words, ChatGPT style)
      if (activeId) {
        const currentSession = get().chatSessions.find((s) => s.id === activeId);
        let targetTitle = res.title;

        if (!targetTitle || targetTitle === "New Chat" || targetTitle === "New Conversation" || targetTitle === "New Coaching Session") {
          const cleanText = messageText.trim().replace(/[^\w\s]/gi, '');
          const words = cleanText.split(/\s+/).filter(Boolean);
          if (words.length > 0) {
            const threeWords = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
            targetTitle = threeWords.length <= 28 ? threeWords : "New Chat";
          } else {
            targetTitle = "New Chat";
          }
        }

        if (targetTitle && currentSession?.title !== targetTitle) {
          get().renameSession(activeId, targetTitle);
        }
      }
    } catch (e: any) {
      console.error("[AI Coach] sendChatMessage failed:", e);

      let errorMessage = "An unknown error occurred";
      if (e?.response?.data) {
        const data = e.response.data;
        if (typeof data.error === "object" && data.error?.message) {
          errorMessage = data.error.message;
        } else if (typeof data.error === "string") {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.details) {
          errorMessage = typeof data.details === "string" ? data.details : JSON.stringify(data.details);
        } else {
          errorMessage = typeof data === "string" ? data : JSON.stringify(data);
        }
      } else if (e?.message) {
        errorMessage = e.message;
      }

      set((state) => ({
        chatMessages: state.chatMessages.map((m) =>
          m.id === tempAssistantMsgId
            ? { ...m, content: `⚠️ ${errorMessage}`, isStreaming: false }
            : m
        ),
        chatLoading: false,
      }));
    }
  },

  regenerateMessage: async (messageId?: string) => {
    const messages = get().chatMessages;
    if (messages.length === 0) return;

    const targetIdx = messageId
      ? messages.findIndex((m) => m.id === messageId)
      : messages.map((m, idx) => ({ m, idx })).filter(({ m }) => m.role === "assistant").pop()?.idx ?? -1;

    if (targetIdx === -1) return;
    const targetMsg = messages[targetIdx];
    if (targetMsg.isRegenerating) return;

    let userPrompt = "";
    for (let i = targetIdx - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userPrompt = messages[i].content;
        break;
      }
    }
    if (!userPrompt) {
      const userMsgs = messages.filter((m) => m.role === "user");
      if (userMsgs.length > 0) {
        userPrompt = userMsgs[userMsgs.length - 1].content;
      }
    }

    if (!userPrompt) return;

    const originalContent = targetMsg.content;
    const activeId = targetMsg.sessionId || get().activeChatId;

    set((state) => ({
      chatMessages: state.chatMessages.map((m) =>
        m.id === targetMsg.id ? { ...m, isRegenerating: true, error: null } : m
      ),
    }));

    try {
      const res = await chatService.sendMessage(activeId || null, userPrompt);
      const reply = res.reply || "Build discipline daily. Never miss twice.";

      set((state) => ({
        chatMessages: state.chatMessages.map((m) =>
          m.id === targetMsg.id
            ? {
                ...m,
                content: reply,
                isRegenerating: false,
                error: null,
              }
            : m
        ),
      }));
    } catch (err: any) {
      console.error("[chatStore] Message regeneration failed:", err);
      set((state) => ({
        chatMessages: state.chatMessages.map((m) =>
          m.id === targetMsg.id
            ? {
                ...m,
                content: originalContent,
                isRegenerating: false,
                error: "Couldn't regenerate. Try again.",
              }
            : m
        ),
      }));
    }
  },

  editPreviousMessage: async (messageId: string, newContent: string) => {
    set((state) => {
      const idx = state.chatMessages.findIndex((m) => m.id === messageId);
      if (idx === -1) return state;
      const updated = state.chatMessages.slice(0, idx);
      return { chatMessages: updated };
    });

    await get().sendChatMessage(newContent);
  },
}));
