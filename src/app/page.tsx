import { ChatRoom } from "@/components/chat/ChatRoom";
import { Toaster } from "@/components/ui/toaster";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { 
  Home, 
  Search, 
  Compass, 
  Film, 
  MessageCircle, 
  Heart, 
  PlusSquare,
  Menu,
  Instagram
} from "lucide-react";

export default function HomePage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-black overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar className="border-r border-white/10 bg-black hidden md:flex">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <Instagram className="w-6 h-6" />
              <span className="text-xl font-bold tracking-tight">Instagram</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarMenu>
              {[
                { icon: Home, label: "Home" },
                { icon: Search, label: "Search" },
                { icon: Compass, label: "Explore" },
                { icon: Film, label: "Reels" },
                { icon: MessageCircle, label: "Messages", active: true },
                { icon: Heart, label: "Notifications" },
                { icon: PlusSquare, label: "Create" },
              ].map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    className={`flex items-center gap-4 py-6 px-4 rounded-lg transition-all hover:bg-white/5 ${item.active ? 'font-bold' : ''}`}
                  >
                    <item.icon className={`w-6 h-6 ${item.active ? 'stroke-[3px]' : ''}`} />
                    <span className="text-base">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <div className="mt-auto p-4">
            <SidebarMenuButton className="flex items-center gap-4 py-6 px-4 rounded-lg hover:bg-white/5 w-full">
              <Menu className="w-6 h-6" />
              <span className="text-base">More</span>
            </SidebarMenuButton>
          </div>
        </Sidebar>

        {/* Main Content Area */}
        <main className="flex-1 flex overflow-hidden relative">
          {/* Conversation List Pane (Desktop Only) */}
          <div className="hidden lg:flex w-96 flex-col border-r border-white/10 shrink-0">
            <div className="p-6 flex justify-between items-center">
              <h1 className="text-xl font-bold">Direct</h1>
              <PlusSquare className="w-6 h-6 cursor-pointer" />
            </div>
            <div className="px-6 py-2">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Messages</span>
            </div>
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              {/* Simulated Conversation List */}
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
                  <div className="w-full h-full rounded-full border-2 border-black overflow-hidden">
                    <img src="https://picsum.photos/seed/room/100" alt="Room" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">General Chat</span>
                  <span className="text-xs text-muted-foreground font-medium">Active now</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Room Area */}
          <div className="flex-1 h-full bg-black">
             <ChatRoom />
          </div>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
