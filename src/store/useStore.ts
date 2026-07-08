// src/store/useStore.ts

import { create } from 'zustand'
import { auth } from '../lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { toast } from 'react-hot-toast'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://oneday-backend-xocv.onrender.com";

async function apiRequest(path: string, method = "GET", body: any = null, isRetry = false): Promise<any> {
  const user = auth.currentUser
  if (!user) throw new Error("Auth required")

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const token = await user.getIdToken(isRetry)

    const res = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-local-date": new Date().toISOString().split("T")[0]
      },
      body: body ? JSON.stringify(body) : null,
      signal: controller.signal
    })

    if (res.status === 401 && !isRetry) {
      return apiRequest(path, method, body, true)
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "API error")
    }

    return res.json()
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error("Connection Timeout")
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

export interface ChatSession {
  id: string
  title: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

interface BackendUser {
  id: string
  name: string
  xp: number
  streak: number
  level: number
  levelProgress: number
  freeze_until: string | null
  lastActiveDate: string | null
}

export interface Habit {
  id: string
  userId: string
  name: string
  createdAt: string
  completedToday: boolean
  icon?: string
  category?: string
  difficulty?: string
  reminderTime?: string
  notes?: string
  repeatType?: "every_day" | "weekdays" | "weekends" | "custom_days"
  customDays?: string[]
}

export type TabState = "dashboard" | "habits" | "coach" | "settings"

interface State {
  firebaseUser: FirebaseUser | null
  user: BackendUser | null
  habits: Habit[]
  quote: string
  initialized: boolean
  loading: boolean
  backendError: string | null
  activeTab: TabState

  // Multi-session chat state
  chatSessions: ChatSession[]
  activeChatId: string | null
  chatMessages: ChatMessage[]
  chatLoading: boolean

  setActiveTab: (tab: TabState) => void
  refreshFromBackend: () => Promise<void>
  addHabit: (habitData: Partial<Habit>) => Promise<void>
  editHabit: (habitId: string, habitData: Partial<Habit>) => Promise<void>
  deleteHabit: (habitId: string) => Promise<void>
  completeHabit: (habitId: string) => Promise<void>
  undoHabit: (habitId: string) => Promise<void>
  freezeStreak: (days: number) => Promise<void>
  deactivateFreeze: () => Promise<void>
  sendChat: (message: string) => Promise<string>
  resetProgress: () => Promise<void>
  deleteAccount: () => Promise<void>

