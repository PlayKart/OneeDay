// src/services/chatService.ts

import { apiClient } from "../api/client";
import { auth } from "../lib/firebase";
import { BACKEND_URL } from "../constants";
import { ChatSession, ChatMessage } from "../types";
import { safeArray } from "../utils";

export const chatService = {
  async getSessions(): Promise<ChatSession[]> {
    try {
      console.log("[chatService] Requesting GET /api/chat/sessions");
      const res = await apiClient.get<any>("/api/chat/sessions");
      console.log("[chatService] GET /api/chat/sessions response:", res.data);
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

      // Sort sessions by updated_at / updatedAt DESC
      mapped.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      });

      return mapped;
    } catch (e) {
      console.warn("Failed to fetch sessions from /api/chat/sessions, attempting fallback /api/conversations:", e);
      try {
        const res = await apiClient.get<any>("/api/conversations");
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data?.conversations || res.data?.sessions || [];
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
      } catch (err) {
        console.error("Failed to fetch sessions from fallback endpoint:", err);
        return [];
      }
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

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    if (!sessionId) return [];
    try {
      console.log(`[chatService] Requesting GET /api/chat/messages/${sessionId}`);
      const res = await apiClient.get(`/api/chat/messages/${sessionId}`);
      console.log(`[chatService] GET /api/chat/messages/${sessionId} response:`, res.data);
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
