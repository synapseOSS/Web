
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../components/icon.component';
import { SocialService, Chat } from '../services/social.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, IconComponent, FormsModule],
  template: `
    <div class="flex h-screen border-x border-slate-200 dark:border-white/10 overflow-hidden">
      <!-- Chat List (Sidebar) -->
      <div class="w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-slate-200 dark:border-white/10 flex flex-col bg-white dark:bg-slate-950"
           [class.hidden]="activeChat() && isMobile">
         
         <div class="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur z-10">
            <h1 class="text-xl font-bold text-slate-900 dark:text-white">Messages</h1>
            <button class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400">
               <app-icon name="plus" [size]="20"></app-icon>
            </button>
         </div>

         <div class="p-4">
            <div class="relative">
              <app-icon name="search" [size]="18" class="absolute left-3 top-3 text-slate-400"></app-icon>
              <input type="text" placeholder="Search Direct Messages" class="w-full pl-10 pr-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white">
            </div>
         </div>

         <div class="flex-1 overflow-y-auto">
            @for (chat of chats(); track chat.id) {
               <div (click)="selectChat(chat)" 
                    class="p-4 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors flex gap-3 items-center border-r-4 border-transparent"
                    [class.border-indigo-500]="activeChat()?.id === chat.id"
                    [class.bg-slate-50]="activeChat()?.id === chat.id"
                    [class.dark:bg-white/5]="activeChat()?.id === chat.id">
                  
                  <div class="relative">
                    <img [src]="chat.partner.avatar" class="w-12 h-12 rounded-full object-cover">
                    @if (chat.partner.is_online) {
                      <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-950"></div>
                    }
                  </div>
                  
                  <div class="flex-1 min-w-0">
                     <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                          {{ chat.partner.display_name }}
                          @if (chat.partner.verify) { <app-icon name="verified" [size]="14" class="text-indigo-500"></app-icon> }
                        </span>
                        <span class="text-xs text-slate-500">{{ chat.last_message_time }}</span>
                     </div>
                     <div class="flex justify-between items-center">
                        <span class="text-sm text-slate-500 truncate pr-2" [class.font-bold]="chat.unread_count > 0" [class.text-slate-900]="chat.unread_count > 0" [class.dark:text-white]="chat.unread_count > 0">
                          {{ chat.last_message }}
                        </span>
                        @if (chat.unread_count > 0) {
                          <div class="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                             {{ chat.unread_count }}
                          </div>
                        }
                     </div>
                  </div>
               </div>
            }
         </div>
      </div>

      <!-- Chat Window -->
      <div class="flex-1 flex flex-col bg-white dark:bg-slate-950 w-full"
           [class.hidden]="!activeChat() && isMobile">
        
        @if (activeChat()) {
          <!-- Chat Header -->
          <div class="p-3 border-b border-slate-200 dark:border-white/10 flex items-center gap-4 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur z-10">
             <button (click)="backToList()" class="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400">
                <app-icon name="chevron-left" [size]="24"></app-icon>
             </button>
             <div class="flex items-center gap-3">
                <img [src]="activeChat()?.partner?.avatar" class="w-10 h-10 rounded-full object-cover">
                <div>
                   <div class="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                     {{ activeChat()?.partner?.display_name }}
                     @if (activeChat()?.partner?.verify) { <app-icon name="verified" [size]="14" class="text-indigo-500"></app-icon> }
                   </div>
                   <div class="text-xs text-slate-500">
                      {{ activeChat()?.partner?.is_online ? 'Online' : '@' + activeChat()?.partner?.username }}
                   </div>
                </div>
             </div>
             <div class="ml-auto text-indigo-500">
                <app-icon name="more-horizontal" [size]="24"></app-icon>
             </div>
          </div>

          <!-- Messages Area -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
             @for (msg of messages(); track msg.id) {
                <div class="flex gap-3" [class.flex-row-reverse]="msg.is_me">
                   <div class="flex-shrink-0" [class.hidden]="msg.is_me">
                      <img [src]="activeChat()?.partner?.avatar" class="w-8 h-8 rounded-full object-cover">
                   </div>
                   <div class="max-w-[70%]">
                      <div class="px-4 py-2 rounded-2xl text-sm break-words"
                           [class.bg-indigo-600]="msg.is_me"
                           [class.text-white]="msg.is_me"
                           [class.rounded-br-none]="msg.is_me"
                           [class.bg-slate-100]="!msg.is_me"
                           [class.dark:bg-slate-800]="!msg.is_me"
                           [class.text-slate-900]="!msg.is_me"
                           [class.dark:text-white]="!msg.is_me"
                           [class.rounded-bl-none]="!msg.is_me">
                         {{ msg.content }}
                      </div>
                      <div class="text-[10px] text-slate-400 mt-1 px-1" [class.text-right]="msg.is_me">
                         {{ msg.created_at }}
                      </div>
                   </div>
                </div>
             }
          </div>

          <!-- Input Area -->
          <div class="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950">
             <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-2xl px-2 py-1">
                <button class="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-full transition-colors">
                   <app-icon name="image" [size]="20"></app-icon>
                </button>
                <button class="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-full transition-colors">
                   <app-icon name="smile" [size]="20"></app-icon>
                </button>
                <input type="text" placeholder="Start a new message" class="flex-1 bg-transparent border-none focus:ring-0 text-sm dark:text-white h-10">
                <button class="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-full transition-colors">
                   <app-icon name="send" [size]="20"></app-icon>
                </button>
             </div>
          </div>
        } @else {
           <div class="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <div class="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                 <app-icon name="mail" [size]="48" class="opacity-50"></app-icon>
              </div>
              <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Select a message</h2>
              <p>Choose from your existing conversations, start a new one, or get ready to swim in the neural stream.</p>
              <button class="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-500">
                 New Message
              </button>
           </div>
        }
      </div>
    </div>
  `
})
export class MessagesComponent {
  socialService = inject(SocialService);
  chats = this.socialService.chats;
  messages = this.socialService.messages;
  
  activeChat = signal<Chat | null>(null);
  isMobile = false;

  constructor() {
    this.checkScreen();
    window.addEventListener('resize', () => this.checkScreen());
  }

  checkScreen() {
    this.isMobile = window.innerWidth < 768;
  }

  selectChat(chat: Chat) {
    this.activeChat.set(chat);
  }

  backToList() {
    this.activeChat.set(null);
  }
}
