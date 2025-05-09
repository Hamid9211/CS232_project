// app/utils/chatUtils.ts
import { ref, onValue, set, update, push, remove } from 'firebase/database';
import { database } from '../firebase';
import { ChatMessage, ChatSession } from '../types/chat';

// Generate a unique chat ID from two user IDs
export const getChatId = (userId1: string, userId2: string) => {
  // Sort the IDs to ensure the same chat ID regardless of order
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Get all chat sessions for a user
export const getUserChatSessions = (
  userId: string, 
  callback: (sessions: ChatSession[]) => void
) => {
  const sessionsRef = ref(database, 'chatSessions');
  
  onValue(sessionsRef, (snapshot) => {
    const data = snapshot.val();
    const sessions: ChatSession[] = [];
    
    if (data) {
      Object.keys(data).forEach((key) => {
        if (data[key].participants.includes(userId)) {
          sessions.push({
            id: key,
            ...data[key]
          });
        }
      });
      
      // Sort by last message timestamp
      sessions.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
    }
    
    callback(sessions);
  });
};

// Get chat messages for a specific chat session
export const getChatMessages = (
  chatId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const messagesRef = ref(database, `chats/${chatId}/messages`);
  
  onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    const messages: ChatMessage[] = [];
    
    if (data) {
      Object.keys(data).forEach((key) => {
        messages.push({
          id: key,
          ...data[key]
        });
      });
      
      // Sort by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);
    }
    
    callback(messages);
  });
};

// Send a message
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string,
  senderName: string
) => {
  const chatId = getChatId(senderId, receiverId);
  const messagesRef = ref(database, `chats/${chatId}/messages`);
  const newMessageRef = push(messagesRef);
  
  const newMessage: Omit<ChatMessage, 'id'> = {
    senderId,
    receiverId,
    content,
    timestamp: Date.now(),
    read: false,
    senderName
  };
  
  await set(newMessageRef, newMessage);
  
  // Update the chat session with the last message
  const chatSessionRef = ref(database, `chatSessions/${chatId}`);
  return set(chatSessionRef, {
    participants: [senderId, receiverId],
    lastMessage: content,
    lastMessageTimestamp: Date.now(),
    unreadCount: 0
  });
};

// Mark messages as read
export const markMessagesAsRead = (
  chatId: string,
  userId: string
) => {
  const messagesRef = ref(database, `chats/${chatId}/messages`);
  
  onValue(messagesRef, 
    (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        Object.keys(data).forEach((key) => {
          if (!data[key].read && data[key].receiverId === userId) {
            const messageRef = ref(database, `chats/${chatId}/messages/${key}`);
            update(messageRef, { read: true });
          }
        });
      }
      
      // Update unread count in chat session
      const sessionRef = ref(database, `chatSessions/${chatId}`);
      update(sessionRef, { unreadCount: 0 });
    },
    { onlyOnce: true }
  );
};

// Delete a chat session and all messages
export const deleteChat = async (chatId: string) => {
  const chatRef = ref(database, `chats/${chatId}`);
  const sessionRef = ref(database, `chatSessions/${chatId}`);
  
  await remove(chatRef);
  await remove(sessionRef);
};