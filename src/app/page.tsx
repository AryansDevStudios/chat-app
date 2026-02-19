import { ChatRoom } from "@/components/chat/ChatRoom";
import { Toaster } from "@/components/ui/toaster";

export default function HomePage() {
  return (
    <div className="flex h-screen w-full bg-[#121212] items-center justify-center lg:p-6 overflow-hidden">
      {/* Main Content Area - Just the Chat, Centered and Windowed on Desktop */}
      <main className="flex-1 flex flex-col h-full w-full max-w-4xl bg-black lg:rounded-3xl lg:border lg:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
        <ChatRoom />
      </main>
      <Toaster />
    </div>
  );
}
