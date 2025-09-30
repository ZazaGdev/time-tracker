// Angular Core
import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private _currentTheme = signal<Theme>('light');

  // Read-only access to current theme
  readonly currentTheme = this._currentTheme.asReadonly();

  constructor() {
    // Load saved theme or default to light
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      this._currentTheme.set(savedTheme);
    }

    // Apply theme changes to document
    effect(() => {
      this.applyTheme(this._currentTheme());
    });

    // Apply initial theme
    this.applyTheme(this._currentTheme());
  }

  setTheme(theme: Theme): void {
    this._currentTheme.set(theme);
    localStorage.setItem('app-theme', theme);
  }

  getCurrentTheme(): Theme {
    return this._currentTheme();
  }

  private applyTheme(theme: Theme): void {
    const body = document.body;

    // Remove existing theme classes
    body.classList.remove('light-theme', 'dark-theme');

    // Apply new theme
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    } else {
      body.classList.add(`${theme}-theme`);
    }
  }
}
