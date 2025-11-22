import { Component, inject, signal, computed, ViewChild, ElementRef, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon.component';
import { StoryService, StoryCreationOptions, StoryPrivacySettings, PrivacySetting } from '../services/story.service';
import { InteractiveElementService, PollData, QuestionData, CountdownData, LinkData } from '../services/interactive-element.service';
import { MentionService } from '../services/mention.service';
import { LocationService } from '../services/location.service';
import { AuthService } from '../services/auth.service';

interface TextOverlay {
  text: string;
  font: string;
  color: string;
  size: number;
  position: { x: number; y: number };
  rotation: number;
}

interface Filter {
  name: string;
  cssFilter: string;
}

interface InteractiveElementUI {
  type: 'poll' | 'question' | 'countdown' | 'link';
  data: any;
  position: { x: number; y: number };
}

@Component({
  selector: 'app-story-creator',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 bg-black flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <button (click)="cancel()" class="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
          <app-icon name="x" [size]="24"></app-icon>
        </button>
        <h1 class="text-white font-bold text-lg">Create Story</h1>
        <button 
          (click)="publish()" 
          [disabled]="!mediaFile() || isUploading()"
          class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-full transition-all">
          {{ isUploading() ? 'Publishing...' : 'Publish' }}
        </button>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex items-center justify-center relative overflow-hidden">
        @if (!mediaFile()) {
          <!-- Upload Area -->
          <div class="text-center">
            <label class="cursor-pointer">
              <input 
                type="file" 
                accept="image/*,video/*" 
                class="hidden" 
                (change)="onFileSelected($event)">
              <div class="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-white/30 rounded-2xl hover:border-white/50 transition-colors">
                <app-icon name="image" [size]="64" class="text-white/50"></app-icon>
                <div class="text-white">
                  <p class="font-bold text-xl mb-2">Add Photo or Video</p>
                  <p class="text-sm text-white/70">Drag and drop or click to browse</p>
                  <p class="text-xs text-white/50 mt-2">Max 100MB • Images & Videos</p>
                </div>
              </div>
            </label>
          </div>
        } @else {
          <!-- Media Preview with Overlays -->
          <div class="relative w-full h-full flex items-center justify-center">
            @if (mediaType() === 'image') {
              <img 
                [src]="mediaPreview()" 
                [style.filter]="selectedFilter()?.cssFilter"
                class="max-w-full max-h-full object-contain"
                alt="Story preview">
            } @else {
              <video 
                [src]="mediaPreview()" 
                [style.filter]="selectedFilter()?.cssFilter"
                class="max-w-full max-h-full object-contain"
                controls
                #videoElement>
              </video>
            }

            <!-- Text Overlays -->
            @for (overlay of textOverlays(); track $index) {
              <div 
                class="absolute cursor-move select-none"
                [style.left.%]="overlay.position.x"
                [style.top.%]="overlay.position.y"
                [style.transform]="'rotate(' + overlay.rotation + 'deg)'"
                [style.font-family]="overlay.font"
                [style.color]="overlay.color"
                [style.font-size.px]="overlay.size"
                [style.text-shadow]="'2px 2px 4px rgba(0,0,0,0.8)'"
                (mousedown)="startDraggingOverlay($index, $event)">
                {{ overlay.text }}
              </div>
            }

            <!-- Interactive Elements Preview -->
            @for (element of interactiveElements(); track $index) {
              <div 
                class="absolute cursor-move"
                [style.left.%]="element.position.x"
                [style.top.%]="element.position.y"
                (mousedown)="startDraggingElement($index, $event)">
                @switch (element.type) {
                  @case ('poll') {
                    <div class="bg-white/90 backdrop-blur-sm rounded-xl p-4 min-w-[200px] shadow-lg">
                      <p class="font-bold text-sm mb-2">{{ element.data.question }}</p>
                      @for (option of element.data.options; track $index) {
                        <div class="py-2 px-3 bg-slate-100 rounded-lg text-sm mb-1">{{ option }}</div>
                      }
                    </div>
                  }
                  @case ('question') {
                    <div class="bg-white/90 backdrop-blur-sm rounded-xl p-4 min-w-[200px] shadow-lg">
                      <p class="font-bold text-sm mb-2">{{ element.data.question }}</p>
                      <input type="text" [placeholder]="element.data.placeholder || 'Type your answer...'" 
                        class="w-full px-3 py-2 bg-slate-100 rounded-lg text-sm" disabled>
                    </div>
                  }
                  @case ('countdown') {
                    <div class="bg-white/90 backdrop-blur-sm rounded-xl p-4 min-w-[150px] shadow-lg text-center">
                      <p class="font-bold text-sm mb-1">{{ element.data.title }}</p>
                      <p class="text-2xl font-bold text-indigo-600">00:00:00</p>
                    </div>
                  }
                  @case ('link') {
                    <div class="bg-white/90 backdrop-blur-sm rounded-xl p-3 min-w-[150px] shadow-lg">
                      <div class="flex items-center gap-2">
                        <app-icon name="link" [size]="16" class="text-indigo-600"></app-icon>
                        <span class="text-sm font-medium truncate">{{ element.data.title || 'Link' }}</span>
                      </div>
                    </div>
                  }
                }
              </div>
            }

            <!-- Mention Tags -->
            @for (mention of mentions(); track $index) {
              <div 
                class="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <app-icon name="at-sign" [size]="14"></app-icon>
                <span>{{ mention.username }}</span>
              </div>
            }
          </div>
        }
      </div>

      <!-- Bottom Toolbar -->
      @if (mediaFile()) {
        <div class="bg-black/50 backdrop-blur-sm p-4">
          <!-- Tool Selection -->
          <div class="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            <button 
              (click)="showTextEditor.set(true)"
              class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors whitespace-nowrap">
              <app-icon name="type" [size]="20"></app-icon>
              <span class="text-sm font-medium">Text</span>
            </button>

            <button 
              (click)="showFilterSelector.set(true)"
              class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors whitespace-nowrap">
              <app-icon name="sliders" [size]="20"></app-icon>
              <span class="text-sm font-medium">Filters</span>
              @if (selectedFilter()) {
                <span class="px-2 py-0.5 bg-indigo-500 text-xs rounded-full">✓</span>
              }
            </button>

            <button 
              (click)="showPollCreator.set(true)"
              class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors whitespace-nowrap">
              <app-icon name="bar-chart" [size]="20"></app-icon>
              <span class="text-sm font-medium">Poll</span>
            </button>

            <button 
              (click)="showQuestionCreator.set(true)"
              class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors whitespace-nowrap">
              <app-icon name="help-circle" [size]="20"></app-icon>
              <span class="text-sm font-medium">Question</span>
            </button>

            <button 
              (click)="showCountdownCreator.set(true)"
              class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors whitespace-nowrap">
              <app-icon name="clock" [size]="20"></app-icon>
              <span class="text-sm font-medium">Countdown</span>
            </button>

            <button 
              (click)="showLinkCreator.set(true)"
              class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors whitespace-nowrap">
              <app-icon name="link" [size]="20"></app-icon>
              <span class="text-sm font-medium">Link</span>
            </button>

            <button 
              (click)="showMentionPicker.set(true)"
              class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors whitespace-nowrap">
              <app-icon name="at-sign" [size]="20"></app-icon>
              <span class="text-sm font-medium">Mention</span>
              @if (mentions().length > 0) {
                <span class="px-2 py-0.5 bg-indigo-500 text-xs rounded-full">{{ mentions().length }}</span>
              }
            </button>

            <button 
              (click)="showLocationPicker.set(true)"
              class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors whitespace-nowrap">
              <app-icon name="map-pin" [size]="20"></app-icon>
              <span class="text-sm font-medium">Location</span>
              @if (location()) {
                <span class="px-2 py-0.5 bg-indigo-500 text-xs rounded-full">✓</span>
              }
            </button>

            <button 
              (click)="showPrivacySelector.set(true)"
              class="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors whitespace-nowrap">
              @switch (privacy().privacy_setting) {
                @case ('public') {
                  <app-icon name="globe" [size]="20"></app-icon>
                }
                @case ('followers') {
                  <app-icon name="users" [size]="20"></app-icon>
                }
                @case ('close_friends') {
                  <app-icon name="star" [size]="20"></app-icon>
                }
                @case ('custom') {
                  <app-icon name="lock" [size]="20"></app-icon>
                }
              }
              <span class="text-sm font-medium capitalize">{{ privacy().privacy_setting.replace('_', ' ') }}</span>
            </button>
          </div>

          <!-- Duration Selector -->
          <div class="flex items-center gap-3">
            <span class="text-white text-sm font-medium">Duration:</span>
            <select 
              [(ngModel)]="duration"
              class="px-3 py-2 bg-white/10 text-white border border-white/20 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none">
              <option [value]="1">1 hour</option>
              <option [value]="6">6 hours</option>
              <option [value]="12">12 hours</option>
              <option [value]="24">24 hours</option>
              <option [value]="48">2 days</option>
              <option [value]="72">3 days</option>
              <option [value]="168">7 days</option>
            </select>
          </div>
        </div>
      }

      <!-- Text Editor Modal -->
      @if (showTextEditor()) {
        <div class="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm" (click)="showTextEditor.set(false)">
          <div class="bg-white dark:bg-slate-900 rounded-t-3xl w-full p-6 animate-slide-up" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg text-slate-900 dark:text-white">Add Text</h3>
              <button (click)="showTextEditor.set(false)" class="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <app-icon name="x" [size]="24"></app-icon>
              </button>
            </div>

            <textarea 
              [(ngModel)]="currentText"
              placeholder="Type your text..."
              rows="3"
              maxlength="100"
              class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none mb-4">
            </textarea>

            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Font</label>
                <select 
                  [(ngModel)]="currentFont"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg focus:border-indigo-500 outline-none">
                  <option value="Arial">Arial</option>
                  <option value="'Courier New'">Courier</option>
                  <option value="Georgia">Georgia</option>
                  <option value="'Times New Roman'">Times</option>
                  <option value="Verdana">Verdana</option>
                  <option value="'Comic Sans MS'">Comic Sans</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Size</label>
                <input 
                  type="range" 
                  [(ngModel)]="currentSize"
                  min="16" 
                  max="72" 
                  class="w-full">
                <span class="text-sm text-slate-500">{{ currentSize }}px</span>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
              <div class="flex gap-2 flex-wrap">
                @for (color of textColors; track color) {
                  <button 
                    (click)="currentColor = color"
                    [class.ring-2]="currentColor === color"
                    [class.ring-indigo-500]="currentColor === color"
                    [style.background-color]="color"
                    class="w-10 h-10 rounded-full border-2 border-white shadow-md">
                  </button>
                }
              </div>
            </div>

            <button 
              (click)="addTextOverlay()"
              [disabled]="!currentText.trim()"
              class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors">
              Add Text
            </button>
          </div>
        </div>
      }

      <!-- Filter Selector Modal -->
      @if (showFilterSelector()) {
        <div class="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm" (click)="showFilterSelector.set(false)">
          <div class="bg-white dark:bg-slate-900 rounded-t-3xl w-full p-6 max-h-[70vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg text-slate-900 dark:text-white">Filters</h3>
              <button (click)="showFilterSelector.set(false)" class="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <app-icon name="x" [size]="24"></app-icon>
              </button>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <button 
                (click)="selectFilter(null)"
                [class.ring-2]="!selectedFilter()"
                [class.ring-indigo-500]="!selectedFilter()"
                class="aspect-square rounded-xl overflow-hidden border-2 border-slate-200 dark:border-white/10">
                <div class="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                  <span class="text-sm font-medium">None</span>
                </div>
              </button>

              @for (filter of filters; track filter.name) {
                <button 
                  (click)="selectFilter(filter)"
                  [class.ring-2]="selectedFilter()?.name === filter.name"
                  [class.ring-indigo-500]="selectedFilter()?.name === filter.name"
                  class="aspect-square rounded-xl overflow-hidden border-2 border-slate-200 dark:border-white/10 relative">
                  @if (mediaPreview()) {
                    <img [src]="mediaPreview()" [style.filter]="filter.cssFilter" class="w-full h-full object-cover">
                  }
                  <div class="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs font-medium py-1 text-center">
                    {{ filter.name }}
                  </div>
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Poll Creator Modal -->
      @if (showPollCreator()) {
        <div class="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm" (click)="showPollCreator.set(false)">
          <div class="bg-white dark:bg-slate-900 rounded-t-3xl w-full p-6" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg text-slate-900 dark:text-white">Create Poll</h3>
              <button (click)="showPollCreator.set(false)" class="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <app-icon name="x" [size]="24"></app-icon>
              </button>
            </div>

            <input 
              [(ngModel)]="pollQuestion"
              type="text" 
              placeholder="Ask a question..."
              maxlength="200"
              class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none mb-4">

            <div class="space-y-2 mb-4">
              @for (option of pollOptions(); track $index; let i = $index) {
                <div class="flex gap-2">
                  <input 
                    [value]="option"
                    (input)="updatePollOption(i, $any($event.target).value)"
                    type="text" 
                    [placeholder]="'Option ' + (i + 1)"
                    maxlength="50"
                    class="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg focus:border-indigo-500 outline-none">
                  @if (pollOptions().length > 2) {
                    <button 
                      (click)="removePollOption(i)"
                      class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg">
                      <app-icon name="trash" [size]="18"></app-icon>
                    </button>
                  }
                </div>
              }
            </div>

            @if (pollOptions().length < 4) {
              <button 
                (click)="addPollOption()"
                class="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 mb-4">
                <app-icon name="plus" [size]="16"></app-icon>
                Add option
              </button>
            }

            <button 
              (click)="createPoll()"
              [disabled]="!pollQuestion.trim() || validPollOptionsCount() < 2"
              class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors">
              Add Poll
            </button>
          </div>
        </div>
      }

      <!-- Question Creator Modal -->
      @if (showQuestionCreator()) {
        <div class="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm" (click)="showQuestionCreator.set(false)">
          <div class="bg-white dark:bg-slate-900 rounded-t-3xl w-full p-6" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg text-slate-900 dark:text-white">Ask a Question</h3>
              <button (click)="showQuestionCreator.set(false)" class="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <app-icon name="x" [size]="24"></app-icon>
              </button>
            </div>

            <input 
              [(ngModel)]="questionText"
              type="text" 
              placeholder="Ask your followers..."
              maxlength="200"
              class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none mb-4">

            <input 
              [(ngModel)]="questionPlaceholder"
              type="text" 
              placeholder="Placeholder text (optional)"
              maxlength="100"
              class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none mb-4">

            <button 
              (click)="createQuestion()"
              [disabled]="!questionText.trim()"
              class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors">
              Add Question
            </button>
          </div>
        </div>
      }

      <!-- Countdown Creator Modal -->
      @if (showCountdownCreator()) {
        <div class="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm" (click)="showCountdownCreator.set(false)">
          <div class="bg-white dark:bg-slate-900 rounded-t-3xl w-full p-6" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg text-slate-900 dark:text-white">Add Countdown</h3>
              <button (click)="showCountdownCreator.set(false)" class="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <app-icon name="x" [size]="24"></app-icon>
              </button>
            </div>

            <input 
              [(ngModel)]="countdownTitle"
              type="text" 
              placeholder="Countdown title..."
              maxlength="50"
              class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none mb-4">

            <input 
              [(ngModel)]="countdownDate"
              type="datetime-local" 
              class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none mb-4">

            <button 
              (click)="createCountdown()"
              [disabled]="!countdownTitle.trim() || !countdownDate"
              class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors">
              Add Countdown
            </button>
          </div>
        </div>
      }

      <!-- Link Creator Modal -->
      @if (showLinkCreator()) {
        <div class="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm" (click)="showLinkCreator.set(false)">
          <div class="bg-white dark:bg-slate-900 rounded-t-3xl w-full p-6" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg text-slate-900 dark:text-white">Add Link</h3>
              <button (click)="showLinkCreator.set(false)" class="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <app-icon name="x" [size]="24"></app-icon>
              </button>
            </div>

            <input 
              [(ngModel)]="linkUrl"
              type="url" 
              placeholder="https://example.com"
              class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none mb-4">

            <input 
              [(ngModel)]="linkTitle"
              type="text" 
              placeholder="Link title (optional)"
              maxlength="50"
              class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none mb-4">

            <button 
              (click)="createLink()"
              [disabled]="!linkUrl.trim()"
              class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors">
              Add Link
            </button>
          </div>
        </div>
      }

      <!-- Mention Picker Modal -->
      @if (showMentionPicker()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="showMentionPicker.set(false)">
          <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10" (click)="$event.stopPropagation()">
            <div class="p-4 border-b border-slate-200 dark:border-white/10">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-lg text-slate-900 dark:text-white">Mention People</h3>
                <button (click)="showMentionPicker.set(false)" class="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                  <app-icon name="x" [size]="24"></app-icon>
                </button>
              </div>
              <div class="relative">
                <app-icon name="search" [size]="18" class="absolute left-3 top-3 text-slate-400"></app-icon>
                <input 
                  [(ngModel)]="mentionSearch"
                  (input)="searchUsers()"
                  type="text" 
                  placeholder="Search users..."
                  class="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none">
              </div>
            </div>
            <div class="max-h-96 overflow-y-auto p-2">
              @if (mentionSearch) {
                @for (user of userSearchResults(); track user.uid) {
                  <div 
                    (click)="addMention(user)"
                    class="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                    <div class="flex items-center gap-3">
                      <img [src]="user.avatar" class="w-10 h-10 rounded-full">
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-slate-900 dark:text-white">{{ user.display_name }}</div>
                        <div class="text-sm text-slate-500">@{{ user.username }}</div>
                      </div>
                      @if (isMentioned(user.uid)) {
                        <app-icon name="check" [size]="20" class="text-green-500"></app-icon>
                      }
                    </div>
                  </div>
                }
              } @else {
                <div class="p-8 text-center text-slate-500">
                  <app-icon name="users" [size]="48" class="mx-auto mb-4 opacity-50"></app-icon>
                  <p>Search for people to mention</p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Location Picker Modal -->
      @if (showLocationPicker()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="showLocationPicker.set(false)">
          <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10" (click)="$event.stopPropagation()">
            <div class="p-4 border-b border-slate-200 dark:border-white/10">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-lg text-slate-900 dark:text-white">Add Location</h3>
                <button (click)="showLocationPicker.set(false)" class="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                  <app-icon name="x" [size]="24"></app-icon>
                </button>
              </div>
              <div class="relative">
                <app-icon name="search" [size]="18" class="absolute left-3 top-3 text-slate-400"></app-icon>
                <input 
                  [(ngModel)]="locationSearch"
                  (input)="searchLocations()"
                  type="text" 
                  placeholder="Search for a location..."
                  class="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none">
              </div>
            </div>
            <div class="max-h-96 overflow-y-auto p-2">
              @if (locationSearch) {
                @for (loc of locationSearchResults(); track $index) {
                  <div 
                    (click)="selectLocation(loc)"
                    class="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                    <div class="flex items-start gap-3">
                      <app-icon name="map-pin" [size]="20" class="text-indigo-500 mt-0.5"></app-icon>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-slate-900 dark:text-white">{{ loc.name }}</div>
                        @if (loc.address) {
                          <div class="text-sm text-slate-500 truncate">{{ loc.address }}</div>
                        }
                      </div>
                    </div>
                  </div>
                }
              } @else {
                <div class="p-8 text-center text-slate-500">
                  <app-icon name="map-pin" [size]="48" class="mx-auto mb-4 opacity-50"></app-icon>
                  <p>Search for a location to add</p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Privacy Selector Modal -->
      @if (showPrivacySelector()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="showPrivacySelector.set(false)">
          <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10" (click)="$event.stopPropagation()">
            <div class="p-4 border-b border-slate-200 dark:border-white/10">
              <h3 class="font-bold text-lg text-slate-900 dark:text-white">Story Privacy</h3>
            </div>
            <div class="p-2">
              <div 
                (click)="setPrivacy('public')"
                class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                [class.bg-indigo-50]="privacy().privacy_setting === 'public'"
                [class.dark:bg-indigo-950/30]="privacy().privacy_setting === 'public'">
                <div class="flex items-start gap-3">
                  <app-icon name="globe" [size]="24" class="text-indigo-500 mt-0.5"></app-icon>
                  <div class="flex-1">
                    <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Public
                      @if (privacy().privacy_setting === 'public') {
                        <app-icon name="check" [size]="18" class="text-indigo-500"></app-icon>
                      }
                    </div>
                    <div class="text-sm text-slate-500 mt-1">Anyone can see this story</div>
                  </div>
                </div>
              </div>

              <div 
                (click)="setPrivacy('followers')"
                class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                [class.bg-indigo-50]="privacy().privacy_setting === 'followers'"
                [class.dark:bg-indigo-950/30]="privacy().privacy_setting === 'followers'">
                <div class="flex items-start gap-3">
                  <app-icon name="users" [size]="24" class="text-indigo-500 mt-0.5"></app-icon>
                  <div class="flex-1">
                    <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Followers
                      @if (privacy().privacy_setting === 'followers') {
                        <app-icon name="check" [size]="18" class="text-indigo-500"></app-icon>
                      }
                    </div>
                    <div class="text-sm text-slate-500 mt-1">Only your followers can see this story</div>
                  </div>
                </div>
              </div>

              <div 
                (click)="setPrivacy('close_friends')"
                class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                [class.bg-indigo-50]="privacy().privacy_setting === 'close_friends'"
                [class.dark:bg-indigo-950/30]="privacy().privacy_setting === 'close_friends'">
                <div class="flex items-start gap-3">
                  <app-icon name="star" [size]="24" class="text-indigo-500 mt-0.5"></app-icon>
                  <div class="flex-1">
                    <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Close Friends
                      @if (privacy().privacy_setting === 'close_friends') {
                        <app-icon name="check" [size]="18" class="text-indigo-500"></app-icon>
                      }
                    </div>
                    <div class="text-sm text-slate-500 mt-1">Only your close friends can see this story</div>
                  </div>
                </div>
              </div>

              <div 
                (click)="setPrivacy('custom')"
                class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                [class.bg-indigo-50]="privacy().privacy_setting === 'custom'"
                [class.dark:bg-indigo-950/30]="privacy().privacy_setting === 'custom'">
                <div class="flex items-start gap-3">
                  <app-icon name="lock" [size]="24" class="text-indigo-500 mt-0.5"></app-icon>
                  <div class="flex-1">
                    <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Custom
                      @if (privacy().privacy_setting === 'custom') {
                        <app-icon name="check" [size]="18" class="text-indigo-500"></app-icon>
                      }
                    </div>
                    <div class="text-sm text-slate-500 mt-1">Only specific people can see this story</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Upload Progress -->
      @if (isUploading()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm">
            <div class="flex items-center gap-3 mb-4">
              <div class="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
              <span class="font-medium text-slate-900 dark:text-white">Publishing your story...</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300" [style.width.%]="uploadProgress()"></div>
            </div>
            <p class="text-sm text-slate-500 mt-2 text-center">{{ uploadProgress() }}%</p>
          </div>
        </div>
      }
    </div>
  `
})
export class StoryCreatorComponent {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  private storyService = inject(StoryService);
  private interactiveService = inject(InteractiveElementService);
  private mentionService = inject(MentionService);
  private locationService = inject(LocationService);
  private auth = inject(AuthService);

  // Outputs
  storyCreated = output<void>();
  cancelled = output<void>();

  // Media state
  mediaFile = signal<File | null>(null);
  mediaPreview = signal<string>('');
  mediaType = signal<'image' | 'video'>('image');

  // Text overlays
  textOverlays = signal<TextOverlay[]>([]);
  currentText = '';
  currentFont = 'Arial';
  currentColor = '#FFFFFF';
  currentSize = 32;
  textColors = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

  // Filters
  selectedFilter = signal<Filter | null>(null);
  filters: Filter[] = [
    { name: 'Grayscale', cssFilter: 'grayscale(100%)' },
    { name: 'Sepia', cssFilter: 'sepia(100%)' },
    { name: 'Vintage', cssFilter: 'sepia(50%) contrast(120%) brightness(90%)' },
    { name: 'Bright', cssFilter: 'brightness(130%) contrast(110%)' },
    { name: 'Dark', cssFilter: 'brightness(70%) contrast(120%)' },
    { name: 'Cool', cssFilter: 'hue-rotate(180deg) saturate(120%)' },
    { name: 'Warm', cssFilter: 'sepia(30%) saturate(150%)' },
    { name: 'Vivid', cssFilter: 'saturate(200%) contrast(120%)' },
    { name: 'Fade', cssFilter: 'opacity(80%) brightness(110%)' },
  ];

  // Interactive elements
  interactiveElements = signal<InteractiveElementUI[]>([]);
  
  // Poll
  pollQuestion = '';
  pollOptions = signal<string[]>(['', '']);
  validPollOptionsCount = computed(() => this.pollOptions().filter(o => o.trim()).length);
  
  // Question
  questionText = '';
  questionPlaceholder = '';
  
  // Countdown
  countdownTitle = '';
  countdownDate = '';
  
  // Link
  linkUrl = '';
  linkTitle = '';

  // Mentions
  mentions = signal<{ uid: string; username: string; display_name: string; avatar: string }[]>([]);
  mentionSearch = '';
  userSearchResults = signal<any[]>([]);

  // Location
  location = signal<{ name: string; address?: string; latitude?: number; longitude?: number } | null>(null);
  locationSearch = '';
  locationSearchResults = signal<any[]>([]);

  // Privacy
  privacy = signal<StoryPrivacySettings>({
    privacy_setting: 'followers'
  });

  // Duration
  duration = 24;

  // UI state
  showTextEditor = signal(false);
  showFilterSelector = signal(false);
  showPollCreator = signal(false);
  showQuestionCreator = signal(false);
  showCountdownCreator = signal(false);
  showLinkCreator = signal(false);
  showMentionPicker = signal(false);
  showLocationPicker = signal(false);
  showPrivacySelector = signal(false);
  isUploading = signal(false);
  uploadProgress = signal(0);

  // Drag state
  private draggingOverlayIndex: number | null = null;
  private draggingElementIndex: number | null = null;
  private dragStartX = 0;
  private dragStartY = 0;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Validate file
    try {
      this.validateFile(file);
    } catch (err: any) {
      alert(err.message);
      return;
    }

    this.mediaFile.set(file);
    this.mediaType.set(file.type.startsWith('video') ? 'video' : 'image');

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      this.mediaPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  private validateFile(file: File): void {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'];

    if (file.size > maxSize) {
      throw new Error('File size exceeds 100MB limit');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, MOV, WebM');
    }
  }

  addTextOverlay() {
    if (!this.currentText.trim()) return;

    const overlay: TextOverlay = {
      text: this.currentText,
      font: this.currentFont,
      color: this.currentColor,
      size: this.currentSize,
      position: { x: 50, y: 50 }, // Center
      rotation: 0
    };

    this.textOverlays.update(overlays => [...overlays, overlay]);
    this.currentText = '';
    this.showTextEditor.set(false);
  }

  selectFilter(filter: Filter | null) {
    this.selectedFilter.set(filter);
    this.showFilterSelector.set(false);
  }

  addPollOption() {
    if (this.pollOptions().length >= 4) return;
    this.pollOptions.update(opts => [...opts, '']);
  }

  updatePollOption(index: number, value: string) {
    this.pollOptions.update(opts => {
      const newOpts = [...opts];
      newOpts[index] = value;
      return newOpts;
    });
  }

  removePollOption(index: number) {
    if (this.pollOptions().length <= 2) return;
    this.pollOptions.update(opts => opts.filter((_, i) => i !== index));
  }

  createPoll() {
    const validOptions = this.pollOptions().filter(o => o.trim());
    if (!this.pollQuestion.trim() || validOptions.length < 2) return;

    try {
      const pollData: PollData = {
        question: this.pollQuestion,
        options: validOptions
      };

      this.interactiveService.validateElement('poll', pollData);

      this.interactiveElements.update(elements => [
        ...elements,
        {
          type: 'poll',
          data: pollData,
          position: { x: 50, y: 70 }
        }
      ]);

      this.pollQuestion = '';
      this.pollOptions.set(['', '']);
      this.showPollCreator.set(false);
    } catch (err: any) {
      alert(err.message);
    }
  }

  createQuestion() {
    if (!this.questionText.trim()) return;

    try {
      const questionData: QuestionData = {
        question: this.questionText,
        placeholder: this.questionPlaceholder || undefined
      };

      this.interactiveService.validateElement('question', questionData);

      this.interactiveElements.update(elements => [
        ...elements,
        {
          type: 'question',
          data: questionData,
          position: { x: 50, y: 70 }
        }
      ]);

      this.questionText = '';
      this.questionPlaceholder = '';
      this.showQuestionCreator.set(false);
    } catch (err: any) {
      alert(err.message);
    }
  }

  createCountdown() {
    if (!this.countdownTitle.trim() || !this.countdownDate) return;

    try {
      const countdownData: CountdownData = {
        title: this.countdownTitle,
        target_date: new Date(this.countdownDate).toISOString()
      };

      this.interactiveService.validateElement('countdown', countdownData);

      this.interactiveElements.update(elements => [
        ...elements,
        {
          type: 'countdown',
          data: countdownData,
          position: { x: 50, y: 70 }
        }
      ]);

      this.countdownTitle = '';
      this.countdownDate = '';
      this.showCountdownCreator.set(false);
    } catch (err: any) {
      alert(err.message);
    }
  }

  createLink() {
    if (!this.linkUrl.trim()) return;

    try {
      const linkData: LinkData = {
        url: this.linkUrl,
        title: this.linkTitle || undefined
      };

      this.interactiveService.validateElement('link', linkData);

      this.interactiveElements.update(elements => [
        ...elements,
        {
          type: 'link',
          data: linkData,
          position: { x: 50, y: 80 }
        }
      ]);

      this.linkUrl = '';
      this.linkTitle = '';
      this.showLinkCreator.set(false);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async searchUsers() {
    if (!this.mentionSearch.trim()) {
      this.userSearchResults.set([]);
      return;
    }

    try {
      const users = await this.mentionService.searchUsers(this.mentionSearch);
      this.userSearchResults.set(users);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  }

  addMention(user: any) {
    const alreadyMentioned = this.mentions().some(m => m.uid === user.uid);
    if (alreadyMentioned) {
      this.mentions.update(m => m.filter(mention => mention.uid !== user.uid));
    } else {
      this.mentions.update(m => [...m, user]);
    }
  }

  isMentioned(userId: string): boolean {
    return this.mentions().some(m => m.uid === userId);
  }

  async searchLocations() {
    if (!this.locationSearch.trim()) {
      this.locationSearchResults.set([]);
      return;
    }

    try {
      const locations = await this.locationService.searchByLocation(this.locationSearch);
      this.locationSearchResults.set(locations);
    } catch (err) {
      console.error('Error searching locations:', err);
    }
  }

  selectLocation(loc: any) {
    this.location.set(loc);
    this.showLocationPicker.set(false);
  }

  setPrivacy(setting: PrivacySetting) {
    this.privacy.update(p => ({ ...p, privacy_setting: setting }));
    this.showPrivacySelector.set(false);
  }

  startDraggingOverlay(index: number, event: MouseEvent) {
    this.draggingOverlayIndex = index;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  startDraggingElement(index: number, event: MouseEvent) {
    this.draggingElementIndex = index;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  private onMouseMove = (event: MouseEvent) => {
    if (this.draggingOverlayIndex !== null) {
      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;
      
      this.textOverlays.update(overlays => {
        const newOverlays = [...overlays];
        newOverlays[this.draggingOverlayIndex!].position.x += deltaX / 10;
        newOverlays[this.draggingOverlayIndex!].position.y += deltaY / 10;
        return newOverlays;
      });

      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
    } else if (this.draggingElementIndex !== null) {
      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;
      
      this.interactiveElements.update(elements => {
        const newElements = [...elements];
        newElements[this.draggingElementIndex!].position.x += deltaX / 10;
        newElements[this.draggingElementIndex!].position.y += deltaY / 10;
        return newElements;
      });

      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
    }
  };

  private onMouseUp = () => {
    this.draggingOverlayIndex = null;
    this.draggingElementIndex = null;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  async publish() {
    if (!this.mediaFile() || this.isUploading()) return;

    this.isUploading.set(true);
    this.uploadProgress.set(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        this.uploadProgress.update(p => Math.min(p + 10, 90));
      }, 200);

      // Prepare interactive elements
      const elements = this.interactiveElements().map(el => ({
        element_type: el.type,
        element_data: el.data,
        position_x: el.position.x / 100,
        position_y: el.position.y / 100
      }));

      // Prepare story creation options
      const options: StoryCreationOptions = {
        media: this.mediaFile()!,
        content: this.textOverlays().map(o => o.text).join('\n'),
        privacy: this.privacy(),
        duration_hours: this.duration,
        interactive_elements: elements,
        mentions: this.mentions().map(m => m.uid),
        location: this.location()?.name
      };

      await this.storyService.createStory(options);

      clearInterval(progressInterval);
      this.uploadProgress.set(100);

      setTimeout(() => {
        this.storyCreated.emit();
        this.reset();
      }, 500);
    } catch (err: any) {
      console.error('Error publishing story:', err);
      alert(err.message || 'Failed to publish story. Please try again.');
    } finally {
      this.isUploading.set(false);
      this.uploadProgress.set(0);
    }
  }

  cancel() {
    if (confirm('Discard this story?')) {
      this.cancelled.emit();
      this.reset();
    }
  }

  private reset() {
    this.mediaFile.set(null);
    this.mediaPreview.set('');
    this.textOverlays.set([]);
    this.selectedFilter.set(null);
    this.interactiveElements.set([]);
    this.mentions.set([]);
    this.location.set(null);
    this.privacy.set({ privacy_setting: 'followers' });
    this.duration = 24;
  }
}
