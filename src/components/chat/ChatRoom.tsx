
"use client"

import { useState, useRef, useEffect } from "react"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useChatSession } from "@/hooks/use-chat-session"
import { WelcomeDialog } from "./WelcomeDialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  Camera, 
  Loader2,
  X,
  Share,
  Home,
  Reply,
  Pencil,
  Trash2,
  CornerDownRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from "@/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Message {
  id: string
  content: string
  imageUrl?: string
  senderId: string
  senderDisplayName: string
  timestamp: any
  roomId: string
  replyToId?: string
  replyToContent?: string
  replyToSenderDisplayName?: string
}

export function ChatRoom() {
  const db = useFirestore()
  const { toast } = useToast()
  const { userId, displayName, roomId, isLoaded, updateDisplayName, goHome } = useChatSession()
  
  const [inputText, setInputText] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image under 1MB.",
        })
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!inputText.trim() && !selectedImage) || !userId || !displayName || !roomId || !db) return

    if (editingMessage) {
      const docRef = doc(db, "rooms", roomId, "messages", editingMessage.id)
      updateDocumentNonBlocking(docRef, {
        content: inputText.trim(),
        edited: true
      })
      setEditingMessage(null)
    } else {
      const messageData: any = {
        content: inputText.trim(),
        imageUrl: selectedImage || null,
        senderId: userId,
        senderDisplayName: displayName,
        timestamp: serverTimestamp(),
        roomId: roomId
      }

      if (replyTo) {
        messageData.replyToId = replyTo.id
        messageData.replyToContent = replyTo.content || "Image"
        messageData.replyToSenderDisplayName = replyTo.senderDisplayName
      }

      const messagesRef = collection(db, "rooms", roomId, "messages")
      addDocumentNonBlocking(messagesRef, messageData)
    }

    setInputText("")
    setSelectedImage(null)
    setReplyTo(null)
  }

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CharcoalChat', text: 'Join me in this chat room!', url });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    await navigator.clipboard.writeText(url);
    toast({ title: "Link Copied", description: "Chat room link copied to clipboard!" });
  }

  const handleEdit = (msg: Message) => {
    setEditingMessage(msg)
    setInputText(msg.content)
    setReplyTo(null)
  }

  const handleDelete = (msgId: string) => {
    if (!db || !roomId) return
    const docRef = doc(db, "rooms", roomId, "messages", msgId)
    deleteDocumentNonBlocking(docRef)
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
    <div className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden">
      <WelcomeDialog isOpen={!displayName} onSave={updateDisplayName} />

      <header className="flex items-center justify-center px-4 h-16 border-b border-white/10 shrink-0 bg-black/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between w-full max-w-3xl">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/5" onClick={goHome}>
              <Home className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-white/10">
                <AvatarImage src={`https://picsum.photos/seed/${roomId}/100`} />
                <AvatarFallback>{roomName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold leading-none">{roomName}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">Active now</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full">
            <Share className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="flex flex-col max-w-2xl mx-auto px-4 py-8 min-h-full">
          <div className="flex flex-col gap-1 pb-12">
            {messages?.map((msg, index) => (
              <MessageBubble 
                key={msg.id}
                msg={msg}
                isMe={msg.senderId === userId}
                onReply={() => setReplyTo(msg)}
                onEdit={() => handleEdit(msg)}
                onDelete={() => handleDelete(msg.id)}
                isFirstInGroup={index === 0 || messages[index - 1].senderId !== msg.senderId}
                isLastInGroup={index === messages.length - 1 || messages[index + 1].senderId !== msg.senderId}
              />
            ))}
          </div>
        </div>
      </ScrollArea>

      <footer className="p-4 bg-black lg:pb-6 sticky bottom-0 z-20 shrink-0 border-t border-white/5">
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          
          {replyTo && (
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-l-2 border-primary rounded-t-xl animate-in slide-in-from-bottom-2">
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-primary">Replying to {replyTo.senderDisplayName}</span>
                <span className="text-sm text-muted-foreground truncate">{replyTo.content || "Image"}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {editingMessage && (
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-l-2 border-blue-500 rounded-t-xl animate-in slide-in-from-bottom-2">
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-blue-500">Editing Message</span>
                <span className="text-sm text-muted-foreground truncate">{editingMessage.content}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                setEditingMessage(null);
                setInputText("");
              }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {selectedImage && (
            <div className="relative w-24 h-24 mb-2 rounded-xl overflow-hidden border border-white/20 group animate-in zoom-in-95">
              <Image src={selectedImage} alt="Preview" fill className="object-cover" />
              <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-black/50 rounded-full p-1">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="ig-input-pill shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center gap-1">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 -ml-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-all active:scale-90"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-5 h-5 text-white" />
              </Button>
            </div>
            
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={editingMessage ? "Edit message..." : "Message..."}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-white/40 h-10 text-[15px] ml-2"
              autoFocus
            />

            {(inputText.trim() || selectedImage) && (
              <Button type="submit" variant="ghost" className="text-[#0095f6] font-bold text-[15px] px-4">
                {editingMessage ? "Save" : "Send"}
              </Button>
            )}
          </form>
        </div>
      </footer>
    </div>
  )
}

function MessageBubble({ msg, isMe, onReply, onEdit, onDelete, isFirstInGroup, isLastInGroup }: { 
  msg: Message, 
  isMe: boolean, 
  onReply: () => void,
  onEdit: () => void,
  onDelete: () => void,
  isFirstInGroup: boolean,
  isLastInGroup: boolean
}) {
  const [swipeX, setSwipeX] = useState(0)
  const startX = useRef(0)
  const isSwiping = useRef(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Long press logic (2 seconds)
  const handlePointerDown = (e: React.PointerEvent) => {
    longPressTimer.current = setTimeout(() => {
      setIsMenuOpen(true)
    }, 2000)
  }

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // Swipe to reply logic
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    isSwiping.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startX.current
    // Only allow left swipe
    if (diff < 0) {
      setSwipeX(Math.max(diff, -100))
    }
  }

  const handleTouchEnd = () => {
    if (swipeX <= -60) {
      onReply()
    }
    setSwipeX(0)
    isSwiping.current = false
  }

  return (
    <div 
      className={cn(
        "flex flex-col max-w-[85%] lg:max-w-[75%] animate-message relative", 
        isMe ? "self-end items-end" : "self-start items-start",
        isFirstInGroup && "mt-6"
      )}
      style={{ transform: `translateX(${swipeX}px)`, transition: isSwiping.current ? 'none' : 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDoubleClick={onReply}
      onContextMenu={(e) => {
        e.preventDefault()
        setIsMenuOpen(true)
      }}
    >
      {/* Swipe Indicator */}
      <div 
        className="absolute right-[-40px] top-1/2 -translate-y-1/2 opacity-0 transition-opacity"
        style={{ opacity: swipeX < -40 ? 1 : 0 }}
      >
        <Reply className="w-5 h-5 text-primary" />
      </div>

      {!isMe && isFirstInGroup && (
        <span className="text-[11px] text-muted-foreground ml-3 mb-1 font-semibold uppercase tracking-wider">
          {msg.senderDisplayName}
        </span>
      )}

      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <div className={cn(
            "flex flex-col relative break-all whitespace-pre-wrap overflow-hidden cursor-default transition-all active:scale-[0.98]",
            isMe ? "ig-bubble-me" : "ig-bubble-other",
            !isLastInGroup && (isMe ? "rounded-br-[0.3rem]" : "rounded-bl-[0.3rem]"),
            isMe && !isLastInGroup && "mb-0.5",
            !isMe && !isLastInGroup && "mb-0.5",
            msg.imageUrl && "p-0 overflow-hidden"
          )}>
            {/* Reply Preview in Bubble */}
            {msg.replyToId && (
              <div className="mx-2 mt-2 px-3 py-1.5 bg-black/20 border-l-2 border-white/40 rounded-lg mb-1 opacity-80">
                <div className="text-[11px] font-bold opacity-70 flex items-center gap-1">
                  <CornerDownRight className="w-3 h-3" />
                  {msg.replyToSenderDisplayName}
                </div>
                <div className="text-[13px] truncate">{msg.replyToContent}</div>
              </div>
            )}

            {msg.imageUrl && (
              <div className="relative w-full aspect-square min-w-[200px] max-w-sm">
                <Image src={msg.imageUrl} alt="Shared media" fill className="object-cover" unoptimized />
              </div>
            )}

            {msg.content && (
              <div className="px-4 py-2.5 text-[15px] leading-[1.3] break-words relative">
                {msg.content}
                {(msg as any).edited && (
                  <span className="text-[10px] opacity-50 ml-2 italic">(edited)</span>
                )}
              </div>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isMe ? "end" : "start"} className="bg-[#262626] border-white/10 text-white min-w-[120px]">
          <DropdownMenuItem onClick={onReply} className="gap-2 focus:bg-white/10">
            <Reply className="w-4 h-4" /> Reply
          </DropdownMenuItem>
          {isMe && (
            <>
              <DropdownMenuItem onClick={onEdit} className="gap-2 focus:bg-white/10">
                <Pencil className="w-4 h-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="gap-2 text-red-400 focus:bg-red-400/10 focus:text-red-400">
                <Trash2 className="w-4 h-4" /> Unsend
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
