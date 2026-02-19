"use client"

import { useState, useRef, useEffect } from "react"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import { useChatSession } from "@/hooks/use-chat-session"
import { WelcomeDialog } from "./WelcomeDialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { 
  Camera, 
  ImageIcon,
  Loader2,
  X,
  Share,
  Home,
  Mic,
  Square,
  Play,
  Pause,
  SendHorizontal,
  Maximize2,
  Reply
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking
} from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useIsMobile } from "@/hooks/use-mobile"

interface Message {
  id: string
  content: string
  imageUrl?: string
  audioUrl?: string
  senderId: string
  senderDisplayName: string
  timestamp: any
  roomId: string
  replyToId?: string
  replyToContent?: string
  replyToSenderDisplayName?: string
  edited?: boolean
}

export function ChatRoom() {
  const db = useFirestore()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const { userId, displayName, roomId, isLoaded, updateDisplayName, goHome } = useChatSession()
  
  const [inputText, setInputText] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [replyTarget, setReplyTarget] = useState<{ id: string, content: string, senderDisplayName: string } | null>(null)
  
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
  const [initialDistance, setInitialDistance] = useState<number | null>(null)
  
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioBase64, setAudioBase64] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editableInputRef = useRef<HTMLDivElement>(null)

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

  const scrollToMessage = (msgId: string) => {
    const element = document.getElementById(`msg-${msgId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      // Brief highlight effect
      element.style.backgroundColor = "rgba(255, 255, 255, 0.15)"
      setTimeout(() => {
        element.style.backgroundColor = ""
      }, 1500)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      )
      setInitialDistance(dist)
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true)
      setLastPos({ x: e.touches[0].pageX, y: e.touches[0].pageY })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance !== null) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      )
      const zoomSensitivity = 0.01
      const delta = (dist - initialDistance) * zoomSensitivity
      setScale(prev => {
        const newScale = Math.min(Math.max(1, prev + delta), 8)
        if (newScale === 1) setTranslate({ x: 0, y: 0 })
        return newScale
      })
      setInitialDistance(dist)
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const deltaX = e.touches[0].pageX - lastPos.x
      const deltaY = e.touches[0].pageY - lastPos.y
      setTranslate(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      setLastPos({ x: e.touches[0].pageX, y: e.touches[0].pageY })
    }
  }

  const handleTouchEnd = () => {
    setInitialDistance(null)
    setIsDragging(false)
  }

  const processImageFile = (file: File) => {
    if (file.size > 1 * 1024 * 1024) {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          processImageFile(file)
          e.preventDefault()
        }
      }
    }
  }

  const openCamera = async () => {
    setIsCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      setHasCameraPermission(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      setHasCameraPermission(false)
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions.',
      })
    }
  }

  const closeCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream
    stream?.getTracks().forEach(track => track.stop())
    setIsCameraOpen(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setSelectedImage(dataUrl)
        closeCamera()
      }
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64Audio = reader.result as string
          setAudioBase64(base64Audio)
        }
        reader.readAsDataURL(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Microphone Access Denied",
        description: "Please enable microphone permissions.",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const cancelRecording = () => {
    stopRecording()
    setAudioBase64(null)
    setRecordingDuration(0)
  }

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    const content = editableInputRef.current?.innerText.trim() || ""
    if ((!content && !selectedImage && !audioBase64) || !userId || !displayName || !roomId || !db) return

    const messageData: any = {
      content: content,
      imageUrl: selectedImage || null,
      audioUrl: audioBase64 || null,
      senderId: userId,
      senderDisplayName: displayName,
      timestamp: serverTimestamp(),
      roomId: roomId
    }

    if (replyTarget) {
      messageData.replyToId = replyTarget.id
      messageData.replyToContent = replyTarget.content
      messageData.replyToSenderDisplayName = replyTarget.senderDisplayName
    }

    const messagesRef = collection(db, "rooms", roomId, "messages")
    addDocumentNonBlocking(messagesRef, messageData)

    if (editableInputRef.current) {
      editableInputRef.current.innerText = ""
    }
    setInputText("")
    setSelectedImage(null)
    setAudioBase64(null)
    setReplyTarget(null)
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

  const handleReplyToMessage = (msg: Message) => {
    setReplyTarget({
      id: msg.id,
      content: msg.content || (msg.imageUrl ? "📷 Photo" : msg.audioUrl ? "🎤 Voice Message" : ""),
      senderDisplayName: msg.senderDisplayName
    })
    if (editableInputRef.current) {
      editableInputRef.current.focus()
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

      <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/10 shrink-0 bg-black/80 backdrop-blur-md z-30 flex items-center justify-center px-4">
        <div className="flex items-center justify-between w-full max-w-3xl">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/5" onClick={goHome}>
              <Home className="w-5 h-5" />
            </Button>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold leading-none">{roomName}</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">Active now</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full">
            <Share className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <ScrollArea ref={scrollRef} className="flex-1 pt-16 pb-32">
        <div className="flex flex-col max-w-2xl mx-auto px-4 py-8 min-h-full">
          <div className="flex flex-col gap-1 pb-12">
            {messages?.map((msg, index) => (
              <MessageBubble 
                key={msg.id}
                msg={msg}
                isMe={msg.senderId === userId}
                isFirstInGroup={index === 0 || messages[index - 1].senderId !== msg.senderId}
                isLastInGroup={index === messages.length - 1 || messages[index + 1].senderId !== msg.senderId}
                onPreviewImage={setPreviewImageUrl}
                onReply={() => handleReplyToMessage(msg)}
                onJumpToMessage={scrollToMessage}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      </ScrollArea>

      <footer className="fixed bottom-0 left-0 right-0 w-full bg-black/95 backdrop-blur-xl border-t border-white/5 pb-safe z-30">
        <div className="max-w-2xl mx-auto p-4 flex flex-col gap-2">
          
          {replyTarget && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border-l-2 border-primary rounded-t-xl animate-in slide-in-from-bottom-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-primary font-bold uppercase truncate">
                  Replying to {replyTarget.senderDisplayName}
                </p>
                <p className="text-xs text-white/60 truncate italic">
                  {replyTarget.content}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTarget(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {selectedImage && (
            <div className="relative w-24 h-24 mb-2 rounded-xl overflow-hidden border border-white/20 animate-in zoom-in-95">
              <Image src={selectedImage} alt="Preview" fill className="object-cover" unoptimized />
              <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-black/50 rounded-full p-1 z-10">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {audioBase64 && !isRecording && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border-l-2 border-red-500 rounded-t-xl animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 flex-1">
                <Mic className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Voice message ready</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAudioBase64(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="ig-input-pill shadow-2xl ring-1 ring-white/10 relative">
            <div className="flex items-center gap-0.5 self-end mb-1">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-white/10"
                onClick={() => fileInputRef.current?.click()}
                title="Send Image"
              >
                <ImageIcon className="w-5 h-5 text-white/70" />
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-white/10"
                onClick={openCamera}
                title="Camera"
              >
                <Camera className="w-5 h-5 text-white/70" />
              </Button>
            </div>
            
            {isRecording ? (
              <div className="flex-1 flex items-center gap-3 px-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[15px] font-mono tabular-nums">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-sm text-white/60 flex-1">Recording...</span>
                <Button type="button" variant="ghost" className="text-red-500 font-bold" onClick={cancelRecording}>Cancel</Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600"
                  onClick={stopRecording}
                >
                  <Square className="w-4 h-4 text-white" />
                </Button>
              </div>
            ) : (
              <div
                ref={editableInputRef}
                contentEditable
                onInput={(e) => setInputText(e.currentTarget.innerText)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message..."
                className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder:text-white/40 min-h-[40px] max-h-[120px] py-2.5 overflow-y-auto whitespace-pre-wrap ml-2 scrollbar-none text-[15px]"
              />
            )}

            {!isRecording && (
              <div className="flex items-center gap-1 self-end mb-1">
                {(inputText.trim() || selectedImage || audioBase64) ? (
                  <Button onClick={handleSendMessage} variant="ghost" size="icon" className="h-8 w-8 rounded-full text-primary hover:bg-primary/10 transition-all">
                    <SendHorizontal className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-white/10"
                    onClick={startRecording}
                  >
                    <Mic className="w-5 h-5 text-white/70" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </footer>

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="sm:max-w-md bg-black border-white/10 p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-white/10">
            <DialogTitle className="text-white flex items-center justify-between">
              Take Photo
              <Button variant="ghost" size="icon" onClick={closeCamera} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video bg-neutral-900 flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            
            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser settings.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
          <div className="p-6 flex justify-center bg-black">
            <Button 
              size="lg" 
              className="rounded-full w-16 h-16 border-4 border-white/20 bg-white hover:bg-white/90"
              onClick={capturePhoto}
              disabled={!hasCameraPermission}
            >
              <div className="w-12 h-12 rounded-full border-2 border-black/10" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewImageUrl} onOpenChange={(open) => {
        if (!open) {
          setPreviewImageUrl(null)
          setScale(1)
          setTranslate({ x: 0, y: 0 })
        }
      }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] bg-black/95 border-white/10 p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-4 border-b border-white/10 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white text-sm font-medium">Image Preview</DialogTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-8 w-8"
                  onClick={() => {
                    setPreviewImageUrl(null)
                    setScale(1)
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div 
            className="flex-1 overflow-hidden relative bg-black select-none touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            {previewImageUrl && (
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ 
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                  transition: initialDistance ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                <Image 
                  src={previewImageUrl} 
                  alt="Full size preview" 
                  width={1200} 
                  height={1200} 
                  className="max-w-full max-h-full object-contain rounded-md"
                  unoptimized 
                />
              </div>
            )}
          </div>
          <div className="p-4 text-center text-[11px] text-muted-foreground border-t border-white/5 bg-black/50">
            Use two fingers to zoom and pan
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MessageBubble({ msg, isMe, isFirstInGroup, isLastInGroup, onPreviewImage, onReply, onJumpToMessage, isMobile }: { 
  msg: Message, 
  isMe: boolean, 
  isFirstInGroup: boolean,
  isLastInGroup: boolean,
  onPreviewImage: (url: string) => void,
  onReply: () => void,
  onJumpToMessage: (id: string) => void,
  isMobile: boolean
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toggleAudio = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() 
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleBubbleDoubleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isMobile) {
      e.preventDefault()
      onReply()
    }
  }

  return (
    <div 
      id={`msg-${msg.id}`}
      className={cn(
        "flex flex-col max-w-[85%] lg:max-w-[75%] animate-message relative select-none rounded-xl transition-colors duration-500", 
        isMe ? "self-end items-end" : "self-start items-start",
        isFirstInGroup && "mt-6"
      )}
      onDoubleClick={handleBubbleDoubleClick}
    >
      {!isMe && isFirstInGroup && (
        <span className="text-[11px] text-muted-foreground ml-3 mb-1 font-semibold uppercase tracking-wider">
          {msg.senderDisplayName}
        </span>
      )}

      <div 
        className={cn(
          "flex flex-col relative break-all whitespace-pre-wrap overflow-hidden cursor-default transition-all group",
          isMe ? "ig-bubble-me" : "ig-bubble-other",
          !isLastInGroup && (isMe ? "rounded-br-[0.3rem]" : "rounded-bl-[0.3rem]"),
          isMe && !isLastInGroup && "mb-0.5",
          !isMe && !isLastInGroup && "mb-0.5",
          msg.imageUrl && "p-0 overflow-hidden",
          msg.audioUrl && "min-w-[200px]"
        )}
      >
        {msg.replyToId && (
          <div 
            onClick={() => msg.replyToId && onJumpToMessage(msg.replyToId)}
            className="px-3 pt-2 pb-1 opacity-70 border-b border-white/10 bg-black/20 flex items-center gap-2 max-w-full cursor-pointer hover:bg-black/40 transition-colors"
          >
            <Reply className="w-3 h-3 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold truncate">{msg.replyToSenderDisplayName}</span>
              <span className="text-[10px] truncate italic">{msg.replyToContent}</span>
            </div>
          </div>
        )}

        {msg.imageUrl && (
          <div 
            className="relative w-full min-h-[150px] max-w-sm cursor-zoom-in group"
            onClick={(e) => {
              e.stopPropagation()
              onPreviewImage(msg.imageUrl!)
            }}
          >
            <Image 
              src={msg.imageUrl} 
              alt="Shared media" 
              width={400} 
              height={400} 
              className="object-contain w-full h-auto max-h-[400px] hover:opacity-90 transition-opacity" 
              unoptimized 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Maximize2 className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
          </div>
        )}

        {msg.audioUrl && (
          <div className="flex items-center gap-3 px-4 py-3">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 z-10"
              onClick={toggleAudio}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <div className="flex-1 flex flex-col gap-1">
              <div className="h-1 w-full bg-white/20 rounded-full relative overflow-hidden">
                <div className={cn("absolute inset-0 bg-white/60", isPlaying ? "animate-pulse" : "w-0")} />
              </div>
              <span className="text-[10px] opacity-60">Voice Message</span>
            </div>
            <audio 
              ref={audioRef} 
              src={msg.audioUrl} 
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              className="hidden" 
            />
          </div>
        )}

        {msg.content && (
          <div className="px-4 py-2.5 text-[15px] leading-[1.3] break-words relative">
            {msg.content}
            {msg.edited && (
              <span className="text-[10px] opacity-50 ml-2 italic">(edited)</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
