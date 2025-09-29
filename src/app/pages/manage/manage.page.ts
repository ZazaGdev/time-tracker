import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TaxonomyService } from '../../core/services';
import { Category, Subcategory, Tag, Session, ActiveTimer } from '../../core/models';
import { db } from '../../core/data/db.service';

@Component({
  selector: 'app-manage-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './manage.page.html',
  styleUrls: ['./manage.page.scss'],
})
export class ManagePage implements OnInit {
  // Data signals
  categories = signal<Category[]>([]);
  subcategories = signal<Subcategory[]>([]);
  tags = signal<Tag[]>([]);

  // Form inputs
  newCategoryName = '';
  newSubcategoryName = '';
  selectedCategoryId: number | null = null;
  newTagName = '';

  // Export/Import state
  isExporting = signal<boolean>(false);
  isImporting = signal<boolean>(false);
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Demo data seeding state
  isSeedingDemo = signal<boolean>(false);

  constructor(private taxonomyService: TaxonomyService) {}

  async ngOnInit(): Promise<void> {
    await this.loadAllData();
  }

  private async loadAllData(): Promise<void> {
    try {
      await Promise.all([this.loadCategories(), this.loadSubcategories(), this.loadTags()]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  private async loadCategories(): Promise<void> {
    const categories = await this.taxonomyService.getCategories();
    this.categories.set(categories);
  }

  private async loadSubcategories(): Promise<void> {
    const subcategories: Subcategory[] = [];
    const categories = this.categories();

    for (const category of categories) {
      if (category.id) {
        const categorySubcategories = await this.taxonomyService.getSubcategoriesForCategory(
          category.id
        );
        subcategories.push(...categorySubcategories);
      }
    }

    this.subcategories.set(subcategories);
  }

  private async loadTags(): Promise<void> {
    const tags = await this.taxonomyService.getTags();
    this.tags.set(tags);
  }

  // Category methods
  async addCategory(): Promise<void> {
    const name = this.newCategoryName.trim();
    if (!name) {
      alert('Please enter a category name');
      return;
    }

    // Check for duplicates
    const existingCategory = this.categories().find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (existingCategory) {
      alert('A category with this name already exists');
      return;
    }

    try {
      await this.taxonomyService.addCategory(name);
      this.newCategoryName = '';
      await this.loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category');
    }
  }

  async deleteCategory(category: Category): Promise<void> {
    if (!category.id) return;

    if (confirm(`Are you sure you want to delete "${category.name}" and all its subcategories?`)) {
      try {
        await this.taxonomyService.deleteCategory(category.id);
        await this.loadAllData(); // Reload all data since subcategories might be affected
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category');
      }
    }
  }

  // Subcategory methods
  async addSubcategory(): Promise<void> {
    const name = this.newSubcategoryName.trim();
    if (!name) {
      alert('Please enter a subcategory name');
      return;
    }

    if (!this.selectedCategoryId) {
      alert('Please select a parent category');
      return;
    }

    // Check for duplicates within the same category
    const existingSubcategory = this.subcategories().find(
      (s) => s.name.toLowerCase() === name.toLowerCase() && s.categoryId === this.selectedCategoryId
    );
    if (existingSubcategory) {
      alert('A subcategory with this name already exists in this category');
      return;
    }

    try {
      await this.taxonomyService.addSubcategory(name, this.selectedCategoryId);
      this.newSubcategoryName = '';
      this.selectedCategoryId = null;
      await this.loadSubcategories();
    } catch (error) {
      console.error('Error adding subcategory:', error);
      alert('Failed to add subcategory');
    }
  }

  async deleteSubcategory(subcategory: Subcategory): Promise<void> {
    if (!subcategory.id) return;

    if (confirm(`Are you sure you want to delete "${subcategory.name}"?`)) {
      try {
        await this.taxonomyService.deleteSubcategory(subcategory.id);
        await this.loadSubcategories();
      } catch (error) {
        console.error('Error deleting subcategory:', error);
        alert('Failed to delete subcategory');
      }
    }
  }

  // Tag methods
  async addTag(): Promise<void> {
    const name = this.newTagName.trim();
    if (!name) {
      alert('Please enter a tag name');
      return;
    }

    // Check for duplicates
    const existingTag = this.tags().find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existingTag) {
      alert('A tag with this name already exists');
      return;
    }

    try {
      await this.taxonomyService.addTag(name);
      this.newTagName = '';
      await this.loadTags();
    } catch (error) {
      console.error('Error adding tag:', error);
      alert('Failed to add tag');
    }
  }

  async deleteTag(tag: Tag): Promise<void> {
    if (!tag.id) return;

    if (confirm(`Are you sure you want to delete "${tag.name}"?`)) {
      try {
        await this.taxonomyService.deleteTag(tag.id);
        await this.loadTags();
      } catch (error) {
        console.error('Error deleting tag:', error);
        alert('Failed to delete tag');
      }
    }
  }

  // Helper methods
  getCategoryName(categoryId: number): string {
    const category = this.categories().find((c) => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }

  get canAddSubcategory(): boolean {
    return this.newSubcategoryName.trim().length > 0 && this.selectedCategoryId !== null;
  }

  // Export/Import functionality

  /**
   * Export all data from the database to a JSON file
   */
  async exportData(): Promise<void> {
    if (this.isExporting()) return;

    this.isExporting.set(true);

    try {
      // Gather all data from Dexie tables
      const [categories, subcategories, tags, sessions, activeTimer] = await Promise.all([
        db.categories.toArray(),
        db.subcategories.toArray(),
        db.tags.toArray(),
        db.sessions.toArray(),
        db.activeTimer.toArray(),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        data: {
          categories,
          subcategories,
          tags,
          sessions,
          activeTimer,
        },
      };

      // Create and download JSON file
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Generate filename with current date
      const now = new Date();
      const dateStr =
        now.getFullYear() +
        '-' +
        String(now.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(now.getDate()).padStart(2, '0');
      const filename = `tt-backup-${dateStr}.json`;

      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Data exported successfully:', filename);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      this.isExporting.set(false);
    }
  }

  /**
   * Import data from a JSON file and restore to database
   */
  async importData(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (this.isImporting()) return;

    this.isImporting.set(true);

    try {
      // Read the file
      const fileText = await this.readFileAsText(file);
      const importData = JSON.parse(fileText);

      // Validate the import data structure
      if (!importData.data || typeof importData.data !== 'object') {
        throw new Error('Invalid backup file format');
      }

      const { categories, subcategories, tags, sessions, activeTimer } = importData.data;

      // Confirm with user before importing
      const confirmMessage = `This will replace all existing data with the backup from ${
        importData.exportedAt
          ? new Date(importData.exportedAt).toLocaleDateString()
          : 'unknown date'
      }. Are you sure you want to continue?`;

      if (!confirm(confirmMessage)) {
        return;
      }

      // Perform import within a transaction
      await db.transaction(
        'rw',
        [db.categories, db.subcategories, db.tags, db.sessions, db.activeTimer],
        async () => {
          // Clear all existing data
          await Promise.all([
            db.categories.clear(),
            db.subcategories.clear(),
            db.tags.clear(),
            db.sessions.clear(),
            db.activeTimer.clear(),
          ]);

          // Import new data (only if arrays exist and have data)
          if (Array.isArray(categories) && categories.length > 0) {
            await db.categories.bulkAdd(categories);
          }
          if (Array.isArray(subcategories) && subcategories.length > 0) {
            await db.subcategories.bulkAdd(subcategories);
          }
          if (Array.isArray(tags) && tags.length > 0) {
            await db.tags.bulkAdd(tags);
          }
          if (Array.isArray(sessions) && sessions.length > 0) {
            await db.sessions.bulkAdd(sessions);
          }
          if (Array.isArray(activeTimer) && activeTimer.length > 0) {
            await db.activeTimer.bulkAdd(activeTimer);
          }
        }
      );

      // Reload the page data
      await this.loadAllData();

      alert('Data imported successfully! Please reload the page to see all changes.');
      console.log('Data imported successfully');
    } catch (error) {
      console.error('Error importing data:', error);
      alert(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isImporting.set(false);
      // Clear the file input
      input.value = '';
    }
  }

  /**
   * Trigger the file input click
   */
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Read a file as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /**
   * Seed demo data for development and testing purposes
   * Creates categories, subcategories, tags, and sample sessions
   */
  async seedDemoData(): Promise<void> {
    if (this.isSeedingDemo()) return;

    this.isSeedingDemo.set(true);

    try {
      // Clear existing data first
      const confirmClear = confirm(
        'This will clear all existing data and add demo data. Are you sure you want to continue?'
      );

      if (!confirmClear) {
        return;
      }

      // Clear all existing data within a transaction
      await db.transaction(
        'rw',
        [db.categories, db.subcategories, db.tags, db.sessions, db.activeTimer],
        async () => {
          await Promise.all([
            db.categories.clear(),
            db.subcategories.clear(),
            db.tags.clear(),
            db.sessions.clear(),
            db.activeTimer.clear(),
          ]);

          // Add demo categories
          const workCategoryId = await db.categories.add({ name: 'Work' });
          const personalCategoryId = await db.categories.add({ name: 'Personal' });
          const learningCategoryId = await db.categories.add({ name: 'Learning' });
          const meetingsCategoryId = await db.categories.add({ name: 'Meetings' });

          // Add demo subcategories
          const developmentSubId = await db.subcategories.add({
            name: 'Development',
            categoryId: workCategoryId as number,
          });
          const reviewSubId = await db.subcategories.add({
            name: 'Code Review',
            categoryId: workCategoryId as number,
          });
          const planningSubId = await db.subcategories.add({
            name: 'Planning',
            categoryId: workCategoryId as number,
          });
          const exerciseSubId = await db.subcategories.add({
            name: 'Exercise',
            categoryId: personalCategoryId as number,
          });
          const readingSubId = await db.subcategories.add({
            name: 'Reading',
            categoryId: personalCategoryId as number,
          });
          const tutorialSubId = await db.subcategories.add({
            name: 'Online Course',
            categoryId: learningCategoryId as number,
          });
          const standupSubId = await db.subcategories.add({
            name: 'Daily Standup',
            categoryId: meetingsCategoryId as number,
          });
          const reviewMeetingSubId = await db.subcategories.add({
            name: 'Sprint Review',
            categoryId: meetingsCategoryId as number,
          });

          // Add demo tags
          const angularTagId = await db.tags.add({ name: 'Angular' });
          const typescriptTagId = await db.tags.add({ name: 'TypeScript' });
          const frontendTagId = await db.tags.add({ name: 'Frontend' });
          const backendTagId = await db.tags.add({ name: 'Backend' });
          const bugfixTagId = await db.tags.add({ name: 'Bug Fix' });
          const featureTagId = await db.tags.add({ name: 'New Feature' });
          const researchTagId = await db.tags.add({ name: 'Research' });
          const urgentTagId = await db.tags.add({ name: 'Urgent' });

          // Create demo sessions for today with synthetic timestamps
          const today = new Date();

          // Session 1: 09:00-10:30 (1.5 hours) - Work > Development with Angular/Frontend tags
          const session1Start = new Date(today.setHours(9, 0, 0, 0));
          const session1End = new Date(today.setHours(10, 30, 0, 0));
          await db.sessions.add({
            categoryId: workCategoryId as number,
            subcategoryId: developmentSubId as number,
            tagIds: [angularTagId as number, frontendTagId as number],
            startedAt: session1Start.toISOString(),
            endedAt: session1End.toISOString(),
            durationMs: session1End.getTime() - session1Start.getTime(),
          });

          // Session 2: 11:00-12:15 (1.25 hours) - Work > Code Review with TypeScript/Bug Fix tags
          const session2Start = new Date(today.setHours(11, 0, 0, 0));
          const session2End = new Date(today.setHours(12, 15, 0, 0));
          await db.sessions.add({
            categoryId: workCategoryId as number,
            subcategoryId: reviewSubId as number,
            tagIds: [typescriptTagId as number, bugfixTagId as number],
            startedAt: session2Start.toISOString(),
            endedAt: session2End.toISOString(),
            durationMs: session2End.getTime() - session2Start.getTime(),
          });

          // Session 3: 14:30-16:00 (1.5 hours) - Learning > Online Course with Research tag
          const session3Start = new Date(today.setHours(14, 30, 0, 0));
          const session3End = new Date(today.setHours(16, 0, 0, 0));
          await db.sessions.add({
            categoryId: learningCategoryId as number,
            subcategoryId: tutorialSubId as number,
            tagIds: [researchTagId as number, angularTagId as number],
            startedAt: session3Start.toISOString(),
            endedAt: session3End.toISOString(),
            durationMs: session3End.getTime() - session3Start.getTime(),
          });

          // Session 4: 09:15-09:30 (15 minutes) - Meetings > Daily Standup
          const session4Start = new Date(today.setHours(9, 15, 0, 0));
          const session4End = new Date(today.setHours(9, 30, 0, 0));
          await db.sessions.add({
            categoryId: meetingsCategoryId as number,
            subcategoryId: standupSubId as number,
            tagIds: [],
            startedAt: session4Start.toISOString(),
            endedAt: session4End.toISOString(),
            durationMs: session4End.getTime() - session4Start.getTime(),
          });
        }
      );

      // Reload the page data
      await this.loadAllData();

      // Calculate expected total for verification
      const expectedHours = 1.5 + 1.25 + 1.5 + 0.25; // 4.5 hours total

      alert(
        `Demo data seeded successfully!\n\n` +
          `Created 4 categories, 8 subcategories, 8 tags, and 4 sessions for today.\n` +
          `Expected total: ${expectedHours} hours\n\n` +
          `Go to Reports page to verify the totals add up correctly.`
      );

      console.log('Demo data seeded successfully', {
        expectedHours,
        sessions: [
          '09:00-10:30 (1.5h) Work > Development',
          '11:00-12:15 (1.25h) Work > Code Review',
          '14:30-16:00 (1.5h) Learning > Online Course',
          '09:15-09:30 (0.25h) Meetings > Daily Standup',
        ],
      });
    } catch (error) {
      console.error('Error seeding demo data:', error);
      alert(
        `Failed to seed demo data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      this.isSeedingDemo.set(false);
    }
  }
}
