"use client"

import { useState } from "react"
import { useChatSession } from "@/hooks/use-chat-session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Instagram, Plus, MessageCircle, Settings, LogIn, History } from "lucide-react"
import { WelcomeDialog } from "../chat/WelcomeDialog"

export function HomeDashboard() {
  const { displayName, updateDisplayName, createRoom, joinRoom, recentRooms } = useChatSession()
  const [joinId, setJoinId] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinId.trim()) {
      joinRoom(joinId.trim())
    }
  }

  return (
    <div className="flex flex-col w-full h-full max-w-2xl mx-auto px-4 py-12 gap-8 overflow-y-auto">
      <WelcomeDialog isOpen={!displayName} onSave={updateDisplayName} />

      {/* Profile Section */}
      <section className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative group">
          <Avatar className="h-32 w-32 border-2 border-white/10 ring-4 ring-primary/20 shadow-2xl">
            <AvatarImage src={`https://picsum.photos/seed/${displayName}/200`} />
            <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/20 to-accent/20">
              {displayName?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button 
            variant="secondary" 
            size="icon" 
            className="absolute bottom-0 right-0 rounded-full h-10 w-10 border-2 border-black"
            onClick={() => setIsEditingName(true)}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {displayName}</h1>
          <p className="text-muted-foreground">Ready to start a new conversation?</p>
        </div>
      </section>

      <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
        {/* Actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Button 
            onClick={createRoom}
            className="h-32 rounded-3xl bg-gradient-to-br from-[#A307BA] via-[#E21E53] to-[#FF8C37] hover:opacity-90 transition-all group"
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-lg">Create New Room</span>
            </div>
          </Button>

          <Card className="rounded-3xl border-white/10 bg-[#1a1a1a] flex flex-col justify-center px-6">
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground ml-1">Join with Room ID</span>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter ID..." 
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    className="bg-black/40 border-white/5 rounded-xl h-11"
                  />
                  <Button type="submit" size="icon" className="h-11 w-11 rounded-xl bg-blue-500 hover:bg-blue-600">
                    <LogIn className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* Recent Rooms */}
        {recentRooms.length > 0 && (
          <Card className="rounded-3xl border-white/10 bg-[#1a1a1a] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <History className="w-4 h-4" /> Recent Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {recentRooms.map((id) => (
                <button
                  key={id}
                  onClick={() => joinRoom(id)}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors text-left group"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://picsum.photos/seed/${id}/100`} />
                    <AvatarFallback>{id[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] truncate">
                      {id.includes('_') ? id.split('_')[1].toUpperCase() : id}
                    </p>
                    <p className="text-xs text-muted-foreground truncate font-mono">{id}</p>
                  </div>
                  <MessageCircle className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {isEditingName && (
        <WelcomeDialog isOpen={true} onSave={(name) => {
          updateDisplayName(name)
          setIsEditingName(false)
        }} />
      )}
    </div>
  )
}
