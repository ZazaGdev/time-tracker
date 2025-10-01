// Angular Core
import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';

// Angular Common
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';

// Application Services
import { TimerService, TaxonomyService } from '../../core/services';

// Application Models
import { Category, Subcategory, Tag } from '../../core/models';

// Application Data
import { seedSampleData } from '../../core/data';

@Component({
  selector: 'app-timer-form',
  standalone: true,
  imports: [
    // Angular Common
    CommonModule,
    FormsModule,

    // Angular Material
    MatSelectModule,
    MatChipsModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  templateUrl: './timer-form.component.html',
  styleUrls: ['./timer-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerFormComponent implements OnInit {
  // State signals
  categories = signal<Category[]>([]);
  subcategories = signal<Subcategory[]>([]);
  tags = signal<Tag[]>([]);

  // Form state signals
  categoryId = signal<number | null>(null);
  subcategoryId = signal<number | null>(null);
  selectedTagIds = signal<number[]>([]);

  // Computed properties
  canStart = computed(() => {
    // Can start only if a category is selected and categories have been loaded
    return this.categoryId() !== null && this.categories().length > 0;
  });

  canStop = computed(() => {
    return !!this.timerService.active();
  });

  startButtonText = computed(() => {
    const activeTimer = this.timerService.active();
    return activeTimer ? 'Start New Timer' : 'Start Timer';
  });

  constructor(
    public timerService: TimerService,
    private taxonomyService: TaxonomyService,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Seed sample data on first run
      await seedSampleData();

      // Load initial data
      await Promise.all([this.loadCategories(), this.loadTags(), this.timerService.loadActive()]);
    } catch (error) {
      console.error('Error initializing timer page:', error);
    }
  }

  private async loadCategories(): Promise<void> {
    const categories = await this.taxonomyService.getCategories();
    this.categories.set(categories);
  }

  private async loadTags(): Promise<void> {
    const tags = await this.taxonomyService.getTags();
    this.tags.set(tags);
  }

  async onCategoryChange(): Promise<void> {
    // Reset subcategory when category changes
    this.subcategoryId.set(null);

    const categoryId = this.categoryId();
    if (categoryId) {
      try {
        const subcategories = await this.taxonomyService.getSubcategoriesForCategory(
          categoryId
        );
        this.subcategories.set(subcategories);
      } catch (error) {
        console.error('Error loading subcategories:', error);
        this.subcategories.set([]);
      }
    } else {
      this.subcategories.set([]);
    }
  }

  async startTimer(): Promise<void> {
    // Validate category selection
    const categoryId = this.categoryId();
    if (!categoryId) {
      alert('Please select a category before starting the timer.');
      return;
    }

    try {
      // Check if there's an active timer that will be auto-stopped
      const activeTimer = this.timerService.active();
      if (activeTimer) {
        const confirmed = confirm(
          'Starting a new timer will automatically stop the current running timer. Do you want to continue?'
        );
        if (!confirmed) {
          return;
        }
      }

      // Start the new timer (TimerService.startTimer already handles stopping existing timer)
      await this.timerService.startTimer({
        categoryId,
        subcategoryId: this.subcategoryId() || undefined,
        tagIds: [...this.selectedTagIds()],
      });

      console.log('Timer started successfully');
    } catch (error) {
      console.error('Error starting timer:', error);
      alert('Failed to start timer. Please try again.');
    }
  }

  async stopTimer(): Promise<void> {
    // Confirm stop action
    const confirmed = confirm(
      'Are you sure you want to stop the current timer? This will save the session and cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    try {
      const sessionId = await this.timerService.stopTimer();
      console.log('Timer stopped successfully, session created:', sessionId);

      // Optional: Show success message
      // alert('Timer stopped and session saved successfully!');
    } catch (error) {
      console.error('Error stopping timer:', error);
      alert('Failed to stop timer. Please try again.');
    }
  }


}