  // Multi-session chat actions
  fetchSessions: () => Promise<void>
  createSession: () => void
  selectSession: (id: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  renameSession: (id: string, title: string) => Promise<void>
  pinSession: (id: string) => Promise<void>
  sendChatMessage: (message: string) => Promise<void>
  regenerateMessage: (messageId: string) => Promise<void>
  editPreviousMessage: (messageId: string, newContent: string) => Promise<void>
}

export const useStore = create<State>((set, get) => ({
  firebaseUser: null,
  user: null,
  habits: [],
  quote: "Discipline is the choice between what you want now and what you want most.",
  initialized: false,
  loading: false,
  backendError: null,
  activeTab: "dashboard",

  // Multi-session chat state initial values
  chatSessions: [],
  activeChatId: null,
  chatMessages: [],
  chatLoading: false,

  setActiveTab: (tab) => set({ activeTab: tab }),

  refreshFromBackend: async () => {
    try {
      set({ loading: true, backendError: null })

      const [userData, habitsData] = await Promise.all([
        apiRequest("/api/user"),
        apiRequest("/api/habits")
      ])

      if (!userData) {
        throw new Error("Backend returned no user data. Ensure your backend handles anonymous users or check your backend logs.");
      }

      // Timezone-aware local day streak calculation & correction
      const getFormattedLocalDate = (dateInput?: Date | string | number | null) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return "";
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      let effectiveStreak = userData.streak || 0;
      if (userData.lastActiveDate) {
        const todayStr = getFormattedLocalDate(new Date());
        const lastActiveStr = getFormattedLocalDate(userData.lastActiveDate);

        if (todayStr && lastActiveStr) {
          const tDate = new Date(todayStr + "T00:00:00");
          const lDate = new Date(lastActiveStr + "T00:00:00");
          const diffTime = tDate.getTime() - lDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          const isCurrentlyFrozen = userData.freeze_until && new Date(userData.freeze_until) > new Date();

          if (diffDays > 1 && !isCurrentlyFrozen) {
            // Streak broken due to inactivity for more than 1 day without freeze
            effectiveStreak = 0;
          }
        }
      } else {
        effectiveStreak = 0;
      }

      const streak = effectiveStreak;
      const correctedUserData = {
        ...userData,
        streak: effectiveStreak
      };
      
      const currentUser = auth.currentUser;
      const enrichedHabits = (habitsData || []).map((h: any) => {
         if (currentUser && h.name) {
            const key = `habit_meta_${currentUser.uid}_${h.name}`;
            try {
               const metaStr = localStorage.getItem(key);
               if (metaStr) {
                  const meta = JSON.parse(metaStr);
                  return { ...h, ...meta };
               }
            } catch (e) {
               console.error("Failed to parse habit meta", e);
            }
         }
         return h;
      });

      const HOUR_IN_MS = 60 * 60 * 1000;
      const now = Date.now();
      let quote = "Discipline is the choice between what you want now and what you want most.";
      
      try {
        const lastQuoteTime = localStorage.getItem("lastQuoteTime");
        const cachedQuote = localStorage.getItem("cachedQuote");
        
        if (lastQuoteTime && cachedQuote && now - parseInt(lastQuoteTime) < HOUR_IN_MS) {
           quote = cachedQuote;
        } else {
           // We need a dynamic import to avoid failing if not used, or just import it at top
           const { generateQuote } = await import("../lib/geminiService");
           quote = await generateQuote(streak, habitsData || []);
           localStorage.setItem("lastQuoteTime", now.toString());
           localStorage.setItem("cachedQuote", quote);
        }
      } catch (e) {
         console.error("Quote generation failed", e);
         if (streak >= 7) quote = "You’re ahead of 99%. Don’t slow down.";
         else if (streak === 0) quote = "One day broke. Don't let two.";
      }

      set({
        user: correctedUserData,
        habits: enrichedHabits,
        quote,
        loading: false,
        initialized: true
      })
    } catch (err: any) {
      set({
        loading: false,
        initialized: true,
        backendError: err.message
      })
    }
  },

  addHabit: async (habitData) => {
    const payload = {
      name: habitData.name,
      repeatType: habitData.repeatType,
      customDays: habitData.customDays
    };
    await apiRequest("/api/habit", "POST", payload)
    
    // Save metadata to localStorage as fallback
    const user = auth.currentUser;
    if (user && habitData.name) {
       const key = `habit_meta_${user.uid}_${habitData.name}`;
       localStorage.setItem(key, JSON.stringify({
          repeatType: habitData.repeatType,
          customDays: habitData.customDays,
          icon: habitData.icon,
          category: habitData.category
       }));
    }

    await get().refreshFromBackend()
  },

  editHabit: async (habitId: string, habitData: Partial<Habit>) => {
    const payload = {
      habit_id: habitId,
      name: habitData.name,
      repeatType: habitData.repeatType,
      customDays: habitData.customDays,
      difficulty: habitData.difficulty,
      notes: habitData.notes
    };
    await apiRequest("/api/habit", "PUT", payload);
    
    const user = auth.currentUser;
    if (user && habitData.name) {
       const key = `habit_meta_${user.uid}_${habitData.name}`;
       localStorage.setItem(key, JSON.stringify({
          repeatType: habitData.repeatType,
          customDays: habitData.customDays,
          difficulty: habitData.difficulty,
          notes: habitData.notes,
          icon: habitData.icon,
          category: habitData.category
       }));
    }

    await get().refreshFromBackend();
  },

  deleteHabit: async (habitId: string) => {
    await apiRequest(`/api/habit/${habitId}`, "DELETE");
    await get().refreshFromBackend();
  },

  completeHabit: async (habitId: string) => {
    await apiRequest("/api/complete", "POST", { habit_id: habitId })
    await get().refreshFromBackend()
  },

  undoHabit: async (habitId: string) => {
    await apiRequest("/api/undo", "POST", { habit_id: habitId })
    await get().refreshFromBackend()
  },

  freezeStreak: async (days: number) => {
    await apiRequest("/api/freeze", "POST", { days })
    await get().refreshFromBackend()
  },

  deactivateFreeze: async () => {
    try {
      await apiRequest("/api/freeze", "POST", { days: 0 })
    } catch (e) {
      console.error("deactivateFreeze API call failed, falling back to local reset", e);
    }
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          freeze_until: null
        }
      });
    }
    await get().refreshFromBackend()
  },

