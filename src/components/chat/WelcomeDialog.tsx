"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface WelcomeDialogProps {
  isOpen: boolean
  onSave: (name: string) => void
}

export function WelcomeDialog({ isOpen, onSave }: WelcomeDialogProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSave(name.trim())
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-white/5 rounded-[2rem] p-8">
        <DialogHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-3xl font-bold tracking-tight text-foreground">Pick a name</DialogTitle>
            <DialogDescription className="text-muted-foreground text-base">
              Enter a display name to start chatting with others in real-time.
            </DialogDescription>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <Input
            placeholder="Alex, Sarah, etc..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-muted/50 border-white/5 focus-visible:ring-primary h-14 rounded-2xl px-6 text-lg placeholder:text-muted-foreground/30"
            autoFocus
          />
          <DialogFooter>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl h-14 text-lg shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
              Enter Room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}