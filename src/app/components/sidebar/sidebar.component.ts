// Angular Core
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

// Angular Common
import { CommonModule } from '@angular/common';

// Angular Router
import { RouterLink, RouterLinkActive } from '@angular/router';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface NavigationItem {
  path: string;
  icon: string;
  label: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    // Angular Common
    CommonModule,

    // Angular Router
    RouterLink,
    RouterLinkActive,

    // Angular Material
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  isExpanded = signal<boolean>(false);

  navigationItems: NavigationItem[] = [
    {
      path: '/',
      icon: 'timer',
      label: 'Home',
      exact: true,
    },
    {
      path: '/manage',
      icon: 'tune',
      label: 'Manage',
    },
    {
      path: '/reports',
      icon: 'assessment',
      label: 'Reports',
    },
  ];

  constructor() {
    // Load sidebar state from localStorage
    this.loadSidebarState();
    // Apply initial body class
    this.updateBodyClass();
  }

  toggleSidebar(): void {
    const newState = !this.isExpanded();
    this.isExpanded.set(newState);
    this.saveSidebarState(newState);
    this.updateBodyClass();
  }

  private loadSidebarState(): void {
    const savedState = localStorage.getItem('sidebar-expanded');
    if (savedState !== null) {
      this.isExpanded.set(savedState === 'true');
    } else {
      // Default to collapsed state
      this.isExpanded.set(false);
    }
  }

  private saveSidebarState(expanded: boolean): void {
    localStorage.setItem('sidebar-expanded', expanded.toString());
  }

  private updateBodyClass(): void {
    document.body.classList.remove('sidebar-expanded', 'sidebar-collapsed');
    document.body.classList.add(this.isExpanded() ? 'sidebar-expanded' : 'sidebar-collapsed');
  }
}
