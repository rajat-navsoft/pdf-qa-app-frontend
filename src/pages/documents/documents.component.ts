import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-documents',
  styleUrl: './documents.component.scss',
  templateUrl: './documents.component.html',
})
export class DocumentsComponent {
  selectedFile: File | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.selectedFile = null;
      return;
    }

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      input.value = '';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
  }

  uploadPdf(): void {
    if (!this.selectedFile) {
      return;
    }

    // We will connect this to the FastAPI backend later.
    alert(`Selected PDF: ${this.selectedFile.name}`);
  }
}
