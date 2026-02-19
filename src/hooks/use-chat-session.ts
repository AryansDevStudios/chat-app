import { useState, useEffect } from 'react';

const STORAGE_KEYS = {
  USER_ID: 'charcoal_chat_user_id',
  DISPLAY_NAME: 'charcoal_chat_display_name',
  ROOM_ID: 'charcoal_chat_room_id',
};

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

export function useChatSession() {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Sync with localStorage on mount
    let storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!storedUserId) {
      storedUserId = generateId('user');
      localStorage.setItem(STORAGE_KEYS.USER_ID, storedUserId);
    }
    setUserId(storedUserId);

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
    setIsLoaded(true);
  }, []);

  const updateDisplayName = (name: string) => {
    localStorage.setItem(STORAGE_KEYS.DISPLAY_NAME, name);
    setDisplayName(name);
  };

  return {
    userId,
    displayName,
    roomId,
    isLoaded,
    updateDisplayName,
  };
}