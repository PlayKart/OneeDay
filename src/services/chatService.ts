// src/services/chatService.ts

import { apiClient } from "../api/client";
import { auth } from "../lib/firebase";
import { BACKEND_URL } from "../constants";
import { ChatSession, ChatMessage } from "../types";
import { safeArray } from "../utils";

export const chatService = {
  async getSessions(): Promise<ChatSession[]> {
    try {
      console.log("[chatService] Requesting GET /api/conversations");
      const res = await apiClient.get<any>("/api/conversations");
      console.log("[chatService] GET /api/conversations response:", res.data);
      const rawData = res.data;
      const list = Array.isArray(rawData)
        ? rawData
        : rawData?.data || rawData?.sessions || rawData?.conversations || [];

      const mapped = safeArray<any>(list).map((s) => ({
        id: s.id || s.sessionId || s.uuid,
        title: s.title || "New Coaching Session",
        isPinned: Boolean(s.isPinned || s.is_pinned),
        isArchived: Boolean(s.isArchived || s.is_archived),
        createdAt: s.createdAt || s.created_at || new Date().toISOString(),
        updatedAt: s.updatedAt || s.updated_at || s.createdAt || s.created_at || new Date().toISOString(),
      }));

      mapped.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      });

      return mapped;
    } catch (e) {
      console.error("Failed to fetch sessions from /api/conversations:", e);
      return [];
    }
  },

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    if (!sessionId) return [];
    try {
      console.log(`[chatService] Requesting GET /api/chats for session ${sessionId}`);
      const res = await apiClient.get(`/api/chats`, { params: { sessionId } });
      console.log(`[chatService] GET /api/chats response:`, res.data);
      const rawData = res.data;
      const list = Array.isArray(rawData)
        ? rawData
        : rawData?.data || rawData?.messages || [];
      
      const mapped = safeArray<any>(list).map((m) => ({
        id: m.id || `msg_${Date.now()}_${Math.random()}`,
        sessionId: sessionId,
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content || m.message || m.text || "",
        createdAt: m.createdAt || m.created_at || new Date().toISOString(),
      }));

      mapped.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

      return mapped;
    } catch (e) {
      console.error(`Failed to fetch messages for session ${sessionId}:`, e);
      return [];
    }
  },

  async sendMessage(sessionId: string | null | undefined, message: string): Promise<{ reply: string; title?: string; messages?: ChatMessage[]; sessionId?: string }> {
    const endpoint = "/api/chat";
    const method = "POST";
    const fullUrl = `${BACKEND_URL}${endpoint}`;

    const payload = {
      message,
      ...(sessionId ? { sessionId } : {}),
      async editMessage(editingMessageId: string, content: string): Promise<void> {
    try {
      await apiClient.put(`/api/chat/${editingMessageId}`, { content });
    } catch (e) {
      console.warn("Edit message endpoint failed:", e);
    }
  },

  async deleteMessage(msgId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/chat/${msgId}`);
    } catch (e) {
      console.warn("Delete message endpoint failed:", e);
    }
  },

  async searchChats(query: string): Promise<any> {
    try {
      const res = await apiClient.get(`/api/chat/search`, { params: { q: query } });
      return res.data;
    } catch (e) {
      console.warn("Search chats endpoint failed:", e);
      return [];
    }
  },

  async exportChats(): Promise<any> {
    try {
      const res = await apiClient.get(`/api/chat/export`);
      return res.data;
    } catch (e) {
      console.warn("Export chats endpoint failed:", e);
      return null;
    }
  },
};

    console.log("Current session:", sessionId);
    console.log("Request payload:", payload);

    try {
      const res = await apiClient.post(endpoint, payload);
      console.log("Response:", res.data);

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
        body?.data?.reply ||
        (typeof body === "string" ? body : "I am your AI Coach. Keep pushing your limits.");

      const titleText = body?.title || body?.data?.title || body?.session?.title;
      const returnedSessionId = body?.sessionId || body?.session_id || body?.session?.id;

      return {
        reply: replyText,
        title: titleText,
        messages: body?.messages ? safeArray(body.messages) : undefined,
        sessionId: returnedSessionId,
      };
    } catch (err: any) {
      const errorData = err?.response?.data || err.message;
      console.error("[AI Coach / Chat Error] Endpoint:", fullUrl, "Method:", method, "Status:", err?.response?.status, "Error:", errorData);
      throw err;
    }
  },

  async renameSession(conversationId: string, title: string): Promise<void> {
    try {
      await apiClient.put(`/api/conversation/${conversationId}`, { title });
    } catch (e) {
      console.warn("Rename endpoint failed or not supported natively:", e);
    }
  },

  async pinSession(conversationId: string, isPinned: boolean): Promise<void> {
    try {
      await apiClient.post(`/api/chat/pin`, { conversationId, isPinned });
    } catch (e) {
      console.warn("Pin session endpoint failed:", e);
    }
  },

  async archiveSession(conversationId: string, isArchived: boolean): Promise<void> {
    try {
      await apiClient.put(`/api/conversation/${conversationId}`, { isArchived });
    } catch (e) {
      console.warn("Archive session endpoint failed:", e);
    }
  },

  async deleteSession(conversationId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/conversation/${conversationId}`);
    } catch (e) {
      console.warn("Delete session endpoint failed:", e);
    }
  },

  async editMessage(editingMessageId: string, content: string): Promise<void> {
    try {
      await apiClient.put(`/api/chat/${editingMessageId}`, { content });
    } catch (e) {
      console.warn("Edit message endpoint failed:", e);
    }
  },

  async deleteMessage(msgId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/chat/${msgId}`);
    } catch (e) {
      console.warn("Delete message endpoint failed:", e);
    }
  },

  async searchChats(query: string): Promise<any> {
    try {
      const res = await apiClient.get(`/api/chat/search`, { params: { q: query } });
      return res.data;
    } catch (e) {
      console.warn("Search chats endpoint failed:", e);
      return [];
    }
  },

  async exportChats(): Promise<any> {
    try {
      const res = await apiClient.get(`/api/chat/export`);
      return res.data;
    } catch (e) {
      console.warn("Export chats endpoint failed:", e);
      return null;
    }
  },
};
