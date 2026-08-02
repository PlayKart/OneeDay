// src/hooks/useChat.ts

import { useChatStore } from "../store/chatStore";

export function useChat() {
  const {
    chatSessions,
    activeChatId,
    chatMessages,
    chatLoading,
    searchQuery,
    setSearchQuery,
    fetchSessions,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
    pinSession,
    archiveSession,
    sendChatMessage,
    regenerateMessage,
    editPreviousMessage,
  } = useChatStore();

  const filteredSessions = chatSessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    chatSessions: filteredSessions,
    activeChatId,
    chatMessages,
    chatLoading,
    searchQuery,
    setSearchQuery,
    fetchSessions,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
    pinSession,
    archiveSession,
    sendChatMessage,
    regenerateMessage,
    editPreviousMessage,
  };
}
