// Angular Core
import { Injectable, signal, effect, computed } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  name: Theme;
  displayName: string;
  description: string;
  icon: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private _currentTheme = signal<Theme>('auto');
  private _systemTheme = signal<'light' | 'dark'>('light');

  // Available themes configuration
  readonly availableThemes: ThemeConfig[] = [
    {
      name: 'light',
      displayName: 'Light',
      description: 'Light theme with bright colors',
      icon: 'light_mode',
    },
    {
      name: 'dark',
      displayName: 'Dark',
      description: 'Dark theme easy on the eyes',
      icon: 'dark_mode',
    },
    {
      name: 'auto',
      displayName: 'Auto',
      description: 'Follows your system preference',
      icon: 'auto_mode',
    },
  ];

  // Read-only access to current theme
  readonly currentTheme = this._currentTheme.asReadonly();
  readonly systemTheme = this._systemTheme.asReadonly();

  // Computed effective theme (resolves 'auto' to actual theme)
  readonly effectiveTheme = computed(() => {
    const current = this._currentTheme();
    if (current === 'auto') {
      return this._systemTheme();
    }
    return current;
  });

  // Check if current theme is dark
  readonly isDark = computed(() => this.effectiveTheme() === 'dark');

  constructor() {
    // Setup system theme detection first
    this.setupSystemThemeDetection();

    // Load saved theme or default to auto
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    if (savedTheme && this.isValidTheme(savedTheme)) {
      this._currentTheme.set(savedTheme);
    }

    // Apply initial theme immediately
    this.applyTheme(this._currentTheme());

    // Setup reactive theme changes - reapply when theme or system preference changes
    effect(() => {
      // This effect tracks both _currentTheme and _systemTheme changes
      const currentTheme = this._currentTheme();
      const systemTheme = this._systemTheme(); // Include this to track system changes
      this.applyTheme(currentTheme);
    });
  }

  setTheme(theme: Theme): void {
    if (!this.isValidTheme(theme)) {
      console.warn(`Invalid theme: ${theme}`);
      return;
    }

    this._currentTheme.set(theme);
    localStorage.setItem('app-theme', theme);
  }

  getCurrentTheme(): Theme {
    return this._currentTheme();
  }

  getThemeConfig(theme: Theme): ThemeConfig | undefined {
    return this.availableThemes.find((t) => t.name === theme);
  }

  toggleTheme(): void {
    const current = this._currentTheme();
    const newTheme = current === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private setupSystemThemeDetection(): void {
    // Check initial system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._systemTheme.set(mediaQuery.matches ? 'dark' : 'light');

    // Listen for system theme changes
    mediaQuery.addEventListener('change', (e) => {
      this._systemTheme.set(e.matches ? 'dark' : 'light');
    });
  }

  private applyTheme(theme: Theme): void {
    const html = document.documentElement;
    const effectiveTheme = this.effectiveTheme();

    // Use the new CSS color-scheme approach as recommended by Material docs
    if (theme === 'auto') {
      // Let system preference determine the theme
      html.style.colorScheme = 'light dark';
    } else {
      // Apply explicit theme
      html.style.colorScheme = effectiveTheme;
    }

    // Add theme classes for custom component styling (optional)
    document.body.className = document.body.className.replace(/\b(light|dark|auto)-theme\b/g, '');
    document.body.classList.add(`${theme}-theme`);

    // Emit theme change event for other components
    window.dispatchEvent(
      new CustomEvent('theme-changed', {
        detail: { theme, effectiveTheme },
      })
    );
  }

  private isValidTheme(theme: string): theme is Theme {
    return ['light', 'dark', 'auto'].includes(theme);
  }
}
