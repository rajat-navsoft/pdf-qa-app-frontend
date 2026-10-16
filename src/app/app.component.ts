import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatbotComponent } from '../components/chatbot/chatbot.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatbotComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AppComponent {
  title = 'frontend';
}
