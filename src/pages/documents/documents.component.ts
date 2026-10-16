import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PdfQaService, UploadedDocument, errorMessage } from '../../core/services/pdf-qa.service';

interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  text: string;
  sources?: { page: number; snippet: string }[];
}

const MAX_FILE_SIZE_MB = 20;

@Component({
  imports: [FormsModule, DatePipe, DecimalPipe],
  selector: 'app-documents',
  templateUrl: './documents.component.html',
})
export class DocumentsComponent {
  private readonly pdfQa = inject(PdfQaService);
  private readonly chatScroll = viewChild<ElementRef<HTMLElement>>('chatScroll');

  readonly suggestions = [
    'Summarize this document',
    'What is the leave policy?',
    'Who should I contact for HR queries?',
    'List the key deadlines mentioned',
  ];

  readonly documents = signal<UploadedDocument[]>([]);
  readonly activeDocId = signal<string | null>(null);
  readonly activeDoc = computed(() => this.documents().find((d) => d.id === this.activeDocId()) ?? null);

  readonly isDragging = signal(false);
  readonly isUploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  // Chat history is kept per document.
  private readonly chats = signal<Record<string, ChatMessage[]>>({});
  readonly messages = computed(() => {
    const id = this.activeDocId();
    return id ? (this.chats()[id] ?? []) : [];
  });
  readonly question = signal('');
  readonly isAsking = signal(false);

  constructor() {
    this.pdfQa.listDocuments().subscribe((docs) => {
      this.documents.set(docs);
      if (docs.length) {
        this.activeDocId.set(docs[0].id);
      }
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.upload(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      this.upload(file);
    }
  }

  private upload(file: File): void {
    this.uploadError.set(null);

    if (file.type !== 'application/pdf') {
      this.uploadError.set('Only PDF files are supported.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      this.uploadError.set(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    this.isUploading.set(true);
    this.pdfQa.uploadPdf(file).subscribe({
      next: (doc) => {
        this.documents.update((docs) => [doc, ...docs]);
        this.activeDocId.set(doc.id);
        this.isUploading.set(false);
      },
      error: (err) => {
        this.uploadError.set(errorMessage(err, 'Upload failed. Please try again.'));
        this.isUploading.set(false);
      },
    });
  }

  selectDocument(id: string): void {
    this.activeDocId.set(id);
    this.scrollChatToBottom();
  }

  removeDocument(doc: UploadedDocument, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Remove "${doc.name}"?`)) {
      return;
    }
    this.pdfQa.deleteDocument(doc.id).subscribe(() => {
      this.documents.update((docs) => docs.filter((d) => d.id !== doc.id));
      this.chats.update(({ [doc.id]: _, ...rest }) => rest);
      if (this.activeDocId() === doc.id) {
        this.activeDocId.set(this.documents()[0]?.id ?? null);
      }
    });
  }

  ask(text?: string): void {
    const docId = this.activeDocId();
    const question = (text ?? this.question()).trim();
    if (!docId || !question || this.isAsking()) {
      return;
    }

    this.pushMessage(docId, { role: 'user', text: question });
    this.question.set('');
    this.isAsking.set(true);

    this.pdfQa.ask(docId, question).subscribe({
      next: (res) => {
        this.pushMessage(docId, { role: 'assistant', text: res.answer, sources: res.sources });
        this.isAsking.set(false);
      },
      error: (err) => {
        this.pushMessage(docId, { role: 'error', text: errorMessage(err, 'Something went wrong. Please try again.') });
        this.isAsking.set(false);
      },
    });
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.ask();
    }
  }

  private pushMessage(docId: string, message: ChatMessage): void {
    this.chats.update((chats) => ({ ...chats, [docId]: [...(chats[docId] ?? []), message] }));
    this.scrollChatToBottom();
  }

  private scrollChatToBottom(): void {
    setTimeout(() => {
      const el = this.chatScroll()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