  sendChat: async (message: string) => {
    const { user, habits } = get();
    
    const contextData = {
      name: user?.name || "Achiever",
      level: user?.level || 1,
      streak: user?.streak || 0,
      habits: (habits || []).map(h => ({
        name: h.name,
        completedToday: !!h.completedToday,
        completed: !!h.completedToday
      }))
    };

    const data = await apiRequest("/api/chat", "POST", {
      message,
      ...contextData,
      context: contextData // Nested as well to guarantee compatibility with any parser structure
    });
    return data.reply;
  },

  resetProgress: async () => {
    try {
      await apiRequest("/api/reset", "POST")
      await get().refreshFromBackend()
      toast.success("Progress reset successfully")
    } catch {
       toast.error("Endpoint /api/reset is missing from your backend.");
    }
  },

  deleteAccount: async () => {
    try {
      await apiRequest("/api/account", "DELETE")
    } catch {
       toast.error("Endpoint /api/account is missing from your backend.");
    }
    const fbUser = auth.currentUser
    if (fbUser) await fbUser.delete()
    set({ user: null, firebaseUser: null, habits: [] })
  },

  // Multi-session chat actions implementation
  fetchSessions: async () => {
    try {
      set({ chatLoading: true })
      const data = await apiRequest("/api/conversations")
      set({ chatSessions: data || [] })
      
      const currentActiveId = get().activeChatId
      const sessions = data || []
      
      if (!currentActiveId && sessions.length > 0) {
        const sorted = [...sessions].sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        })
        await get().selectSession(sorted[0].id)
      }
    } catch (err: any) {
      console.error("fetchSessions error:", err)
    } finally {
      set({ chatLoading: false })
    }
  },

  createSession: () => {
    const sessions = get().chatSessions
    const existingTemp = sessions.find(s => s.id === 'temp_new')
    if (existingTemp) {
      set({ activeChatId: 'temp_new', chatMessages: [] })
      return
    }

    const tempSession: ChatSession = {
      id: 'temp_new',
      title: 'New Chat',
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    set({
      chatSessions: [tempSession, ...sessions],
      activeChatId: 'temp_new',
      chatMessages: []
    })
  },

  selectSession: async (id: string) => {
    set({ activeChatId: id })
    if (id === 'temp_new') {
      set({ chatMessages: [] })
      return
    }

    try {
      set({ chatLoading: true })
      const messages = await apiRequest(`/api/chats?conversationId=${id}`)
      set({ chatMessages: messages || [] })
    } catch (err: any) {
      console.error("selectSession error:", err)
      toast.error("Failed to load messages")
    } finally {
      set({ chatLoading: false })
    }
  },

  deleteSession: async (id: string) => {
    const isDeletingActive = get().activeChatId === id
    const isTemp = id === 'temp_new'

    if (isTemp) {
      const updatedSessions = get().chatSessions.filter(s => s.id !== 'temp_new')
      set({
        chatSessions: updatedSessions,
        activeChatId: updatedSessions.length > 0 ? updatedSessions[0].id : null
      })
      if (get().activeChatId) {
        await get().selectSession(get().activeChatId!)
      } else {
        set({ chatMessages: [] })
      }
      return
    }

    try {
      set({ chatLoading: true })
      await apiRequest(`/api/conversation/${id}`, "DELETE")
      toast.success("Conversation deleted")
      
      const updatedSessions = get().chatSessions.filter(s => s.id !== id)
      set({ chatSessions: updatedSessions })

      if (isDeletingActive) {
        if (updatedSessions.length > 0) {
          const nextActiveId = updatedSessions[0].id
          set({ activeChatId: nextActiveId })
          await get().selectSession(nextActiveId)
        } else {
          set({ activeChatId: null, chatMessages: [] })
        }
      }
    } catch (err: any) {
      console.error("deleteSession error:", err)
      toast.error("Failed to delete conversation")
    } finally {
      set({ chatLoading: false })
    }
  },

  renameSession: async (id: string, title: string) => {
    if (!title.trim()) return

    if (id === 'temp_new') {
      set({
        chatSessions: get().chatSessions.map(s => s.id === 'temp_new' ? { ...s, title } : s)
      })
      return
    }

    try {
      const session = get().chatSessions.find(s => s.id === id)
      const isPinnedValue = session ? session.is_pinned : false

      await apiRequest(`/api/conversation/${id}`, "PUT", {
        title,
        is_pinned: isPinnedValue,
        isPinned: isPinnedValue,
        pinned: isPinnedValue
      })

      set({
        chatSessions: get().chatSessions.map(s => s.id === id ? { ...s, title } : s)
      })
    } catch (err: any) {
      console.error("renameSession error:", err)
      toast.error("Failed to rename conversation")
    }
  },

  pinSession: async (id: string) => {
    if (id === 'temp_new') {
      set({
        chatSessions: get().chatSessions.map(s => s.id === 'temp_new' ? { ...s, is_pinned: !s.is_pinned } : s)
      })
      return
    }

    const session = get().chatSessions.find(s => s.id === id)
    if (!session) return

    const newPinState = !session.is_pinned

    set({
      chatSessions: get().chatSessions.map(s => s.id === id ? { ...s, is_pinned: newPinState } : s)
    })

    try {
      await apiRequest(`/api/conversation/${id}`, "PUT", {
        title: session.title,
        is_pinned: newPinState,
        isPinned: newPinState,
        pinned: newPinState
      })
    } catch (err: any) {
      console.error("pinSession error:", err)
      set({
        chatSessions: get().chatSessions.map(s => s.id === id ? { ...s, is_pinned: session.is_pinned } : s)
      })
      toast.error("Failed to pin conversation")
    }
  },

  sendChatMessage: async (message: string) => {
    if (!message.trim()) return

    const { user, habits, activeChatId } = get()
    
    const tempUserMsgId = `temp_msg_${Date.now()}`
    const userMsg: ChatMessage = {
      id: tempUserMsgId,
      role: "user",
      content: message,
      created_at: new Date().toISOString()
    }

    set({
      chatMessages: [...get().chatMessages, userMsg],
      chatLoading: true
    })

    const contextData = {
      name: user?.name || "Achiever",
      level: user?.level || 1,
      streak: user?.streak || 0,
      habits: (habits || []).map(h => ({
        name: h.name,
        completedToday: !!h.completedToday,
        completed: !!h.completedToday
      }))
    }

    try {
      const isNewChat = activeChatId === 'temp_new' || !activeChatId

      const requestBody: any = {
        message,
        ...contextData,
        context: contextData
      }

      if (!isNewChat) {
        requestBody.conversationId = activeChatId
      }

      const data = await apiRequest("/api/chat", "POST", requestBody)

      if (data.status === "success") {
        const returnedConvId = data.conversationId
        const replyText = data.reply

        const assistantMsg: ChatMessage = {
          id: `bot_msg_${Date.now()}`,
          role: "assistant",
          content: replyText,
          created_at: new Date().toISOString()
        }

        if (isNewChat) {
          const updatedSessions = get().chatSessions.map(s => 
            s.id === 'temp_new' ? { ...s, id: returnedConvId, title: message.slice(0, 30) + (message.length > 30 ? "..." : "") } : s
          )
          
          set({
            chatSessions: updatedSessions,
            activeChatId: returnedConvId,
            chatMessages: [...get().chatMessages.filter(m => m.id !== tempUserMsgId), { ...userMsg, id: `user_msg_${Date.now()}` }, assistantMsg]
          })
          
          await get().fetchSessions()
        } else {
          set({
            chatMessages: [...get().chatMessages.filter(m => m.id !== tempUserMsgId), { ...userMsg, id: `user_msg_${Date.now()}` }, assistantMsg]
          })
          await get().fetchSessions()
        }
      } else {
        throw new Error(data.error || "Failed to get coach reply")
      }
    } catch (err: any) {
      console.error("sendChatMessage error:", err)
      toast.error(err.message || "Connection failed")
      set({
        chatMessages: get().chatMessages.filter(m => m.id !== tempUserMsgId)
      })
    } finally {
      set({ chatLoading: false })
    }
  },

  regenerateMessage: async (messageId: string) => {
    const { chatMessages, activeChatId } = get()
    if (!activeChatId || activeChatId === 'temp_new') return

    const index = chatMessages.findIndex(m => m.id === messageId)
    if (index === -1) return

    let lastUserMessage: ChatMessage | null = null
    for (let i = index - 1; i >= 0; i--) {
      if (chatMessages[i].role === "user") {
        lastUserMessage = chatMessages[i]
        break
      }
    }

    if (!lastUserMessage) {
      toast.error("No previous user message found to regenerate")
      return
    }

    const truncateIndex = chatMessages.indexOf(lastUserMessage)
    const truncatedHistory = chatMessages.slice(0, truncateIndex + 1)

    set({
      chatMessages: truncatedHistory,
      chatLoading: true
    })

    const { user, habits } = get()
    const contextData = {
      name: user?.name || "Achiever",
      level: user?.level || 1,
      streak: user?.streak || 0,
      habits: (habits || []).map(h => ({
        name: h.name,
        completedToday: !!h.completedToday,
        completed: !!h.completedToday
      }))
    }

    try {
      const data = await apiRequest("/api/chat", "POST", {
        message: lastUserMessage.content,
        conversationId: activeChatId,
        ...contextData,
        context: contextData
      })

      if (data.status === "success") {
        const assistantMsg: ChatMessage = {
          id: `bot_msg_${Date.now()}`,
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString()
        }
        set({
          chatMessages: [...truncatedHistory, assistantMsg]
        })
        await get().fetchSessions()
      } else {
        throw new Error(data.error || "Failed to regenerate reply")
      }
    } catch (err: any) {
      console.error("regenerateMessage error:", err)
      toast.error(err.message || "Failed to regenerate reply")
      set({ chatMessages })
    } finally {
      set({ chatLoading: false })
    }
  },

  editPreviousMessage: async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return

    const { chatMessages, activeChatId } = get()
    if (!activeChatId || activeChatId === 'temp_new') return

    const index = chatMessages.findIndex(m => m.id === messageId)
    if (index === -1) return

    const originalMessages = [...chatMessages]
    const truncatedHistory = chatMessages.slice(0, index)
    const editedUserMsg: ChatMessage = {
      ...chatMessages[index],
      content: newContent,
      created_at: new Date().toISOString()
    }

    set({
      chatMessages: [...truncatedHistory, editedUserMsg],
      chatLoading: true
    })

    const { user, habits } = get()
    const contextData = {
      name: user?.name || "Achiever",
      level: user?.level || 1,
      streak: user?.streak || 0,
      habits: (habits || []).map(h => ({
        name: h.name,
        completedToday: !!h.completedToday,
        completed: !!h.completedToday
      }))
    }

    try {
      const data = await apiRequest("/api/chat", "POST", {
        message: newContent,
        conversationId: activeChatId,
        ...contextData,
        context: contextData
      })

      if (data.status === "success") {
        const assistantMsg: ChatMessage = {
          id: `bot_msg_${Date.now()}`,
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString()
        }
        set({
          chatMessages: [...truncatedHistory, editedUserMsg, assistantMsg]
        })
        await get().fetchSessions()
      } else {
        throw new Error(data.error || "Failed to get reply")
      }
    } catch (err: any) {
      console.error("editPreviousMessage error:", err)
      toast.error(err.message || "Failed to send edited message")
      set({ chatMessages: originalMessages })
    } finally {
      set({ chatLoading: false })
    }
  }
}))

onAuthStateChanged(auth, async (fbUser) => {
  if (fbUser) {
    useStore.setState({
      firebaseUser: fbUser,
      initialized: true
    })

    await useStore.getState().refreshFromBackend()
    // Fetch all sessions on login
    await useStore.getState().fetchSessions()
  } else {
    useStore.setState({
      firebaseUser: null,
      user: null,
      habits: [],
      chatSessions: [],
      activeChatId: null,
      chatMessages: [],
      initialized: true,
      loading: false,
      backendError: null
    })
  }
})
