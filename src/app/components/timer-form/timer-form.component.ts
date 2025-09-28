import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TimerService, TaxonomyService } from '../../core/services';
import { Category, Subcategory, Tag } from '../../core/models';
import { seedSampleData } from '../../core/data';

@Component({
  selector: 'app-timer-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatChipsModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  templateUrl: './timer-form.component.html',
  styleUrls: ['./timer-form.component.scss'],
})
export class TimerFormComponent implements OnInit {
  // State signals
  categories = signal<Category[]>([]);
  subcategories = signal<Subcategory[]>([]);
  tags = signal<Tag[]>([]);

  // Form state
  categoryId: number | null = null;
  subcategoryId: number | null = null;
  selectedTagIds: number[] = [];

  constructor(public timerService: TimerService, private taxonomyService: TaxonomyService) {}

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
    this.subcategoryId = null;

    if (this.categoryId) {
      try {
        const subcategories = await this.taxonomyService.getSubcategoriesForCategory(
          this.categoryId
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
    if (!this.categoryId) {
      alert('Please select a category');
      return;
    }

    try {
      await this.timerService.startTimer({
        categoryId: this.categoryId,
        subcategoryId: this.subcategoryId || undefined,
        tagIds: [...this.selectedTagIds],
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      alert('Failed to start timer');
    }
  }

  async stopTimer(): Promise<void> {
    try {
      const sessionId = await this.timerService.stopTimer();
      console.log('Timer stopped, session created:', sessionId);
    } catch (error) {
      console.error('Error stopping timer:', error);
      alert('Failed to stop timer');
    }
  }

  get canStart(): boolean {
    return this.categoryId !== null && !this.timerService.active();
  }

  get canStop(): boolean {
    return !!this.timerService.active();
  }
}
