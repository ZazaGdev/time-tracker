// Angular Core
import { Component, signal } from '@angular/core';

// Angular Common
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

// Application Services
import { ThemeService, Theme } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    // Angular Common
    CommonModule,

    // Angular Material
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  currentTheme = signal<string>('light');

  constructor(private themeService: ThemeService) {
    this.currentTheme.set(this.themeService.getCurrentTheme());
  }

  onThemeChange(theme: string): void {
    this.currentTheme.set(theme);
    this.themeService.setTheme(theme as Theme);
  }
}
