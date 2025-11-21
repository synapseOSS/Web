import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatUser {
  uid: string;
  username: string;
  display_name: string;
  avatar: string;
  is_online?: boolean;
}

export interface Chat {
  id: string;
  chat_id: string;
  is_group: boolean;
  chat_name?: string;
  chat_avatar?: string;
  last_message?: string;
  last_message_time?: string;
  participants: ChatUser[];
  unread_count: number;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  media_url?: string;
  created_at: string;
  is_me: boolean;
  delivery_status: string;
  sender?: ChatUser;
}

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);
  
  chats = signal<Chat[]>([]);
  messages = signal<Message[]>([]);
  activeChat = signal<string | null>(null);
  typingUsers = signal<string[]>([]);
  
  private messageChannel?: RealtimeChannel;
  private presenceChannel?: RealtimeChannel;

  async fetchChats() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      const { data, error } = await this.supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chats:chat_id (
            id,
            chat_id,
            is_group,
            chat_name,
            chat_avatar,
            last_message,
            last_message_time
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const chatsWithParticipants = await Promise.all(
        (data || []).map(async (item: any) => {
          const participants = await this.fetchChatParticipants(item.chat_id);
          const unreadCount = await this.getUnreadCount(item.chat_id, userId);
          
          return {
            ...item.chats,
            participants,
            unread_count: unreadCount
          };
        })
      );

      this.chats.set(chatsWithParticipants);
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  }

  async fetchChatParticipants(chatId: string): Promise<ChatUser[]> {
    const { data, error } = await this.supabase
      .from('chat_participants')
      .select(`
        user_id,
        users:user_id (
          uid,
          username,
          display_name,
          avatar
        )
      `)
      .eq('chat_id', chatId);

    if (error) return [];
    return (data || []).map((p: any) => p.users);
  }

  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    const { data } = await this.supabase
      .from('chat_participants')
      .select('last_read_message_id')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single();

    if (!data?.last_read_message_id) return 0;

    const { count } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('chat_id', chatId)
      .gt('created_at', data.last_read_message_id);

    return count || 0;
  }

  async fetchMessages(chatId: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select(`
          *,
          users:sender_id (
            uid,
            username,
            display_name,
            avatar
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messages = (data || []).map((msg: any) => ({
        ...msg,
        is_me: msg.sender_id === userId,
        sender: msg.users
      }));

      this.messages.set(messages);
      this.activeChat.set(chatId);
      
      // Mark messages as read
      await this.markAsRead(chatId);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }

  async sendMessage(chatId: string, content: string, messageType: string = 'text') {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      const { error } = await this.supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: userId,
          content,
          message_type: messageType,
          delivery_status: 'sent'
        });

      if (error) throw error;

      // Update chat's last message
      await this.supabase
        .from('chats')
        .update({
          last_message: content,
          last_message_time: new Date().toISOString(),
          last_message_sender: userId
        })
        .eq('chat_id', chatId);

      await this.fetchMessages(chatId);
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }

  async createChat(participantIds: string[], isGroup: boolean = false, chatName?: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error: chatError } = await this.supabase
        .from('chats')
        .insert({
          chat_id: chatId,
          is_group: isGroup,
          chat_name: chatName,
          created_by: userId,
          participants_count: participantIds.length + 1
        });

      if (chatError) throw chatError;

      // Add participants
      const participants = [userId, ...participantIds].map(uid => ({
        chat_id: chatId,
        user_id: uid,
        role: uid === userId ? 'admin' : 'member'
      }));

      const { error: participantsError } = await this.supabase
        .from('chat_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      await this.fetchChats();
      return chatId;
    } catch (err) {
      console.error('Error creating chat:', err);
      throw err;
    }
  }

  async markAsRead(chatId: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const lastMessage = this.messages()[this.messages().length - 1];
    if (!lastMessage) return;

    await this.supabase
      .from('chat_participants')
      .update({
        last_read_message_id: lastMessage.id,
        last_read_at: new Date().toISOString()
      })
      .eq('chat_id', chatId)
      .eq('user_id', userId);
  }

  setupRealtimeMessages(chatId: string) {
    this.messageChannel?.unsubscribe();
    
    this.messageChannel = this.supabase
      .channel(`messages:${chatId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        () => this.fetchMessages(chatId)
      )
      .subscribe();
  }

  setupPresence(chatId: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.presenceChannel?.unsubscribe();
    
    this.presenceChannel = this.supabase
      .channel(`presence:${chatId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = this.presenceChannel?.presenceState();
        console.log('Presence state:', state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.presenceChannel?.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });
  }

  async setTypingStatus(chatId: string, isTyping: boolean) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    await this.supabase
      .from('typing_status')
      .upsert({
        chat_id: chatId,
        user_id: userId,
        is_typing: isTyping,
        timestamp: Date.now()
      });
  }

  cleanup() {
    this.messageChannel?.unsubscribe();
    this.presenceChannel?.unsubscribe();
  }
}
