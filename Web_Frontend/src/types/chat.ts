import { UserRole } from './user';

export interface ChatMessage {
  id: string;
  user_id: string;
  user_nick: string;
  role: UserRole;
  mensaje: string;
  created_at: string;
  is_admin?: boolean;
  is_referee?: boolean;
}

export interface SendChatMessagePayload {
  mensaje: string;
}
