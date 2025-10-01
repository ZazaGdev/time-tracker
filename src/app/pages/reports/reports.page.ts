// Angular Core
import {
  Component,
  OnInit,
  AfterViewInit,
  signal,
  computed,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';

// Angular Common
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

// Application Services
import { ReportService, TaxonomyService } from '../../core/services';
import {
  DayTotals,
  PeriodTotals,
  ChartData,
  ReportPeriod,
} from '../../core/services/report.service';

// Application Components
import { HoursChartComponent } from '../../components/hours-chart/hours-chart.component';
// import { CategoryPieChartComponent } from '../../components/category-pie-chart/category-pie-chart.component'; // Temporarily disabled

// Application Models
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
    MatButtonToggleModule,
    HoursChartComponent, // Re-enabled with theme support
    // CategoryPieChartComponent, // Temporarily disabled during migration
  ],
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage implements OnInit, AfterViewInit {
  @ViewChild('hoursChart', { static: false }) hoursChart!: HoursChartComponent;
  // @ViewChild('pieChart', { static: false }) pieChart!: CategoryPieChartComponent; // Temporarily disabled

  // Debounce timer for updates
  private updateTimer: any = null;

  // Current selected date
  selectedDate = signal<string>('');

  // Current report period
  selectedPeriod = signal<ReportPeriod>('daily');

  // Loading state
  loading = signal<boolean>(false);

  // Raw data from services
  private periodTotals = signal<PeriodTotals[]>([]);
  private categories = signal<Category[]>([]);
  private subcategories = signal<Subcategory[]>([]);
  private tags = signal<Tag[]>([]);

  // Computed date object for chart component
  selectedDateObj = computed(() => {
    const dateStr = this.selectedDate();
    return dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  });

  // Computed report data for display
  reportData = computed<ReportRow[]>(() => {
    const totals = this.periodTotals();
    const cats = this.categories();
    const subs = this.subcategories();
    const tagList = this.tags();

    return totals.map((total: PeriodTotals) => {
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
        .map((tagId: number) => tagList.find((t) => t.id === tagId)?.name)
        .filter((name: string | undefined) => name !== undefined)
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

  ngAfterViewInit(): void {
    // Initialize chart with current period and date after view is ready
    setTimeout(async () => {
      if (this.hoursChart) {
        await this.hoursChart.updatePeriod(this.selectedPeriod(), this.selectedDateObj());
      }
    }, 200);
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
   * Update report data for new selection without full reload
   */
  private async updateReportDataForNewSelection(): Promise<void> {
    if (!this.selectedDate()) {
      return;
    }

    try {
      // Parse the date string to a Date object
      const dateObj = new Date(this.selectedDate() + 'T00:00:00');
      const period = this.selectedPeriod();

      // Get totals based on period
      let totals: PeriodTotals[];
      switch (period) {
        case 'daily':
          totals = await this.reportService.totalsForDate(dateObj);
          break;
        case 'weekly':
          totals = await this.reportService.totalsForWeek(dateObj);
          break;
        case 'monthly':
          totals = await this.reportService.totalsForMonth(dateObj);
          break;
      }

      // Only update the periodTotals signal - computed signals will update the UI automatically
      this.periodTotals.set(totals);
    } catch (error) {
      console.error('Error updating report data:', error);
      this.periodTotals.set([]);
    }
  }

  /**
   * Load report data for the selected date and period
   */
  async loadReportData(): Promise<void> {
    if (!this.selectedDate()) {
      return;
    }

    this.loading.set(true);

    try {
      // Parse the date string to a Date object
      const dateObj = new Date(this.selectedDate() + 'T00:00:00');
      const period = this.selectedPeriod();

      // Get totals based on period
      let totals: PeriodTotals[];
      switch (period) {
        case 'daily':
          totals = await this.reportService.totalsForDate(dateObj);
          break;
        case 'weekly':
          totals = await this.reportService.totalsForWeek(dateObj);
          break;
        case 'monthly':
          totals = await this.reportService.totalsForMonth(dateObj);
          break;
      }

      this.periodTotals.set(totals);

      // Chart will update automatically via its own data loading
      // No need to refresh here to prevent double loading and flickering
    } catch (error) {
      console.error('Error loading report data:', error);
      this.periodTotals.set([]);
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

    // Debounce updates to prevent rapid successive calls
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = setTimeout(async () => {
      // Update chart component with new date and current period
      if (this.hoursChart) {
        await this.hoursChart.updatePeriod(this.selectedPeriod(), this.selectedDateObj());
      }
      // Pie chart temporarily disabled during migration
      // if (this.pieChart) {
      //   this.pieChart.date = this.selectedDateObj();
      //   await this.pieChart.refresh();
      // }

      // No need to call loadReportData() - computed signals will update automatically
      await this.updateReportDataForNewSelection();
    }, 150); // 150ms debounce
  }

  /**
   * Handle period change event
   */
  async onPeriodChange(period: ReportPeriod): Promise<void> {
    this.selectedPeriod.set(period);

    // Debounce updates to prevent rapid successive calls
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = setTimeout(async () => {
      // Update chart component with new period and date
      if (this.hoursChart) {
        await this.hoursChart.updatePeriod(period, this.selectedDateObj());
      }

      // Pie chart temporarily disabled during migration
      // if (this.pieChart) {
      //   this.pieChart.period = period;
      //   this.pieChart.date = this.selectedDateObj();
      //   await this.pieChart.refresh();
      // }

      // No need to call loadReportData() - computed signals will update automatically
      await this.updateReportDataForNewSelection();
    }, 100); // Shorter debounce for period changes as they're less frequent
  }
  /**
   * Get total hours for all entries
   */
  getTotalHours(): number {
    return this.reportData().reduce((sum, row) => sum + row.hours, 0);
  }

  /**
   * Get period label for display
   */
  getPeriodLabel(): string {
    const period = this.selectedPeriod();
    switch (period) {
      case 'daily':
        return 'Day';
      case 'weekly':
        return 'Week';
      case 'monthly':
        return 'Month';
    }
  }

  /**
   * Get number of unique categories
   */
  getUniqueCategories(): number {
    const categories = new Set(this.reportData().map((row) => row.category));
    return categories.size;
  }

  /**
   * Get average session length in hours
   */
  getAverageSession(): number {
    const data = this.reportData();
    if (data.length === 0) return 0;
    const totalHours = this.getTotalHours();
    return totalHours / data.length;
  }
}
