import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatResponse, ChatTurn, PdfQaService } from '../../core/services/pdf-qa.service';

interface ChatbotMessage {
  role: 'user' | 'assistant' | 'error';
  text: string;
  sources?: ChatResponse['sources'];
}

const WELCOME: ChatbotMessage = {
  role: 'assistant',
  text: "Hi! I'm your document assistant. Ask me anything about your company documents.",
};

@Component({
  imports: [FormsModule],
  selector: 'app-chatbot',
  styleUrl: './chatbot.component.scss',
  templateUrl: './chatbot.component.html',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class ChatbotComponent {
  private readonly pdfQa = inject(PdfQaService);
  private readonly chatScroll = viewChild<ElementRef<HTMLElement>>('chatScroll');
  private readonly input = viewChild<ElementRef<HTMLTextAreaElement>>('input');

  readonly quickReplies = ['What documents do I have?', 'Summarize everything', 'Find HR contacts'];

  readonly isOpen = signal(false);
  readonly messages = signal<ChatbotMessage[]>([WELCOME]);
  readonly draft = signal('');
  readonly isSending = signal(false);

  toggle(): void {
    this.isOpen.update((open) => !open);
    if (this.isOpen()) {
      this.scrollToBottom();
      setTimeout(() => this.input()?.nativeElement.focus());
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  clear(): void {
    this.messages.set([WELCOME]);
  }

  send(text?: string): void {
    const message = (text ?? this.draft()).trim();
    if (!message || this.isSending()) {
      return;
    }

    // Prior turns (excluding the welcome message and errors) give the backend context.
    const history: ChatTurn[] = this.messages()
      .filter((m): m is ChatbotMessage & ChatTurn => m !== WELCOME && m.role !== 'error')
      .map(({ role, text }) => ({ role, text }));

    this.push({ role: 'user', text: message });
    this.draft.set('');
    this.isSending.set(true);

    this.pdfQa.chat(message, history).subscribe({
      next: (res) => {
        this.push({ role: 'assistant', text: res.reply, sources: res.sources });
        this.isSending.set(false);
      },
      error: () => {
        this.push({ role: 'error', text: 'Something went wrong. Please try again.' });
        this.isSending.set(false);
      },
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private push(message: ChatbotMessage): void {
    this.messages.update((msgs) => [...msgs, message]);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.chatScroll()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
