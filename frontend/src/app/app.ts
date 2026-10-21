import { Component, signal } from '@angular/core';
import { Dashboard } from "./features/dashboard/dashboard";

@Component({
  imports: [Dashboard],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');
}
