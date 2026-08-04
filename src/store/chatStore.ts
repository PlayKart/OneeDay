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
  searchQuery: "",

  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchSessions: async () => {
    try {
      const sessions = await chatService.getSessions();
      set({ chatSessions: safeArray(sessions) });

      // Auto select first session if none active
      if (sessions.length > 0 && !get().activeChatId) {
        get().selectSession(sessions[0].id);
      }
    } catch (e) {
      console.warn("Failed to fetch chat sessions:", e);
    }
  },

  createSession: async (title) => {
    try {
      const newSession = await chatService.createSession(title);
      set((state) => ({
        chatSessions: [newSession, ...state.chatSessions],
        activeChatId: newSession.id,
        chatMessages: [],
      }));
      return newSession.id;
    } catch (e) {
      const fallbackId = `conv_${Date.now()}`;
      const fallbackSession: ChatSession = {
        id: fallbackId,
        title: title || "New Coaching Session",
        isPinned: false,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        chatSessions: [fallbackSession, ...state.chatSessions],
        activeChatId: fallbackId,
        chatMessages: [],
      }));
      return fallbackId;
    }
  },

  selectSession: async (id: string) => {
    set({ activeChatId: id, chatLoading: true });
    try {
      const msgs = await chatService.getMessages(id);
      set({ chatMessages: safeArray(msgs), chatLoading: false });
    } catch (e) {
      set({ chatMessages: [], chatLoading: false });
    }
  },

  deleteSession: async (id: string) => {
    set((state) => {
      const remaining = state.chatSessions.filter((s) => s.id !== id);
      const nextActive = state.activeChatId === id ? (remaining[0]?.id || null) : state.activeChatId;
      return {
        chatSessions: remaining,
        activeChatId: nextActive,
        chatMessages: state.activeChatId === id ? [] : state.chatMessages,
      };
    });

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
    if (!activeId) {
      activeId = await get().createSession();
    }

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      conversationId: activeId,
      role: "user",
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    const tempAssistantMsgId = `assistant_${Date.now()}`;
    const placeholderAssistantMsg: ChatMessage = {
      id: tempAssistantMsgId,
      conversationId: activeId,
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
      const res = await chatService.sendMessage(activeId, messageText);
      const reply = res.reply || "Build discipline daily. Never miss twice.";

      // Update assistant message with reply
      set((state) => ({
        chatMessages: state.chatMessages.map((m) =>
          m.id === tempAssistantMsgId ? { ...m, content: reply, isStreaming: false } : m
        ),
        chatLoading: false,
      }));

      // Update session title if first message
      const currentSession = get().chatSessions.find((s) => s.id === activeId);
      if (currentSession && (currentSession.title === "New Conversation" || currentSession.title === "New Coaching Session")) {
        const truncatedTitle = messageText.length > 25 ? messageText.substring(0, 25) + "..." : messageText;
        get().renameSession(activeId, truncatedTitle);
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

    let lastUserMsg = "";
    if (messageId) {
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx > 0 && messages[idx - 1].role === "user") {
        lastUserMsg = messages[idx - 1].content;
      }
    }
    if (!lastUserMsg) {
      const userMsgs = messages.filter((m) => m.role === "user");
      if (userMsgs.length > 0) {
        lastUserMsg = userMsgs[userMsgs.length - 1].content;
      }
    }

    if (lastUserMsg) {
      await get().sendChatMessage(lastUserMsg);
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
