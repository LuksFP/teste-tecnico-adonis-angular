import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastOutlet } from './core/notifications/toast-outlet';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ToastOutlet],
  templateUrl: './app.html',
})
export class App {}
