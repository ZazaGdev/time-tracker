// Angular Core
import { Component, signal } from '@angular/core';

// Angular Router
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// Angular Common
import { CommonModule } from '@angular/common';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Custom Components
import { SidebarComponent } from './components/sidebar/sidebar.component';

// Services
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // Angular Common
    CommonModule,

    // Angular Router
    RouterOutlet,

    // Angular Material
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,

    // Custom Components
    SidebarComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class AppComponent {
  title = signal('Trackie');

  constructor(private themeService: ThemeService) {
    // ThemeService constructor will run immediately, initializing theme
  }
}
