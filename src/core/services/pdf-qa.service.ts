import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  pages?: number;
  uploadedAt: string;
}

export interface AskResponse {
  answer: string;
  sources?: { page: number; snippet: string }[];
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatResponse {
  reply: string;
  sources?: { documentName: string; page: number; snippet: string }[];
}

// Set to false once the FastAPI backend exposes these endpoints.
const USE_MOCK = true;
const API_URL = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class PdfQaService {
  private readonly http = inject(HttpClient);

  uploadPdf(file: File): Observable<UploadedDocument> {
    if (USE_MOCK) {
      return of({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }).pipe(delay(1200));
    }

    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadedDocument>(`${API_URL}/documents`, formData);
  }

  listDocuments(): Observable<UploadedDocument[]> {
    if (USE_MOCK) {
      return of([]);
    }
    return this.http.get<UploadedDocument[]>(`${API_URL}/documents`);
  }

  deleteDocument(id: string): Observable<void> {
    if (USE_MOCK) {
      return of(undefined).pipe(delay(300));
    }
    return this.http.delete<void>(`${API_URL}/documents/${id}`);
  }

  ask(documentId: string, question: string): Observable<AskResponse> {
    if (USE_MOCK) {
      return of({
        answer:
          `This is a sample answer to "${question}". Once the backend is ` +
          'connected, answers will be generated from the selected PDF.',
        sources: [{ page: 1, snippet: 'Relevant excerpt from the document will appear here.' }],
      }).pipe(delay(1000));
    }
    return this.http.post<AskResponse>(`${API_URL}/documents/${documentId}/ask`, { question });
  }

  // General assistant chat that searches across all uploaded documents.
  chat(message: string, history: ChatTurn[]): Observable<ChatResponse> {
    if (USE_MOCK) {
      return of({
        reply:
          `You asked: "${message}". Once the backend is connected, I'll search ` +
          'across all your uploaded documents to answer.',
      }).pipe(delay(900));
    }
    return this.http.post<ChatResponse>(`${API_URL}/chat`, { message, history });
  }
}
