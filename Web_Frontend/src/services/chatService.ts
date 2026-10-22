import { ChatMessage } from '../types/chat';
import { UserProfile, UserRole } from '../types/user';
import { INITIAL_CHAT_MESSAGES } from './mockData';
import { STORAGE_KEYS } from '../config/constants';
import { isSupabaseConfigured, requireSupabase } from './supabase';

interface ChatRow {
  id: string;
  user_id: string | null;
  perfil_id: string | null;
  user_nick: string;
  rol: string;
  mensaje: string;
  created_at: string;
}

function mapMessage(row: ChatRow): ChatMessage {
  const role = (row.rol as UserRole) ?? 'usuario';
  return {
    id: row.id,
    user_id: row.perfil_id ?? row.user_id ?? '',
    user_nick: row.user_nick,
    role,
    mensaje: row.mensaje,
    created_at: row.created_at,
    is_admin: role === 'admin',
    is_referee: role === 'arbitro'
  };
}

export const chatService = {
  /**
   * Obtiene los mensajes del chat en vivo desde Supabase.
   */
  async getMessages(): Promise<ChatMessage[]> {
    if (isSupabaseConfigured) {
      try {
        const client = requireSupabase();
        const { data, error } = await client
          .from('chat_mensajes')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (data && data.length) return (data as ChatRow[]).map(mapMessage);
      } catch (error) {
        console.warn('No se pudo cargar el chat desde Supabase:', error);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      if (stored) {
        return JSON.parse(stored) as ChatMessage[];
      }
    } catch {
      // Fallback
    }

    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(INITIAL_CHAT_MESSAGES));
    return INITIAL_CHAT_MESSAGES;
  },

  /**
   * Envía un nuevo mensaje al chat. Requiere sesión iniciada.
   */
  async sendMessage(user: UserProfile, mensaje: string): Promise<ChatMessage> {
    const texto = mensaje.trim();
    if (!texto) throw new Error('El mensaje no puede estar vacío.');

    if (isSupabaseConfigured) {
      const client = requireSupabase();
      const { data: authData, error: authError } = await client.auth.getUser();

      if (authError || !authData.user) {
        throw new Error('Debes iniciar sesión para comentar en el chat.');
      }

      const { data, error } = await client
        .from('chat_mensajes')
        .insert({
          user_id: authData.user.id,
          perfil_id: user.id,
          user_nick: user.gamertag || user.nombre_completo,
          rol: user.rol,
          mensaje: texto
        })
        .select('*')
        .single<ChatRow>();

      if (error) throw new Error(`No se pudo enviar el mensaje: ${error.message}`);
      return mapMessage(data);
    }

    const newMessage: ChatMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      user_id: user.id,
      user_nick: user.gamertag || user.nombre_completo,
      role: user.rol,
      is_admin: user.rol === 'admin',
      is_referee: user.rol === 'arbitro',
      mensaje: texto,
      created_at: new Date().toISOString()
    };

    const messages = await this.getMessages();
    messages.push(newMessage);
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));

    return newMessage;
  }
};
