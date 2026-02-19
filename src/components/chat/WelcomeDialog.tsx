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
      <DialogContent className="sm:max-w-md bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline text-foreground">Welcome to CharcoalChat</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Before we start, what should others call you?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Enter your display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-muted border-white/5 focus-visible:ring-primary"
            autoFocus
          />
          <DialogFooter>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-xl h-12">
              Start Chatting
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}