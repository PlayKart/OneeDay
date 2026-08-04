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
    const endpoint = "/api/chat/session";
    const method = "POST";
    const payload = { title: title || "New Coaching Session" };

    console.log("[AI Coach / Session Create] Endpoint:", `${BACKEND_URL}${endpoint}`);
    console.log("[AI Coach / Session Create] Method:", method);
    console.log("[AI Coach / Session Create] Request payload:", payload);

    const res = await apiClient.post(endpoint, payload);
    console.log("[AI Coach / Session Create] Response:", res.data);

    const rawData = res.data;
    const sessionData = rawData?.data || rawData?.session || rawData;
    const uuid = sessionData?.id || sessionData?.sessionId || sessionData?.uuid;

    if (!uuid) {
      throw new Error("Failed to create chat session: No database UUID returned by backend.");
    }

    console.log("[AI Coach / Session Created] Backend session UUID:", uuid);

    return {
      id: uuid,
      title: sessionData?.title || title || "New Coaching Session",
      isPinned: Boolean(sessionData?.isPinned || sessionData?.is_pinned),
      isArchived: Boolean(sessionData?.isArchived || sessionData?.is_archived),
      createdAt: sessionData?.createdAt || sessionData?.created_at || new Date().toISOString(),
      updatedAt: sessionData?.updatedAt || sessionData?.updated_at || new Date().toISOString(),
    };
  },

  async getMessages(_sessionId: string): Promise<ChatMessage[]> {
    return [];
  },

  async sendMessage(sessionId: string, message: string): Promise<{ reply: string; messages?: ChatMessage[] }> {
    let targetSessionId = sessionId;

    if (!targetSessionId) {
      console.log("[AI Coach] No session exists. Automatically creating a session before sending message...");
      const newSession = await this.createSession();
      targetSessionId = newSession.id;
    }

    const endpoint = "/api/chat";
    const method = "POST";
    const fullUrl = `${BACKEND_URL}${endpoint}`;

    const payload = {
      message,
      sessionId: targetSessionId,
    };

    console.log("Current session:", targetSessionId);
    console.log("Backend session:", targetSessionId);
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
        (typeof body === "string" ? body : "I am your AI Coach. Keep pushing your limits.");

      return {
        reply: replyText,
        messages: body?.messages ? safeArray(body.messages) : undefined,
      };
    } catch (err: any) {
      const errorData = err?.response?.data || err.message;
      console.error("[AI Coach / Chat Error] Endpoint:", fullUrl, "Method:", method, "Status:", err?.response?.status, "Error:", errorData);
      throw err;
    }
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
