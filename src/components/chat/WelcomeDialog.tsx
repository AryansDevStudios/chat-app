"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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
      <DialogContent className="sm:max-w-md bg-[#121212] border-white/10 rounded-[1.5rem] p-8">
        <DialogHeader className="space-y-4 text-center">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-bold tracking-tight text-white">Direct</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Enter your name to start messaging in this group.
            </DialogDescription>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#262626] border-white/5 focus-visible:ring-muted-foreground/30 h-11 rounded-md px-4 text-sm placeholder:text-muted-foreground/50"
            autoFocus
          />
          <DialogFooter>
            <Button type="submit" className="w-full bg-[#0095f6] hover:bg-[#1877f2] text-white font-bold rounded-md h-10 text-sm transition-all active:scale-95">
              Next
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
