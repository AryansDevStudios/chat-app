"use client"

import { useState, useEffect, useRef } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore"
import { useChatSession } from "@/hooks/use-chat-session"
import { WelcomeDialog } from "./WelcomeDialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Hash, Users, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface Message {
  id: string
  text: string
  senderId: string
  senderName: string
  timestamp: any
  roomId: string
}

export function ChatRoom() {
  const { userId, displayName, roomId, isLoaded, updateDisplayName } = useChatSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoaded || !roomId) return

    const q = query(
      collection(db, "messages"),
      where("roomId", "==", roomId),
      orderBy("timestamp", "asc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[]
      setMessages(msgs)
      
      // Scroll to bottom on new message
      setTimeout(() => {
        if (scrollRef.current) {
          const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight
          }
        }
      }, 100)
    })

    return () => unsubscribe()
  }, [isLoaded, roomId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !userId || !displayName || !roomId || isSending) return

    setIsSending(true)
    try {
      await addDoc(collection(db, "messages"), {
        text: inputText.trim(),
        senderId: userId,
        senderName: displayName,
        timestamp: serverTimestamp(),
        roomId: roomId
      })
      setInputText("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Failed to send",
        description: "Please check your connection and try again.",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const copyRoomLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied",
      description: "Share this link with others to invite them to the room."
    })
  }

  if (!isLoaded) return null

  return (
    <div className="flex flex-col h-screen w-full max-w-4xl mx-auto relative overflow-hidden">
      <WelcomeDialog isOpen={!displayName} onSave={updateDisplayName} />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Hash className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="font-headline font-semibold text-lg leading-tight">Room: {roomId?.split('_')[1] || roomId}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> 
              {displayName} (You)
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={copyRoomLink} className="rounded-full hover:bg-white/5">
          <Share2 className="w-5 h-5 text-muted-foreground" />
        </Button>
      </header>

      {/* Message List */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4 py-6 mb-24">
        <div className="flex flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
              <div className="p-4 rounded-full bg-white/5">
                <Send className="w-8 h-8" />
              </div>
              <p className="max-w-xs">No messages yet. Send a message to start the conversation.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === userId
              return (
                <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "self-end items-end" : "self-start items-start")}>
                  <span className="text-[10px] text-muted-foreground mb-1 ml-1 font-medium tracking-wider uppercase">
                    {isMe ? "You" : msg.senderName}
                  </span>
                  <div className={cn("px-4 py-2 text-sm md:text-base leading-relaxed break-words", isMe ? "chat-bubble-user" : "chat-bubble-other")}>
                    {msg.text}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Floating Input Bar */}
      <div className="floating-input-bar">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground h-12"
          />
          <Button 
            type="submit" 
            disabled={!inputText.trim() || isSending}
            size="icon"
            className="rounded-xl w-12 h-12 bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/30"
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
        </form>
      </div>
    </div>
  )
}