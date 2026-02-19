'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

const STORAGE_KEYS = {
  DISPLAY_NAME: 'charcoal_chat_display_name',
  ROOM_ID: 'charcoal_chat_room_id',
};

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

export function useChatSession() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!auth) return;

    // Trigger anonymous sign-in if not logged in
    if (!user && !isUserLoading) {
      signInAnonymously(auth).catch(console.error);
    }
  }, [auth, user, isUserLoading]);

  useEffect(() => {
    // Sync with localStorage on mount
    const storedDisplayName = localStorage.getItem(STORAGE_KEYS.DISPLAY_NAME);
    setDisplayName(storedDisplayName);

    // Room ID can come from URL or storage
    const urlParams = new URLSearchParams(window.location.search);
    let currentRoom = urlParams.get('room');
    
    if (!currentRoom) {
      currentRoom = localStorage.getItem(STORAGE_KEYS.ROOM_ID);
      if (!currentRoom) {
        currentRoom = generateId('room');
        localStorage.setItem(STORAGE_KEYS.ROOM_ID, currentRoom);
      }
      // Update URL without reloading
      const newUrl = `${window.location.pathname}?room=${currentRoom}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    } else {
      localStorage.setItem(STORAGE_KEYS.ROOM_ID, currentRoom);
    }
    
    setRoomId(currentRoom);
  }, []);

  useEffect(() => {
    if (user && roomId) {
      setIsLoaded(true);
    }
  }, [user, roomId]);

  const updateDisplayName = (name: string) => {
    localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, name);
    setDisplayName(name);
  };

  return {
    userId: user?.uid || null,
    displayName,
    roomId,
    isLoaded: isLoaded && !isUserLoading,
    updateDisplayName,
  };
}
