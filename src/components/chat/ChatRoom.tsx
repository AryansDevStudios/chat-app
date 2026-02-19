"use client"

import { useState, useRef, useEffect } from "react"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import { useChatSession } from "@/hooks/use-chat-session"
import { WelcomeDialog } from "./WelcomeDialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  Info, 
  Camera, 
  Mic, 
  Image as ImageIcon, 
  Heart, 
  Smile, 
  Loader2,
  Phone,
  Video
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
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

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
      </div>
    )
  }

  const roomName = roomId?.includes('_') ? roomId.split('_')[1].toUpperCase() : 'General'

  return (
    <div className="flex flex-col h-full w-full bg-black text-white relative">
      <WelcomeDialog isOpen={!displayName} onSave={updateDisplayName} />

      {/* Instagram Header */}
      <header className="flex items-center justify-between px-4 lg:px-8 h-16 lg:h-20 border-b border-white/10 shrink-0 bg-black/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 lg:hidden -ml-2">
            <ChevronLeft className="w-7 h-7" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 lg:h-11 lg:w-11 border border-white/10 ring-1 ring-white/5">
              <AvatarImage src={`https://picsum.photos/seed/${roomId}/100`} />
              <AvatarFallback>{roomName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[15px] lg:text-[16px] font-bold leading-none">{roomName}</span>
              <span className="text-[11px] lg:text-[12px] text-muted-foreground mt-0.5 font-medium">Active now</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-10 w-10 lg:h-12 lg:w-12 rounded-full">
            <Phone className="w-5 h-5 lg:w-6 lg:h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 lg:h-12 lg:w-12 rounded-full">
            <Video className="w-6 h-6 lg:w-7 lg:h-7" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 lg:h-12 lg:w-12 rounded-full">
            <Info className="w-6 h-6 lg:w-7 lg:h-7" />
          </Button>
        </div>
      </header>

      {/* Message List */}
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="flex flex-col max-w-4xl mx-auto px-4 lg:px-8 py-8 min-h-full">
          {/* Centered Profile Info at Top */}
          <div className="flex flex-col items-center py-12 lg:py-16 gap-4">
            <Avatar className="h-24 w-24 lg:h-32 lg:w-32 border-2 border-white/5 ring-1 ring-white/10 shadow-2xl transition-transform hover:scale-105 duration-300">
              <AvatarImage src={`https://picsum.photos/seed/${roomId}/200`} />
              <AvatarFallback className="text-2xl">{roomName[0]}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">{roomName}</h2>
              <p className="text-sm lg:text-base text-muted-foreground mt-1 font-medium">Instagram Group • {messages?.length || 0} messages</p>
              <Button variant="secondary" size="sm" className="mt-4 lg:mt-6 rounded-lg bg-[#262626] hover:bg-[#363636] font-bold px-6 lg:py-5 lg:text-base">
                View Profile
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1 pb-8">
            {messages?.map((msg, index) => {
              const isMe = msg.senderId === userId
              const isFirstInGroup = index === 0 || messages[index - 1].senderId !== msg.senderId
              const isLastInGroup = index === messages.length - 1 || messages[index + 1].senderId !== msg.senderId
              
              return (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex flex-col max-w-[85%] lg:max-w-[65%] animate-message", 
                    isMe ? "self-end items-end" : "self-start items-start",
                    isFirstInGroup && "mt-6"
                  )}
                >
                  {!isMe && isFirstInGroup && (
                    <span className="text-[11px] lg:text-[12px] text-muted-foreground ml-3 mb-1 font-semibold">
                      {msg.senderDisplayName}
                    </span>
                  )}
                  <div className={cn(
                    "px-4 py-2.5 lg:px-5 lg:py-3 text-[15px] lg:text-[16px] leading-[1.3] transition-all",
                    isMe ? "ig-bubble-me" : "ig-bubble-other",
                    !isLastInGroup && (isMe ? "rounded-br-[0.3rem]" : "rounded-bl-[0.3rem]"),
                    isMe && !isLastInGroup && "mb-0.5",
                    !isMe && !isLastInGroup && "mb-0.5"
                  )}>
                    {msg.content}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </ScrollArea>

      {/* Footer Input Bar */}
      <footer className="p-4 lg:p-6 bg-black sticky bottom-0 z-20">
        <form 
          onSubmit={handleSendMessage} 
          className="max-w-4xl mx-auto ig-input-pill shadow-2xl ring-1 ring-white/5"
        >
          <div className="flex items-center gap-1">
             <Button type="button" variant="ghost" size="icon" className="h-8 w-8 lg:h-10 lg:w-10 -ml-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-all active:scale-90">
              <Camera className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </Button>
          </div>
          
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-white/40 h-10 lg:h-12 text-[15px] lg:text-[16px] p-0 font-normal ml-2"
          />

          {inputText.trim() ? (
            <Button 
              type="submit" 
              variant="ghost" 
              className="text-[#0095f6] font-bold text-[15px] lg:text-[16px] p-0 px-2 lg:px-4 hover:bg-transparent hover:text-blue-400 active:scale-95 transition-all"
            >
              Send
            </Button>
          ) : (
            <div className="flex items-center gap-1 lg:gap-2 pr-1">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 lg:h-10 lg:w-10 rounded-full hover:bg-white/10">
                <Mic className="w-5 h-5 lg:w-6 lg:h-6" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 lg:h-10 lg:w-10 rounded-full hover:bg-white/10">
                <ImageIcon className="w-5 h-5 lg:w-6 lg:h-6" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 lg:h-10 lg:w-10 rounded-full hover:bg-white/10">
                <Smile className="w-5 h-5 lg:w-6 lg:h-6" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 lg:h-10 lg:w-10 rounded-full hover:bg-white/10">
                <Heart className="w-5 h-5 lg:w-6 lg:h-6" />
              </Button>
            </div>
          )}
        </form>
      </footer>
    </div>
  )
}
