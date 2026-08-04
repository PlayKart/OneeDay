// src/services/chatService.ts

import { apiClient } from "../api/client";
import { auth } from "../lib/firebase";
import { BACKEND_URL } from "../constants";
import { ChatSession, ChatMessage } from "../types";
import { safeArray } from "../utils";

export const chatService = {
  async getSessions(): Promise<ChatSession[]> {
    try {
      const res = await apiClient.get<ChatSession[] | { conversations: ChatSession[] }>("/api/conversations");
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data as any)?.conversations || (res.data as any)?.sessions || [];
      return safeArray<any>(list).map((s) => ({
        id: s.id,
        title: s.title || "New Conversation",
        isPinned: Boolean(s.isPinned || s.is_pinned),
        isArchived: Boolean(s.isArchived || s.is_archived),
        createdAt: s.createdAt || s.created_at || new Date().toISOString(),
        updatedAt: s.updatedAt || s.updated_at || new Date().toISOString(),
      }));
    } catch (e) {
      console.warn("Failed to fetch sessions from endpoint, returning default:", e);
      return [];
    }
  },

  async createSession(title?: string): Promise<ChatSession> {
    try {
      const res = await apiClient.post<ChatSession | { conversation: ChatSession }>("/api/conversations", {
        title: title || "New Coaching Session",
      });
      const s: any = (res.data as any)?.conversation || res.data;
      return {
        id: s.id || `conv_${Date.now()}`,
        title: s.title || title || "New Coaching Session",
        isPinned: Boolean(s.isPinned || s.is_pinned),
        isArchived: Boolean(s.isArchived || s.is_archived),
        createdAt: s.createdAt || s.created_at || new Date().toISOString(),
        updatedAt: s.updatedAt || s.updated_at || new Date().toISOString(),
      };
    } catch (e) {
      return {
        id: `conv_${Date.now()}`,
        title: title || "New Coaching Session",
        isPinned: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const res = await apiClient.get<ChatMessage[] | { messages: ChatMessage[] }>(
        `/api/conversations/${conversationId}/messages`
      );
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data as any)?.messages || [];
      return safeArray<any>(list).map((m) => ({
        id: m.id || `msg_${Date.now()}_${Math.random()}`,
        conversationId,
        role: m.role === "assistant" || m.role === "ai" ? "assistant" : "user",
        content: m.content || "",
        createdAt: m.createdAt || m.created_at || new Date().toISOString(),
      }));
    } catch (e) {
      console.warn(`Failed to fetch messages for conversation ${conversationId}:`, e);
      return [];
    }
  },

  async sendMessage(conversationId: string, message: string): Promise<{ reply: string; messages?: ChatMessage[] }> {
    const user = auth.currentUser;
    let token: string | null = null;
    if (user) {
      try {
        token = await user.getIdToken();
      } catch (err) {
        console.warn("Failed to retrieve Firebase ID token:", err);
      }
    }

    const localDate = new Date().toISOString().split("T")[0];
    const fullUrl = `${BACKEND_URL}/api/chat`;
    const payload = {
      message,
      conversationId,
      conversation_id: conversationId,
    };
    const headers = {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "None",
      "x-local-date": localDate,
    };

    console.log("[AI Coach / Chat Request] API URL:", fullUrl);
    console.log("[AI Coach / Chat Request] Request body:", payload);
    console.log("[AI Coach / Chat Request] Headers:", headers);
    console.log("[AI Coach / Chat Request] Firebase token:", token);
    console.log("[AI Coach / Chat Request] x-local-date:", localDate);

    let res: any;
    try {
      res = await apiClient.post("/api/chat", payload);
      console.log(`[AI Coach / Chat Response] Status: ${res.status}, Data:`, res.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        console.warn(`[AI Coach] /api/chat returned 404, attempting fallback to /api/conversations/${conversationId}/messages`);
        res = await apiClient.post(`/api/conversations/${conversationId}/messages`, payload);
        console.log(`[AI Coach / Chat Fallback Response] Status: ${res.status}, Data:`, res.data);
      } else {
        console.error(`[AI Coach / Chat Error] HTTP Status: ${err?.response?.status}, Error:`, err?.response?.data || err.message);
        throw err;
      }
    }

    const body = res.data;
    if (body && body.success === false) {
      const errMsg = body.error?.message || (typeof body.error === "string" ? body.error : "Backend returned an error");
      console.error("[AI Coach] Backend error response:", body);
      throw new Error(errMsg);
    }

    const replyText =
      body?.reply ||
      body?.response ||
      body?.message ||
      body?.content ||
      (typeof body === "string" ? body : "I am your AI Coach. Keep pushing your limits.");

    return {
      reply: replyText,
      messages: body?.messages ? safeArray(body.messages) : undefined,
    };
  },

  async renameSession(conversationId: string, title: string): Promise<void> {
    try {
      await apiClient.put(`/api/conversations/${conversationId}`, { title });
    } catch (e) {
      console.warn("Rename endpoint failed or not supported natively:", e);
    }
  },

  async pinSession(conversationId: string, isPinned: boolean): Promise<void> {
    try {
      await apiClient.put(`/api/conversations/${conversationId}/pin`, { isPinned });
    } catch (e) {
      console.warn("Pin session endpoint failed:", e);
    }
  },

  async archiveSession(conversationId: string, isArchived: boolean): Promise<void> {
    try {
      await apiClient.put(`/api/conversations/${conversationId}/archive`, { isArchived });
    } catch (e) {
      console.warn("Archive session endpoint failed:", e);
    }
  },

  async deleteSession(conversationId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/conversations/${conversationId}`);
    } catch (e) {
      console.warn("Delete session endpoint failed:", e);
    }
  },
};
