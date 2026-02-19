
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
  Camera, 
  Loader2,
  X,
  Share,
  Home
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking 
} from "@/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface Message {
  id: string
  content: string
  imageUrl?: string
  senderId: string
  senderDisplayName: string
  timestamp: any
  roomId: string
}

export function ChatRoom() {
  const db = useFirestore()
  const { toast } = useToast()
  const { userId, displayName, roomId, isLoaded, updateDisplayName, goHome } = useChatSession()
  const [inputText, setInputText] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
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
      if (file.size > 1024 * 1024) { // 1MB limit for Base64 prototype
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image under 1MB for this prototype.",
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

    const messageData = {
      content: inputText.trim(),
      imageUrl: selectedImage || null,
      senderId: userId,
      senderDisplayName: displayName,
      timestamp: serverTimestamp(),
      roomId: roomId
    }

    const messagesRef = collection(db, "rooms", roomId, "messages")
    addDocumentNonBlocking(messagesRef, messageData)

    setInputText("")
    setSelectedImage(null)
  }

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: 'CharcoalChat',
      text: 'Join me in this chat room!',
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Chat room link copied to clipboard!",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Sharing Failed",
        description: "Could not share or copy the link.",
      });
    }
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

      {/* Header */}
      <header className="flex items-center justify-center px-4 h-16 border-b border-white/10 shrink-0 bg-black/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between w-full max-w-3xl">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full hover:bg-white/5 transition-colors"
              onClick={goHome}
            >
              <Home className="w-5 h-5 text-white" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 lg:hidden" onClick={goHome}>
              <ChevronLeft className="w-7 h-7" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-white/10 ring-1 ring-white/5">
                <AvatarImage src={`https://picsum.photos/seed/${roomId}/100`} />
                <AvatarFallback>{roomName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold leading-none">{roomName}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5 font-medium">Active now</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full hover:bg-white/5 transition-colors"
              onClick={handleShare}
            >
              <Share className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Message List */}
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="flex flex-col max-w-2xl mx-auto px-4 py-8 min-h-full">
          <div className="flex flex-col items-center py-12 gap-4">
            <Avatar className="h-24 w-24 border-2 border-white/5 ring-1 ring-white/10 shadow-2xl transition-transform hover:scale-105 duration-300">
              <AvatarImage src={`https://picsum.photos/seed/${roomId}/200`} />
              <AvatarFallback className="text-2xl">{roomName[0]}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">{roomName}</h2>
              <p className="text-sm text-muted-foreground mt-1 font-medium">Group Chat • {messages?.length || 0} messages</p>
            </div>
          </div>

          <div className="flex flex-col gap-1 pb-12">
            {messages?.map((msg, index) => {
              const isMe = msg.senderId === userId
              const isFirstInGroup = index === 0 || messages[index - 1].senderId !== msg.senderId
              const isLastInGroup = index === messages.length - 1 || messages[index + 1].senderId !== msg.senderId

              return (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex flex-col max-w-[85%] lg:max-w-[75%] animate-message group/msg min-w-0 transition-transform duration-75 ease-out", 
                    isMe ? "self-end items-end text-right" : "self-start items-start text-left",
                    isFirstInGroup && "mt-6"
                  )}
                >
                  {!isMe && isFirstInGroup && (
                    <span className="text-[11px] text-muted-foreground ml-3 mb-1 font-semibold uppercase tracking-wider">
                      {msg.senderDisplayName}
                    </span>
                  )}

                  <div className={cn(
                    "flex flex-col relative break-all whitespace-pre-wrap overflow-hidden",
                    isMe ? "ig-bubble-me" : "ig-bubble-other",
                    !isLastInGroup && (isMe ? "rounded-br-[0.3rem]" : "rounded-bl-[0.3rem]"),
                    isMe && !isLastInGroup && "mb-0.5",
                    !isMe && !isLastInGroup && "mb-0.5",
                    msg.imageUrl && "p-0 overflow-hidden"
                  )}>
                    {msg.imageUrl && (
                      <div className="relative w-full aspect-square min-w-[200px] max-w-sm">
                        <Image 
                          src={msg.imageUrl} 
                          alt="Shared media" 
                          fill 
                          className="object-cover"
                          unoptimized={msg.imageUrl.startsWith('data:')}
                        />
                      </div>
                    )}

                    {msg.content && (
                      <div className="px-4 py-2.5 text-[15px] leading-[1.3] break-words relative">
                        {msg.content}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </ScrollArea>

      {/* Footer Input Bar */}
      <footer className="p-4 bg-black lg:pb-6 sticky bottom-0 z-20 shrink-0 border-t border-white/5">
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          
          {selectedImage && (
            <div className="relative w-24 h-24 mb-2 rounded-xl overflow-hidden border border-white/20 group animate-in zoom-in-95">
              <Image src={selectedImage} alt="Preview" fill className="object-cover" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          <form 
            onSubmit={handleSendMessage} 
            className="ig-input-pill shadow-2xl ring-1 ring-white/10 transition-all"
          >
            <div className="flex items-center gap-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect} 
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 -ml-1 rounded-full bg-blue-500 hover:bg-blue-600 transition-all active:scale-90 flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-5 h-5 text-white" />
              </Button>
            </div>
            
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-white/40 h-10 text-[15px] p-0 font-normal ml-2"
              autoFocus
            />

            {(inputText.trim() || selectedImage) && (
              <Button 
                type="submit" 
                variant="ghost" 
                className="text-[#0095f6] font-bold text-[15px] p-0 px-4 hover:bg-transparent hover:text-blue-400 active:scale-95 transition-all flex-shrink-0"
              >
                Send
              </Button>
            )}
          </form>
        </div>
      </footer>
    </div>
  )
}
