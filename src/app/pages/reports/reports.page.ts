import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportService, TaxonomyService } from '../../core/services';
import { DayTotals } from '../../core/services/report.service';
import { Category, Subcategory, Tag } from '../../core/models';

interface ReportRow {
  category: string;
  subcategory: string;
  tags: string;
  hours: number;
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
})
export class ReportsPage implements OnInit {
  // Current selected date
  selectedDate = signal<string>('');

  // Loading state
  loading = signal<boolean>(false);

  // Raw data from services
  private dayTotals = signal<DayTotals[]>([]);
  private categories = signal<Category[]>([]);
  private subcategories = signal<Subcategory[]>([]);
  private tags = signal<Tag[]>([]);

  // Computed report data for display
  reportData = computed<ReportRow[]>(() => {
    const totals = this.dayTotals();
    const cats = this.categories();
    const subs = this.subcategories();
    const tagList = this.tags();

    return totals.map((total) => {
      // Find category name
      const category = cats.find((c) => c.id === total.categoryId);
      const categoryName = category?.name || 'Unknown';

      // Find subcategory name
      const subcategory = total.subcategoryId
        ? subs.find((s) => s.id === total.subcategoryId)
        : null;
      const subcategoryName = subcategory?.name || '';

      // Find tag names
      const tagNames = total.tagIds
        .map((tagId) => tagList.find((t) => t.id === tagId)?.name)
        .filter((name) => name !== undefined)
        .join(', ');

      // Convert milliseconds to hours with 2 decimal places
      const hours = Math.round((total.totalMs / 3_600_000) * 100) / 100;

      return {
        category: categoryName,
        subcategory: subcategoryName,
        tags: tagNames,
        hours,
      };
    });
  });

  // Table columns
  displayedColumns: string[] = ['category', 'subcategory', 'tags', 'hours'];

  constructor(private reportService: ReportService, private taxonomyService: TaxonomyService) {
    // Set default date to today
    const today = new Date();
    const todayString =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');
    this.selectedDate.set(todayString);
  }

  async ngOnInit(): Promise<void> {
    await this.loadTaxonomyData();
    await this.loadReportData();
  }

  /**
   * Load all taxonomy data (categories, subcategories, tags)
   */
  private async loadTaxonomyData(): Promise<void> {
    try {
      const [categories, subcategories, tags] = await Promise.all([
        this.taxonomyService.getCategories(),
        this.getAllSubcategories(),
        this.taxonomyService.getTags(),
      ]);

      this.categories.set(categories);
      this.subcategories.set(subcategories);
      this.tags.set(tags);
    } catch (error) {
      console.error('Error loading taxonomy data:', error);
    }
  }

  /**
   * Get all subcategories across all categories
   */
  private async getAllSubcategories(): Promise<Subcategory[]> {
    try {
      const categories = await this.taxonomyService.getCategories();
      const allSubcategories: Subcategory[] = [];

      for (const category of categories) {
        if (category.id) {
          const subs = await this.taxonomyService.getSubcategoriesForCategory(category.id);
          allSubcategories.push(...subs);
        }
      }

      return allSubcategories;
    } catch (error) {
      console.error('Error loading subcategories:', error);
      return [];
    }
  }

  /**
   * Load report data for the selected date
   */
  async loadReportData(): Promise<void> {
    if (!this.selectedDate()) {
      return;
    }

    this.loading.set(true);

    try {
      // Parse the date string to a Date object
      const dateObj = new Date(this.selectedDate() + 'T00:00:00');

      // Get totals for the selected date
      const totals = await this.reportService.totalsForDate(dateObj);
      this.dayTotals.set(totals);
    } catch (error) {
      console.error('Error loading report data:', error);
      this.dayTotals.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Handle date change event
   */
  async onDateChange(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    this.selectedDate.set(target.value);
    await this.loadReportData();
  }

  /**
   * Get total hours for all entries
   */
  getTotalHours(): number {
    return this.reportData().reduce((sum, row) => sum + row.hours, 0);
  }
}
