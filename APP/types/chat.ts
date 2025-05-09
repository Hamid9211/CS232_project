// app/types/chat.ts
export interface Doctor {
    id: string;
    name: string;
    specialty: string;
    experience: string;
    avatar: string;
    bio: string;
    availability: string;
    ratings: number;
  }
  
  export interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: number;
    read: boolean;
    senderName: string;
  }
  
  export interface ChatSession {
    id: string;
    participants: string[];
    lastMessage: string;
    lastMessageTimestamp: number;
    unreadCount: number;
  }
