"use client"

import { useState, useRef, useEffect } from "react"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import { useChatSession } from "@/hooks/use-chat-session"
import { WelcomeDialog } from "./WelcomeDialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Hash, Users, Share2, Loader2, MessageSquare, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"

interface Message {
  id: string
  content: string
  senderId: string
  senderDisplayName: string
  timestamp: any
  roomId: string
}

export function ChatRoom() {
  const db = useFirestore()
  const { userId, displayName, roomId, isLoaded, updateDisplayName } = useChatSession()
  const [inputText, setInputText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !roomId) return null
    return query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("timestamp", "asc")
    )
  }, [db, roomId])

  const { data: messages, isLoading: isMessagesLoading } = useCollection<Message>(messagesQuery)

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !userId || !displayName || !roomId || !db) return

    const messageData = {
      content: inputText.trim(),
      senderId: userId,
      senderDisplayName: displayName,
      timestamp: serverTimestamp(),
      roomId: roomId
    }

    const messagesRef = collection(db, "rooms", roomId, "messages")
    addDocumentNonBlocking(messagesRef, messageData)
    setInputText("")
  }

  const copyRoomLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: "Invite copied",
      description: "Send this link to your friends to chat."
    })
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-background">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground tracking-widest uppercase animate-pulse">Initializing</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-5xl mx-auto relative overflow-hidden px-4">
      <WelcomeDialog isOpen={!displayName} onSave={updateDisplayName} />

      {/* Header */}
      <header className="flex items-center justify-between px-2 py-6 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3 transition-transform hover:rotate-0">
            <Hash className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
              {roomId?.includes('_') ? roomId.split('_')[1].toUpperCase() : 'GENERAL'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3 h-3" /> 
                {displayName}
              </p>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={copyRoomLink} 
          className="rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all active:scale-95"
        >
          <Share2 className="w-4 h-4 text-foreground/80" />
        </Button>
      </header>

      {/* Message List */}
      <ScrollArea ref={scrollRef} className="flex-1 mb-32 rounded-[2rem] bg-white/[0.02] border border-white/5">
        <div className="flex flex-col gap-8 p-6">
          {isMessagesLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-20">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-bold tracking-widest uppercase">Fetching history</span>
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
              <div className="relative">
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent border border-white/10 animate-float">
                  <MessageSquare className="w-12 h-12 text-primary/50" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">New Beginnings</h3>
                <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
                  Start a conversation and make some noise. Everyone starts somewhere.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === userId
              const showName = index === 0 || messages[index - 1].senderId !== msg.senderId
              
              return (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex flex-col gap-1.5 transition-all duration-500", 
                    isMe ? "self-end items-end" : "self-start items-start",
                    !showName && "mt-[-1.5rem]"
                  )}
                >
                  {showName && (
                    <span className="text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase ml-1 mb-1">
                      {isMe ? "You" : msg.senderDisplayName}
                    </span>
                  )}
                  <div className={cn(
                    "px-5 py-3 text-sm md:text-[15px] leading-relaxed max-w-[85%] md:max-w-[70%]",
                    isMe ? "chat-bubble-user" : "chat-bubble-other"
                  )}>
                    {msg.content}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Floating Input Bar */}
      <div className="floating-input-bar">
        <form onSubmit={handleSendMessage} className="flex gap-2 p-1">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write something..."
            className="flex-1 bg-transparent border-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/40 h-12 px-4 text-base"
          />
          <Button 
            type="submit" 
            disabled={!inputText.trim() || !displayName}
            size="icon"
            className="rounded-[1.5rem] w-12 h-12 bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-primary/30 group"
          >
            <Send className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </form>
      </div>
    </div>
  )
}