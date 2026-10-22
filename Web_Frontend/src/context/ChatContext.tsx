import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatMessage } from '../types/chat';
import { chatService } from '../services/chatService';
import { useAuth } from './AuthContext';

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { user } = useAuth();

  const loadMessages = async () => {
    const list = await chatService.getMessages();
    setMessages(list);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const sendMessage = async (text: string) => {
    if (!user) {
      throw new Error('Debes iniciar sesión para comentar en el chat.');
    }
    const newMsg = await chatService.sendMessage(user, text);
    setMessages(prev => [...prev, newMsg]);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendMessage,
        refreshMessages: loadMessages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat debe usarse dentro de ChatProvider');
  }
  return context;
};

