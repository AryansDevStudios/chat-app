'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

const STORAGE_KEYS = {
  DISPLAY_NAME: 'charcoal_chat_display_name',
  ROOM_ID: 'charcoal_chat_room_id',
  RECENT_ROOMS: 'charcoal_chat_recent_rooms',
};

export function useChatSession() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [recentRooms, setRecentRooms] = useState<string[]>([]);

  useEffect(() => {
    if (!auth) return;
    if (!user && !isUserLoading) {
      signInAnonymously(auth).catch(console.error);
    }
  }, [auth, user, isUserLoading]);

  useEffect(() => {
    // Sync with localStorage
    const storedDisplayName = localStorage.getItem(STORAGE_KEYS.DISPLAY_NAME);
    setDisplayName(storedDisplayName);

    const storedRecent = localStorage.getItem(STORAGE_KEYS.RECENT_ROOMS);
    if (storedRecent) {
      setRecentRooms(JSON.parse(storedRecent));
    }

    // Room ID from URL only
    const urlParams = new URLSearchParams(window.location.search);
    const currentRoom = urlParams.get('room');
    setRoomId(currentRoom);

    if (currentRoom) {
      saveRecentRoom(currentRoom);
    }

    setIsLoaded(true);
  }, []);

  const saveRecentRoom = (id: string) => {
    const storedRecent = localStorage.getItem(STORAGE_KEYS.RECENT_ROOMS);
    let rooms: string[] = storedRecent ? JSON.parse(storedRecent) : [];
    if (!rooms.includes(id)) {
      rooms = [id, ...rooms].slice(0, 5);
      localStorage.setItem(STORAGE_KEYS.RECENT_ROOMS, JSON.stringify(rooms));
      setRecentRooms(rooms);
    }
  };

  const updateDisplayName = (name: string) => {
    localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, name);
    setDisplayName(name);
  };

  const createRoom = (name: string) => {
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'chat';
    const newRoomId = `room_${slug}_${Math.random().toString(36).substr(2, 4)}`;
    window.location.href = `?room=${newRoomId}`;
  };

  const joinRoom = (id: string) => {
    window.location.href = `?room=${id}`;
  };

  const goHome = () => {
    window.location.href = '/';
  };

  return {
    userId: user?.uid || null,
    displayName,
    roomId,
    recentRooms,
    isLoaded: isLoaded && !isUserLoading,
    updateDisplayName,
    createRoom,
    joinRoom,
    goHome,
  };
}
