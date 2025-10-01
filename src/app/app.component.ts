// Angular Core
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

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

// Data Services
import { seedSampleData } from './core/data/seed-data';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = signal('Trackie');

  constructor() {
    // Initialize sample data on app start
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    try {
      await seedSampleData();
      console.log('✅ Sample data initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing sample data:', error);
    }
  }
}
