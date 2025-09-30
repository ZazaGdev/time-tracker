// Angular Core
import { Component, signal } from '@angular/core';

// Angular Common
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
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
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  constructor(private themeService: ThemeService) {}

  // Expose theme service properties
  get availableThemes() {
    return this.themeService.availableThemes;
  }

  get currentTheme() {
    return this.themeService.currentTheme;
  }

  get effectiveTheme() {
    return this.themeService.effectiveTheme;
  }

  get isDark() {
    return this.themeService.isDark;
  }

  onThemeChange(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
