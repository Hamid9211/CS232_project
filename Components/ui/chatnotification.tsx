// app/components/ChatNotifications.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../app/firebase';
import { getCookie } from 'cookies-next';
import { getUserChatSessions, getChatId } from '../../app/utils/chatUtils';

interface ChatNotificationsProps {
  doctorId?: string;
}

const ChatNotifications: React.FC<ChatNotificationsProps> = ({ doctorId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get user email from cookies
    const email = getCookie('userEmail');
    if (email) {
      setUserEmail(email.toString());
    }
  }, []);

  useEffect(() => {
    if (!userEmail) return;

    // If a specific doctor ID is provided, only check notifications for that chat
    if (doctorId) {
      const chatId = getChatId(userEmail, doctorId);
      const chatSessionRef = ref(database, `chatSessions/${chatId}`);
      
      const unsubscribe = onValue(chatSessionRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.unreadCount > 0) {
          setUnreadCount(data.unreadCount);
        } else {
          setUnreadCount(0);
        }
      });
      
      return () => unsubscribe();
    } 
    // Otherwise check all chats
    else {
      getUserChatSessions(userEmail, (sessions) => {
        const total = sessions.reduce((count, session) => count + (session.unreadCount || 0), 0);
        setUnreadCount(total);
      });
    }
  }, [userEmail, doctorId]);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};

export default ChatNotifications;
