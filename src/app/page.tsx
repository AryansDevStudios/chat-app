import { ChatRoom } from "@/components/chat/ChatRoom";
import { Toaster } from "@/components/ui/toaster";

export default function HomePage() {
  return (
    <div className="flex h-screen w-full bg-black overflow-hidden">
      {/* Main Content Area - Just the Chat */}
      <main className="flex-1 flex flex-col h-full w-full max-w-5xl mx-auto border-x border-white/5 shadow-2xl">
        <ChatRoom />
      </main>
      <Toaster />
    </div>
  );
}
