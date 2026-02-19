"use client"

import { ChatRoom } from "@/components/chat/ChatRoom"
import { HomeDashboard } from "@/components/home/HomeDashboard"
import { Toaster } from "@/components/ui/toaster"
import { useChatSession } from "@/hooks/use-chat-session"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { roomId, isLoaded } = useChatSession()

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full bg-[#121212] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-[#121212] items-center justify-center lg:p-6 overflow-hidden">
      <main className="flex-1 flex flex-col h-full w-full max-w-4xl bg-black lg:rounded-3xl lg:border lg:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
        {roomId ? <ChatRoom /> : <HomeDashboard />}
      </main>
      <Toaster />
    </div>
  )
}
