// Angular Core
import {
  Component,
  OnInit,
  signal,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';

// Angular Common
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Application Services
import { TaxonomyService } from '../../core/services';
import { db } from '../../core/data/db.service';

// Application Models
import { Category, Subcategory, Tag, Session, ActiveTimer } from '../../core/models';

@Component({
  selector: 'app-manage-page',
  standalone: true,
  imports: [
    // Angular Common
    CommonModule,
    FormsModule,

    // Angular Material
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
   * Clear all data from the database
   * Removes all categories, subcategories, tags, sessions, and active timers
   */
  async clearAllData(): Promise<void> {
    const confirmed = confirm(
      'Are you sure you want to delete ALL data? This will remove:\n\n' +
        '• All categories and subcategories\n' +
        '• All tags\n' +
        '• All time tracking sessions\n' +
        '• Any active timers\n\n' +
        'This action cannot be undone!'
    );

    if (!confirmed) {
      return;
    }

    const doubleConfirm = confirm(
      'Last chance! Are you absolutely sure you want to delete ALL your time tracking data?'
    );

    if (!doubleConfirm) {
      return;
    }

    try {
      this.isSeedingDemo.set(true);

      // Clear all data within a transaction
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
        }
      );

      // Reload all data to update the UI
      await this.loadAllData();

      alert('All data has been successfully deleted!');
      console.log('Database cleared successfully');
    } catch (error) {
      console.error('Error clearing database:', error);
      alert('Failed to clear database. Please try again.');
    } finally {
      this.isSeedingDemo.set(false);
    }
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

  /**
   * Seed complex demo data for comprehensive testing
   * Creates data across multiple weeks and months for better testing
   */
  async seedComplexDemoData(): Promise<void> {
    if (this.isSeedingDemo()) return;

    this.isSeedingDemo.set(true);

    try {
      // Clear existing data first
      const confirmClear = confirm(
        'This will clear all existing data and add comprehensive demo data spanning multiple weeks. Are you sure you want to continue?'
      );

      if (!confirmClear) {
        return;
      }

      // Variables to track demo data creation
      const daysToGenerate = 28;
      let totalHours = 0;
      let sessionCount = 0;

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

          // Add 16 comprehensive categories covering all major life and work areas
          const workCategoryId = await db.categories.add({ name: 'Work & Career' });
          const projectsCategoryId = await db.categories.add({ name: 'Side Projects' });
          const learningCategoryId = await db.categories.add({ name: 'Learning & Development' });
          const meetingsCategoryId = await db.categories.add({ name: 'Meetings & Communication' });
          const personalCategoryId = await db.categories.add({ name: 'Personal Life' });
          const healthCategoryId = await db.categories.add({ name: 'Health & Fitness' });
          const creativeCategoryId = await db.categories.add({ name: 'Creative & Arts' });
          const socialCategoryId = await db.categories.add({ name: 'Social & Relationships' });
          const householdCategoryId = await db.categories.add({ name: 'Household & Maintenance' });
          const financeCategoryId = await db.categories.add({ name: 'Finance & Business' });
          const entertainmentCategoryId = await db.categories.add({
            name: 'Entertainment & Leisure',
          });
          const travelCategoryId = await db.categories.add({ name: 'Travel & Transportation' });
          const volunteerCategoryId = await db.categories.add({ name: 'Volunteer & Community' });
          const spiritualCategoryId = await db.categories.add({ name: 'Spiritual & Mindfulness' });
          const adminCategoryId = await db.categories.add({ name: 'Administration' });
          const emergencyCategoryId = await db.categories.add({ name: 'Emergency & Urgent' });

          // Add 75+ comprehensive subcategories across all categories

          // Work & Career subcategories (12 subcategories)
          const frontendDevSubId = await db.subcategories.add({
            name: 'Frontend Development',
            categoryId: workCategoryId as number,
          });
          const backendDevSubId = await db.subcategories.add({
            name: 'Backend Development',
            categoryId: workCategoryId as number,
          });
          const fullstackDevSubId = await db.subcategories.add({
            name: 'Full Stack Development',
            categoryId: workCategoryId as number,
          });
          const codeReviewSubId = await db.subcategories.add({
            name: 'Code Review',
            categoryId: workCategoryId as number,
          });
          const testingSubId = await db.subcategories.add({
            name: 'Testing & QA',
            categoryId: workCategoryId as number,
          });
          const debuggingSubId = await db.subcategories.add({
            name: 'Debugging',
            categoryId: workCategoryId as number,
          });
          const deploymentSubId = await db.subcategories.add({
            name: 'Deployment & DevOps',
            categoryId: workCategoryId as number,
          });
          const architectureSubId = await db.subcategories.add({
            name: 'Architecture Design',
            categoryId: workCategoryId as number,
          });
          const documentationSubId = await db.subcategories.add({
            name: 'Technical Documentation',
            categoryId: workCategoryId as number,
          });
          const performanceSubId = await db.subcategories.add({
            name: 'Performance Optimization',
            categoryId: workCategoryId as number,
          });
          const securitySubId = await db.subcategories.add({
            name: 'Security Implementation',
            categoryId: workCategoryId as number,
          });
          const careerDevSubId = await db.subcategories.add({
            name: 'Career Development',
            categoryId: workCategoryId as number,
          });

          // Side Projects subcategories (6 subcategories)
          const webProjectSubId = await db.subcategories.add({
            name: 'Web Applications',
            categoryId: projectsCategoryId as number,
          });
          const mobileProjectSubId = await db.subcategories.add({
            name: 'Mobile Applications',
            categoryId: projectsCategoryId as number,
          });
          const desktopProjectSubId = await db.subcategories.add({
            name: 'Desktop Applications',
            categoryId: projectsCategoryId as number,
          });
          const gameDevSubId = await db.subcategories.add({
            name: 'Game Development',
            categoryId: projectsCategoryId as number,
          });
          const openSourceSubId = await db.subcategories.add({
            name: 'Open Source Contributions',
            categoryId: projectsCategoryId as number,
          });
          const prototypingSubId = await db.subcategories.add({
            name: 'Prototyping & Experiments',
            categoryId: projectsCategoryId as number,
          });

          // Learning & Development subcategories (8 subcategories)
          const onlineCourseSubId = await db.subcategories.add({
            name: 'Online Courses',
            categoryId: learningCategoryId as number,
          });
          const bookReadingSubId = await db.subcategories.add({
            name: 'Technical Books',
            categoryId: learningCategoryId as number,
          });
          const tutorialSubId = await db.subcategories.add({
            name: 'Tutorials & Guides',
            categoryId: learningCategoryId as number,
          });
          const workshopSubId = await db.subcategories.add({
            name: 'Workshops & Webinars',
            categoryId: learningCategoryId as number,
          });
          const certificationSubId = await db.subcategories.add({
            name: 'Certification Study',
            categoryId: learningCategoryId as number,
          });
          const languageLearningSubId = await db.subcategories.add({
            name: 'Language Learning',
            categoryId: learningCategoryId as number,
          });
          const skillPracticeSubId = await db.subcategories.add({
            name: 'Skill Practice',
            categoryId: learningCategoryId as number,
          });
          const researchSubId = await db.subcategories.add({
            name: 'Research & Investigation',
            categoryId: learningCategoryId as number,
          });

          // Meetings & Communication subcategories (7 subcategories)
          const standupSubId = await db.subcategories.add({
            name: 'Daily Standups',
            categoryId: meetingsCategoryId as number,
          });
          const sprintMeetingSubId = await db.subcategories.add({
            name: 'Sprint Planning & Review',
            categoryId: meetingsCategoryId as number,
          });
          const oneOnOneSubId = await db.subcategories.add({
            name: '1-on-1 Meetings',
            categoryId: meetingsCategoryId as number,
          });
          const clientMeetingSubId = await db.subcategories.add({
            name: 'Client Meetings',
            categoryId: meetingsCategoryId as number,
          });
          const teamSyncSubId = await db.subcategories.add({
            name: 'Team Synchronization',
            categoryId: meetingsCategoryId as number,
          });
          const brainstormingSubId = await db.subcategories.add({
            name: 'Brainstorming Sessions',
            categoryId: meetingsCategoryId as number,
          });
          const presentationSubId = await db.subcategories.add({
            name: 'Presentations & Demos',
            categoryId: meetingsCategoryId as number,
          });

          // Personal Life subcategories (6 subcategories)
          const familyTimeSubId = await db.subcategories.add({
            name: 'Family Time',
            categoryId: personalCategoryId as number,
          });
          const personalReadingSubId = await db.subcategories.add({
            name: 'Personal Reading',
            categoryId: personalCategoryId as number,
          });
          const hobbiesSubId = await db.subcategories.add({
            name: 'Hobbies & Interests',
            categoryId: personalCategoryId as number,
          });
          const selfCareSubId = await db.subcategories.add({
            name: 'Self Care & Grooming',
            categoryId: personalCategoryId as number,
          });
          const personalProjectsSubId = await db.subcategories.add({
            name: 'Personal Projects',
            categoryId: personalCategoryId as number,
          });
          const reflectionSubId = await db.subcategories.add({
            name: 'Reflection & Planning',
            categoryId: personalCategoryId as number,
          });

          // Health & Fitness subcategories (7 subcategories)
          const workoutSubId = await db.subcategories.add({
            name: 'Gym & Strength Training',
            categoryId: healthCategoryId as number,
          });
          const cardioSubId = await db.subcategories.add({
            name: 'Cardio & Running',
            categoryId: healthCategoryId as number,
          });
          const yogaSubId = await db.subcategories.add({
            name: 'Yoga & Stretching',
            categoryId: healthCategoryId as number,
          });
          const sportsSubId = await db.subcategories.add({
            name: 'Sports & Games',
            categoryId: healthCategoryId as number,
          });
          const meditationSubId = await db.subcategories.add({
            name: 'Meditation & Mindfulness',
            categoryId: healthCategoryId as number,
          });
          const medicalSubId = await db.subcategories.add({
            name: 'Medical Appointments',
            categoryId: healthCategoryId as number,
          });
          const nutritionSubId = await db.subcategories.add({
            name: 'Nutrition & Meal Planning',
            categoryId: healthCategoryId as number,
          });

          // Creative & Arts subcategories (6 subcategories)
          const designSubId = await db.subcategories.add({
            name: 'Graphic Design',
            categoryId: creativeCategoryId as number,
          });
          const writingSubId = await db.subcategories.add({
            name: 'Creative Writing',
            categoryId: creativeCategoryId as number,
          });
          const photographySubId = await db.subcategories.add({
            name: 'Photography & Video',
            categoryId: creativeCategoryId as number,
          });
          const musicSubId = await db.subcategories.add({
            name: 'Music & Audio',
            categoryId: creativeCategoryId as number,
          });
          const artSubId = await db.subcategories.add({
            name: 'Drawing & Painting',
            categoryId: creativeCategoryId as number,
          });
          const craftingSubId = await db.subcategories.add({
            name: 'Crafting & DIY',
            categoryId: creativeCategoryId as number,
          });

          // Social & Relationships subcategories (5 subcategories)
          const friendsSubId = await db.subcategories.add({
            name: 'Time with Friends',
            categoryId: socialCategoryId as number,
          });
          const datingSubId = await db.subcategories.add({
            name: 'Dating & Romance',
            categoryId: socialCategoryId as number,
          });
          const networkingSubId = await db.subcategories.add({
            name: 'Professional Networking',
            categoryId: socialCategoryId as number,
          });
          const communitySubId = await db.subcategories.add({
            name: 'Community Events',
            categoryId: socialCategoryId as number,
          });
          const partiesSubId = await db.subcategories.add({
            name: 'Parties & Celebrations',
            categoryId: socialCategoryId as number,
          });

          // Household & Maintenance subcategories (6 subcategories)
          const cleaningSubId = await db.subcategories.add({
            name: 'Cleaning & Organization',
            categoryId: householdCategoryId as number,
          });
          const cookingSubId = await db.subcategories.add({
            name: 'Cooking & Meal Prep',
            categoryId: householdCategoryId as number,
          });
          const maintenanceSubId = await db.subcategories.add({
            name: 'Home Maintenance & Repairs',
            categoryId: householdCategoryId as number,
          });
          const gardeningSubId = await db.subcategories.add({
            name: 'Gardening & Yard Work',
            categoryId: householdCategoryId as number,
          });
          const shoppingSubId = await db.subcategories.add({
            name: 'Shopping & Errands',
            categoryId: householdCategoryId as number,
          });
          const decoratingSubId = await db.subcategories.add({
            name: 'Decorating & Interior Design',
            categoryId: householdCategoryId as number,
          });

          // Finance & Business subcategories (5 subcategories)
          const budgetingSubId = await db.subcategories.add({
            name: 'Budgeting & Planning',
            categoryId: financeCategoryId as number,
          });
          const investingSubId = await db.subcategories.add({
            name: 'Investing & Trading',
            categoryId: financeCategoryId as number,
          });
          const taxesSubId = await db.subcategories.add({
            name: 'Taxes & Accounting',
            categoryId: financeCategoryId as number,
          });
          const businessDevSubId = await db.subcategories.add({
            name: 'Business Development',
            categoryId: financeCategoryId as number,
          });
          const freelancingSubId = await db.subcategories.add({
            name: 'Freelancing & Consulting',
            categoryId: financeCategoryId as number,
          });

          // Entertainment & Leisure subcategories (5 subcategories)
          const gamingSubId = await db.subcategories.add({
            name: 'Video Gaming',
            categoryId: entertainmentCategoryId as number,
          });
          const moviesSubId = await db.subcategories.add({
            name: 'Movies & TV Shows',
            categoryId: entertainmentCategoryId as number,
          });
          const podcastsSubId = await db.subcategories.add({
            name: 'Podcasts & Audio Content',
            categoryId: entertainmentCategoryId as number,
          });
          const concertsSubId = await db.subcategories.add({
            name: 'Concerts & Live Events',
            categoryId: entertainmentCategoryId as number,
          });
          const recreationSubId = await db.subcategories.add({
            name: 'Recreation & Fun Activities',
            categoryId: entertainmentCategoryId as number,
          });

          // Travel & Transportation subcategories (4 subcategories)
          const vacationSubId = await db.subcategories.add({
            name: 'Vacation & Holidays',
            categoryId: travelCategoryId as number,
          });
          const businessTravelSubId = await db.subcategories.add({
            name: 'Business Travel',
            categoryId: travelCategoryId as number,
          });
          const commuteSubId = await db.subcategories.add({
            name: 'Daily Commute',
            categoryId: travelCategoryId as number,
          });
          const transportSubId = await db.subcategories.add({
            name: 'Transportation & Logistics',
            categoryId: travelCategoryId as number,
          });

          // Volunteer & Community subcategories (4 subcategories)
          const charitySubId = await db.subcategories.add({
            name: 'Charity & Donations',
            categoryId: volunteerCategoryId as number,
          });
          const volunteerWorkSubId = await db.subcategories.add({
            name: 'Volunteer Work',
            categoryId: volunteerCategoryId as number,
          });
          const mentorshipSubId = await db.subcategories.add({
            name: 'Mentorship & Teaching',
            categoryId: volunteerCategoryId as number,
          });
          const civicSubId = await db.subcategories.add({
            name: 'Civic Engagement',
            categoryId: volunteerCategoryId as number,
          });

          // Spiritual & Mindfulness subcategories (4 subcategories)
          const prayerSubId = await db.subcategories.add({
            name: 'Prayer & Worship',
            categoryId: spiritualCategoryId as number,
          });
          const meditationSpiritualSubId = await db.subcategories.add({
            name: 'Spiritual Meditation',
            categoryId: spiritualCategoryId as number,
          });
          const studySubId = await db.subcategories.add({
            name: 'Spiritual Study',
            categoryId: spiritualCategoryId as number,
          });
          const retreatSubId = await db.subcategories.add({
            name: 'Retreats & Reflection',
            categoryId: spiritualCategoryId as number,
          });

          // Administration subcategories (4 subcategories)
          const emailSubId = await db.subcategories.add({
            name: 'Email Management',
            categoryId: adminCategoryId as number,
          });
          const paperworkSubId = await db.subcategories.add({
            name: 'Paperwork & Documentation',
            categoryId: adminCategoryId as number,
          });
          const appointmentsSubId = await db.subcategories.add({
            name: 'Scheduling & Appointments',
            categoryId: adminCategoryId as number,
          });
          const systemSetupSubId = await db.subcategories.add({
            name: 'System Setup & Configuration',
            categoryId: adminCategoryId as number,
          });

          // Emergency & Urgent subcategories (3 subcategories)
          const emergencySubId = await db.subcategories.add({
            name: 'Emergency Situations',
            categoryId: emergencyCategoryId as number,
          });
          const urgentFixSubId = await db.subcategories.add({
            name: 'Urgent Fixes & Hotfixes',
            categoryId: emergencyCategoryId as number,
          });
          const crisisSubId = await db.subcategories.add({
            name: 'Crisis Management',
            categoryId: emergencyCategoryId as number,
          });

          // Add comprehensive tags
          const angularTagId = await db.tags.add({ name: 'Angular' });
          const typescriptTagId = await db.tags.add({ name: 'TypeScript' });
          const reactTagId = await db.tags.add({ name: 'React' });
          const nodeTagId = await db.tags.add({ name: 'Node.js' });
          const frontendTagId = await db.tags.add({ name: 'Frontend' });
          const backendTagId = await db.tags.add({ name: 'Backend' });
          const bugfixTagId = await db.tags.add({ name: 'Bug Fix' });
          const featureTagId = await db.tags.add({ name: 'New Feature' });
          const refactorTagId = await db.tags.add({ name: 'Refactoring' });
          const urgentTagId = await db.tags.add({ name: 'Urgent' });
          const apiTagId = await db.tags.add({ name: 'API' });
          const uiTagId = await db.tags.add({ name: 'UI/UX' });

          // Generate sessions for the last 4 weeks (28 days)
          const today = new Date();

          for (let dayOffset = daysToGenerate - 1; dayOffset >= 0; dayOffset--) {
            const currentDay = new Date(today);
            currentDay.setDate(currentDay.getDate() - dayOffset);

            // Skip weekends for work-related activities
            const dayOfWeek = currentDay.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            if (isWeekend) {
              // Add varied personal activities on weekends
              const weekendActivities = [
                // Health & wellness activities
                {
                  start: 9,
                  end: 10.5, // 1.5 hours
                  category: personalCategoryId as number,
                  subcategory: Math.random() > 0.5 ? workoutSubId : meditationSubId,
                  tags: [],
                },
                // Personal tasks and hobbies
                {
                  start: 11,
                  end: 12, // 1 hour
                  category: personalCategoryId as number,
                  subcategory:
                    Math.random() > 0.6
                      ? cookingSubId
                      : Math.random() > 0.5
                      ? gamingSubId
                      : bookReadingSubId,
                  tags: [],
                },
                // Learning and projects
                {
                  start: 14,
                  end: 16, // 2 hours
                  category: Math.random() > 0.6 ? learningCategoryId : projectsCategoryId,
                  subcategory:
                    Math.random() > 0.6
                      ? Math.random() > 0.5
                        ? onlineCourseSubId
                        : skillPracticeSubId
                      : Math.random() > 0.5
                      ? webProjectSubId
                      : prototypingSubId,
                  tags: [angularTagId as number, frontendTagId as number],
                },
              ];

              // Sometimes add social activities
              if (Math.random() > 0.7) {
                weekendActivities.push({
                  start: 18,
                  end: 20, // 2 hours
                  category: personalCategoryId as number,
                  subcategory: friendsSubId as number,
                  tags: [],
                });
              }

              const sessions = weekendActivities;

              for (const session of sessions) {
                const startTime = new Date(currentDay);
                startTime.setHours(Math.floor(session.start), (session.start % 1) * 60, 0, 0);

                const endTime = new Date(currentDay);
                endTime.setHours(Math.floor(session.end), (session.end % 1) * 60, 0, 0);

                await db.sessions.add({
                  categoryId: session.category,
                  subcategoryId: session.subcategory,
                  tagIds: session.tags,
                  startedAt: startTime.toISOString(),
                  endedAt: endTime.toISOString(),
                  durationMs: endTime.getTime() - startTime.getTime(),
                });

                totalHours += session.end - session.start;
                sessionCount++;
              }
            } else {
              // Weekday sessions - varied work activities and meetings
              const weekdaySessions = [
                {
                  start: 9,
                  end: 9.25, // 15 min standup or team sync
                  category: meetingsCategoryId as number,
                  subcategory: Math.random() > 0.7 ? standupSubId : teamSyncSubId,
                  tags: [],
                },
                {
                  start: 9.5,
                  end: 12, // 2.5 hours development work
                  category: workCategoryId as number,
                  subcategory:
                    Math.random() > 0.6
                      ? frontendDevSubId
                      : Math.random() > 0.5
                      ? architectureSubId
                      : codeReviewSubId,
                  tags: [
                    Math.random() > 0.5 ? angularTagId : reactTagId,
                    Math.random() > 0.5 ? frontendTagId : backendTagId,
                    Math.random() > 0.7 ? featureTagId : bugfixTagId,
                  ].filter(Boolean) as number[],
                },
                {
                  start: 13,
                  end: 14.5, // 1.5 hours code review, testing, or debugging
                  category: workCategoryId as number,
                  subcategory:
                    Math.random() > 0.4
                      ? codeReviewSubId
                      : Math.random() > 0.5
                      ? testingSubId
                      : debuggingSubId,
                  tags: [
                    typescriptTagId as number,
                    Math.random() > 0.5 ? bugfixTagId : refactorTagId,
                  ].filter(Boolean) as number[],
                },
                {
                  start: 15,
                  end: 17, // 2 hours varied work
                  category: Math.random() > 0.8 ? adminCategoryId : workCategoryId,
                  subcategory:
                    Math.random() > 0.8
                      ? Math.random() > 0.5
                        ? emailSubId
                        : documentationSubId
                      : Math.random() > 0.6
                      ? frontendDevSubId
                      : sprintMeetingSubId,
                  tags: [
                    Math.random() > 0.3 ? nodeTagId : apiTagId,
                    backendTagId as number,
                    Math.random() > 0.8 ? urgentTagId : featureTagId,
                  ].filter(Boolean) as number[],
                },
              ];

              // Add extra sessions randomly
              if (Math.random() > 0.6) {
                weekdaySessions.push({
                  start: 17.5,
                  end: 18.5, // 1 hour evening learning
                  category: learningCategoryId as number,
                  subcategory:
                    Math.random() > 0.4
                      ? onlineCourseSubId
                      : Math.random() > 0.5
                      ? skillPracticeSubId
                      : workshopSubId,
                  tags: [angularTagId as number, frontendTagId as number],
                });
              }

              // Occasionally add client meetings or admin tasks
              if (Math.random() > 0.8) {
                weekdaySessions.push({
                  start: 16,
                  end: 16.5, // 30 min client meeting or admin work
                  category: Math.random() > 0.6 ? meetingsCategoryId : adminCategoryId,
                  subcategory: Math.random() > 0.6 ? clientMeetingSubId : systemSetupSubId,
                  tags: [],
                });
              }

              // Add weekly meetings
              if (dayOfWeek === 1) {
                // Monday - Sprint Planning
                weekdaySessions.push({
                  start: 14,
                  end: 15.5, // 1.5 hours
                  category: meetingsCategoryId as number,
                  subcategory: sprintMeetingSubId as number,
                  tags: [],
                });
              }

              if (dayOfWeek === 3) {
                // Wednesday - 1-on-1
                weekdaySessions.push({
                  start: 16,
                  end: 16.5, // 30 minutes
                  category: meetingsCategoryId as number,
                  subcategory: oneOnOneSubId as number,
                  tags: [],
                });
              }

              for (const session of weekdaySessions) {
                const startTime = new Date(currentDay);
                startTime.setHours(Math.floor(session.start), (session.start % 1) * 60, 0, 0);

                const endTime = new Date(currentDay);
                endTime.setHours(Math.floor(session.end), (session.end % 1) * 60, 0, 0);

                await db.sessions.add({
                  categoryId: session.category,
                  subcategoryId: session.subcategory,
                  tagIds: session.tags,
                  startedAt: startTime.toISOString(),
                  endedAt: endTime.toISOString(),
                  durationMs: endTime.getTime() - startTime.getTime(),
                });

                totalHours += session.end - session.start;
                sessionCount++;
              }
            }
          }

          // Add some side project sessions across the month
          for (let i = 0; i < 8; i++) {
            const randomDay = new Date(today);
            randomDay.setDate(randomDay.getDate() - Math.floor(Math.random() * daysToGenerate));

            const startHour = 19 + Math.random() * 2; // Evening hours
            const duration = 1 + Math.random() * 2; // 1-3 hours

            const startTime = new Date(randomDay);
            startTime.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);

            const endTime = new Date(randomDay);
            endTime.setHours(
              Math.floor(startHour + duration),
              ((startHour + duration) % 1) * 60,
              0,
              0
            );

            await db.sessions.add({
              categoryId: projectsCategoryId as number,
              subcategoryId: webProjectSubId as number,
              tagIds: [angularTagId as number, typescriptTagId as number, featureTagId as number],
              startedAt: startTime.toISOString(),
              endedAt: endTime.toISOString(),
              durationMs: endTime.getTime() - startTime.getTime(),
            });

            totalHours += duration;
            sessionCount++;
          }
        }
      );

      // Reload the page data
      await this.loadAllData();

      alert(
        `Complex demo data seeded successfully!\n\n` +
          `Created comprehensive data spanning ${daysToGenerate} days with:\n` +
          `• 6 categories with 25+ subcategories\n` +
          `• 12 different tags\n` +
          `• ${sessionCount} sessions totaling ~${Math.round(totalHours)} hours\n` +
          `• Mix of work, personal, learning, meetings, admin, and project activities\n` +
          `• Weekend vs weekday activity patterns\n` +
          `• Varied subcategory distribution for realistic reporting\n\n` +
          `Perfect for testing weekly and monthly views with detailed categorization!`
      );

      console.log('Complex demo data seeded successfully', {
        totalHours: Math.round(totalHours),
        sessionCount,
        daysSpanned: daysToGenerate,
      });
    } catch (error) {
      console.error('Error seeding complex demo data:', error);
      alert(
        `Failed to seed complex demo data: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    } finally {
      this.isSeedingDemo.set(false);
    }
  }

  /**
   * Seed comprehensive 6-month demo data with extensive categories and subcategories
   * Creates realistic work patterns with seasonal variations and project cycles
   */
  async seedSixMonthDemoData(): Promise<void> {
    if (this.isSeedingDemo()) return;

    this.isSeedingDemo.set(true);

    try {
      // Clear existing data first
      const confirmClear = confirm(
        'This will clear all existing data and add comprehensive demo data spanning 6 months with extensive categories. Are you sure you want to continue?'
      );

      if (!confirmClear) {
        return;
      }

      // Variables to track demo data creation
      const daysToGenerate = 180; // 6 months
      let totalHours = 0;
      let sessionCount = 0;

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

          // Add extensive categories
          const workCategoryId = await db.categories.add({ name: 'Work' });
          const projectsCategoryId = await db.categories.add({ name: 'Projects' });
          const learningCategoryId = await db.categories.add({ name: 'Learning' });
          const meetingsCategoryId = await db.categories.add({ name: 'Meetings' });
          const personalCategoryId = await db.categories.add({ name: 'Personal' });
          const healthCategoryId = await db.categories.add({ name: 'Health & Fitness' });
          const creativeCategoryId = await db.categories.add({ name: 'Creative' });
          const socialCategoryId = await db.categories.add({ name: 'Social' });
          const maintenanceCategoryId = await db.categories.add({ name: 'Maintenance' });
          const businessCategoryId = await db.categories.add({ name: 'Business' });

          // Work subcategories
          const frontendDevSubId = await db.subcategories.add({
            name: 'Frontend Development',
            categoryId: workCategoryId as number,
          });
          const backendDevSubId = await db.subcategories.add({
            name: 'Backend Development',
            categoryId: workCategoryId as number,
          });
          const fullstackDevSubId = await db.subcategories.add({
            name: 'Full Stack Development',
            categoryId: workCategoryId as number,
          });
          const codeReviewSubId = await db.subcategories.add({
            name: 'Code Review',
            categoryId: workCategoryId as number,
          });
          const testingSubId = await db.subcategories.add({
            name: 'Testing',
            categoryId: workCategoryId as number,
          });
          const debuggingSubId = await db.subcategories.add({
            name: 'Debugging',
            categoryId: workCategoryId as number,
          });
          const deploymentSubId = await db.subcategories.add({
            name: 'Deployment',
            categoryId: workCategoryId as number,
          });
          const documentationSubId = await db.subcategories.add({
            name: 'Documentation',
            categoryId: workCategoryId as number,
          });
          const architectureSubId = await db.subcategories.add({
            name: 'Architecture Design',
            categoryId: workCategoryId as number,
          });
          const refactoringSubId = await db.subcategories.add({
            name: 'Refactoring',
            categoryId: workCategoryId as number,
          });

          // Projects subcategories
          const webAppSubId = await db.subcategories.add({
            name: 'Web Application',
            categoryId: projectsCategoryId as number,
          });
          const mobileAppSubId = await db.subcategories.add({
            name: 'Mobile Application',
            categoryId: projectsCategoryId as number,
          });
          const apiProjectSubId = await db.subcategories.add({
            name: 'API Development',
            categoryId: projectsCategoryId as number,
          });
          const openSourceSubId = await db.subcategories.add({
            name: 'Open Source',
            categoryId: projectsCategoryId as number,
          });
          const hackathonSubId = await db.subcategories.add({
            name: 'Hackathon',
            categoryId: projectsCategoryId as number,
          });
          const prototypingSubId = await db.subcategories.add({
            name: 'Prototyping',
            categoryId: projectsCategoryId as number,
          });

          // Learning subcategories
          const onlineCourseSubId = await db.subcategories.add({
            name: 'Online Courses',
            categoryId: learningCategoryId as number,
          });
          const bookReadingSubId = await db.subcategories.add({
            name: 'Technical Reading',
            categoryId: learningCategoryId as number,
          });
          const tutorialSubId = await db.subcategories.add({
            name: 'Tutorials',
            categoryId: learningCategoryId as number,
          });
          const workshopSubId = await db.subcategories.add({
            name: 'Workshops',
            categoryId: learningCategoryId as number,
          });
          const certificationSubId = await db.subcategories.add({
            name: 'Certification Study',
            categoryId: learningCategoryId as number,
          });
          const researchSubId = await db.subcategories.add({
            name: 'Research',
            categoryId: learningCategoryId as number,
          });
          const experimentSubId = await db.subcategories.add({
            name: 'Experimentation',
            categoryId: learningCategoryId as number,
          });

          // Meeting subcategories
          const standupSubId = await db.subcategories.add({
            name: 'Daily Standup',
            categoryId: meetingsCategoryId as number,
          });
          const sprintPlanningSubId = await db.subcategories.add({
            name: 'Sprint Planning',
            categoryId: meetingsCategoryId as number,
          });
          const retrospectiveSubId = await db.subcategories.add({
            name: 'Retrospective',
            categoryId: meetingsCategoryId as number,
          });
          const oneOnOneSubId = await db.subcategories.add({
            name: '1-on-1',
            categoryId: meetingsCategoryId as number,
          });
          const clientMeetingSubId = await db.subcategories.add({
            name: 'Client Meeting',
            categoryId: meetingsCategoryId as number,
          });
          const teamMeetingSubId = await db.subcategories.add({
            name: 'Team Meeting',
            categoryId: meetingsCategoryId as number,
          });
          const reviewMeetingSubId = await db.subcategories.add({
            name: 'Code Review Meeting',
            categoryId: meetingsCategoryId as number,
          });

          // Personal subcategories
          const readingSubId = await db.subcategories.add({
            name: 'Reading',
            categoryId: personalCategoryId as number,
          });
          const cookingSubId = await db.subcategories.add({
            name: 'Cooking',
            categoryId: personalCategoryId as number,
          });
          const cleaningSubId = await db.subcategories.add({
            name: 'Cleaning',
            categoryId: personalCategoryId as number,
          });
          const shoppingSubId = await db.subcategories.add({
            name: 'Shopping',
            categoryId: personalCategoryId as number,
          });
          const familyTimeSubId = await db.subcategories.add({
            name: 'Family Time',
            categoryId: personalCategoryId as number,
          });
          const hobbiesSubId = await db.subcategories.add({
            name: 'Hobbies',
            categoryId: personalCategoryId as number,
          });

          // Health & Fitness subcategories
          const workoutSubId = await db.subcategories.add({
            name: 'Workout',
            categoryId: healthCategoryId as number,
          });
          const yogaSubId = await db.subcategories.add({
            name: 'Yoga',
            categoryId: healthCategoryId as number,
          });
          const runningSubId = await db.subcategories.add({
            name: 'Running',
            categoryId: healthCategoryId as number,
          });
          const meditationSubId = await db.subcategories.add({
            name: 'Meditation',
            categoryId: healthCategoryId as number,
          });
          const doctorVisitSubId = await db.subcategories.add({
            name: 'Doctor Visit',
            categoryId: healthCategoryId as number,
          });

          // Creative subcategories
          const designSubId = await db.subcategories.add({
            name: 'Design',
            categoryId: creativeCategoryId as number,
          });
          const writingSubId = await db.subcategories.add({
            name: 'Writing',
            categoryId: creativeCategoryId as number,
          });
          const photographySubId = await db.subcategories.add({
            name: 'Photography',
            categoryId: creativeCategoryId as number,
          });
          const musicSubId = await db.subcategories.add({
            name: 'Music',
            categoryId: creativeCategoryId as number,
          });

          // Social subcategories
          const friendsSubId = await db.subcategories.add({
            name: 'Friends',
            categoryId: socialCategoryId as number,
          });
          const networkingSubId = await db.subcategories.add({
            name: 'Networking',
            categoryId: socialCategoryId as number,
          });
          const communitySubId = await db.subcategories.add({
            name: 'Community Events',
            categoryId: socialCategoryId as number,
          });

          // Maintenance subcategories
          const emailSubId = await db.subcategories.add({
            name: 'Email',
            categoryId: maintenanceCategoryId as number,
          });
          const adminTasksSubId = await db.subcategories.add({
            name: 'Admin Tasks',
            categoryId: maintenanceCategoryId as number,
          });
          const setupSubId = await db.subcategories.add({
            name: 'Environment Setup',
            categoryId: maintenanceCategoryId as number,
          });
          const backupSubId = await db.subcategories.add({
            name: 'Backup & Maintenance',
            categoryId: maintenanceCategoryId as number,
          });

          // Business subcategories
          const planningBusinessSubId = await db.subcategories.add({
            name: 'Business Planning',
            categoryId: businessCategoryId as number,
          });
          const marketingSubId = await db.subcategories.add({
            name: 'Marketing',
            categoryId: businessCategoryId as number,
          });
          const financeSubId = await db.subcategories.add({
            name: 'Finance',
            categoryId: businessCategoryId as number,
          });
          const clientWorkSubId = await db.subcategories.add({
            name: 'Client Work',
            categoryId: businessCategoryId as number,
          });

          // Add comprehensive tags
          const angularTagId = await db.tags.add({ name: 'Angular' });
          const reactTagId = await db.tags.add({ name: 'React' });
          const vueTagId = await db.tags.add({ name: 'Vue.js' });
          const typescriptTagId = await db.tags.add({ name: 'TypeScript' });
          const javascriptTagId = await db.tags.add({ name: 'JavaScript' });
          const nodeTagId = await db.tags.add({ name: 'Node.js' });
          const pythonTagId = await db.tags.add({ name: 'Python' });
          const javaTagId = await db.tags.add({ name: 'Java' });
          const csharpTagId = await db.tags.add({ name: 'C#' });
          const phpTagId = await db.tags.add({ name: 'PHP' });
          const htmlTagId = await db.tags.add({ name: 'HTML' });
          const cssTagId = await db.tags.add({ name: 'CSS' });
          const sassTagId = await db.tags.add({ name: 'SASS' });
          const sqlTagId = await db.tags.add({ name: 'SQL' });
          const mongoTagId = await db.tags.add({ name: 'MongoDB' });
          const postgresTagId = await db.tags.add({ name: 'PostgreSQL' });
          const redisTagId = await db.tags.add({ name: 'Redis' });
          const dockerTagId = await db.tags.add({ name: 'Docker' });
          const kubernetesTagId = await db.tags.add({ name: 'Kubernetes' });
          const awsTagId = await db.tags.add({ name: 'AWS' });
          const azureTagId = await db.tags.add({ name: 'Azure' });
          const gcpTagId = await db.tags.add({ name: 'Google Cloud' });
          const gitTagId = await db.tags.add({ name: 'Git' });
          const cicdTagId = await db.tags.add({ name: 'CI/CD' });
          const testingTagId = await db.tags.add({ name: 'Testing' });
          const jestTagId = await db.tags.add({ name: 'Jest' });
          const cypressTagId = await db.tags.add({ name: 'Cypress' });
          const bugfixTagId = await db.tags.add({ name: 'Bug Fix' });
          const featureTagId = await db.tags.add({ name: 'Feature' });
          const refactorTagId = await db.tags.add({ name: 'Refactor' });
          const optimizationTagId = await db.tags.add({ name: 'Optimization' });
          const securityTagId = await db.tags.add({ name: 'Security' });
          const performanceTagId = await db.tags.add({ name: 'Performance' });
          const uiTagId = await db.tags.add({ name: 'UI' });
          const uxTagId = await db.tags.add({ name: 'UX' });
          const apiTagId = await db.tags.add({ name: 'API' });
          const frontendTagId = await db.tags.add({ name: 'Frontend' });
          const backendTagId = await db.tags.add({ name: 'Backend' });
          const fullstackTagId = await db.tags.add({ name: 'Full Stack' });
          const mobileTagId = await db.tags.add({ name: 'Mobile' });
          const webTagId = await db.tags.add({ name: 'Web' });
          const desktopTagId = await db.tags.add({ name: 'Desktop' });
          const urgentTagId = await db.tags.add({ name: 'Urgent' });
          const researchTagId = await db.tags.add({ name: 'Research' });
          const learningTagId = await db.tags.add({ name: 'Learning' });
          const experimentalTagId = await db.tags.add({ name: 'Experimental' });

          // Generate sessions for the past 6 months with realistic patterns
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - daysToGenerate);

          for (let dayOffset = 0; dayOffset < daysToGenerate; dayOffset++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + dayOffset);
            const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 6 = Saturday
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isMonday = dayOfWeek === 1;
            const isFriday = dayOfWeek === 5;

            // Skip some days occasionally (holidays, sick days, etc.)
            if (Math.random() > 0.9) continue;

            let daySessions: any[] = [];

            if (!isWeekend) {
              // Weekday work patterns with variations
              const workIntensity = Math.random();

              if (workIntensity > 0.8) {
                // Heavy work day
                daySessions = [
                  {
                    start: 8.5,
                    end: 10.5,
                    category: workCategoryId as number,
                    subcategory: Math.random() > 0.5 ? frontendDevSubId : backendDevSubId,
                    tags: [angularTagId, typescriptTagId, featureTagId].filter(
                      () => Math.random() > 0.3
                    ),
                  },
                  {
                    start: 11,
                    end: 12,
                    category: meetingsCategoryId as number,
                    subcategory: isMonday
                      ? sprintPlanningSubId
                      : isFriday
                      ? retrospectiveSubId
                      : standupSubId,
                    tags: [],
                  },
                  {
                    start: 13,
                    end: 16.5,
                    category: workCategoryId as number,
                    subcategory:
                      Math.random() > 0.6
                        ? fullstackDevSubId
                        : Math.random() > 0.5
                        ? testingSubId
                        : codeReviewSubId,
                    tags: [
                      reactTagId,
                      javascriptTagId,
                      Math.random() > 0.5 ? bugfixTagId : optimizationTagId,
                    ].filter(() => Math.random() > 0.4),
                  },
                  {
                    start: 17,
                    end: 18.5,
                    category: projectsCategoryId as number,
                    subcategory: Math.random() > 0.5 ? webAppSubId : openSourceSubId,
                    tags: [nodeTagId, apiTagId, experimentalTagId].filter(
                      () => Math.random() > 0.5
                    ),
                  },
                ];
              } else if (workIntensity > 0.5) {
                // Normal work day
                daySessions = [
                  {
                    start: 9,
                    end: 10.5,
                    category: workCategoryId as number,
                    subcategory: Math.random() > 0.6 ? frontendDevSubId : architectureSubId,
                    tags: [vueTagId, cssTagId, uiTagId].filter(() => Math.random() > 0.4),
                  },
                  {
                    start: 11,
                    end: 11.5,
                    category: meetingsCategoryId as number,
                    subcategory: standupSubId,
                    tags: [],
                  },
                  {
                    start: 13.5,
                    end: 16,
                    category: workCategoryId as number,
                    subcategory: Math.random() > 0.5 ? backendDevSubId : documentationSubId,
                    tags: [pythonTagId, postgresTagId, performanceTagId].filter(
                      () => Math.random() > 0.3
                    ),
                  },
                ];
              } else {
                // Light work day
                daySessions = [
                  {
                    start: 9.5,
                    end: 11,
                    category: learningCategoryId as number,
                    subcategory: Math.random() > 0.5 ? onlineCourseSubId : researchSubId,
                    tags: [learningTagId, Math.random() > 0.5 ? kubernetesTagId : awsTagId].filter(
                      () => Math.random() > 0.4
                    ),
                  },
                  {
                    start: 14,
                    end: 15.5,
                    category: maintenanceCategoryId as number,
                    subcategory: Math.random() > 0.5 ? emailSubId : setupSubId,
                    tags: [dockerTagId, gitTagId].filter(() => Math.random() > 0.6),
                  },
                ];
              }

              // Add occasional learning sessions
              if (Math.random() > 0.7) {
                daySessions.push({
                  start: 18.5,
                  end: 19.5,
                  category: learningCategoryId as number,
                  subcategory: Math.random() > 0.6 ? tutorialSubId : bookReadingSubId,
                  tags: [
                    researchTagId,
                    Math.random() > 0.5 ? securityTagId : performanceTagId,
                  ].filter(() => Math.random() > 0.5),
                });
              }
            } else {
              // Weekend patterns - more personal and creative work
              const weekendActivity = Math.random();

              if (weekendActivity > 0.6) {
                daySessions = [
                  {
                    start: 10,
                    end: 11.5,
                    category: healthCategoryId as number,
                    subcategory:
                      Math.random() > 0.5
                        ? workoutSubId
                        : Math.random() > 0.5
                        ? runningSubId
                        : yogaSubId,
                    tags: [],
                  },
                  {
                    start: 14,
                    end: 16,
                    category: projectsCategoryId as number,
                    subcategory: Math.random() > 0.5 ? mobileAppSubId : prototypingSubId,
                    tags: [mobileTagId, experimentalTagId].filter(() => Math.random() > 0.5),
                  },
                ];
              } else if (weekendActivity > 0.3) {
                daySessions = [
                  {
                    start: 11,
                    end: 12,
                    category: personalCategoryId as number,
                    subcategory: Math.random() > 0.5 ? cookingSubId : cleaningSubId,
                    tags: [],
                  },
                  {
                    start: 15,
                    end: 17,
                    category: creativeCategoryId as number,
                    subcategory:
                      Math.random() > 0.5
                        ? designSubId
                        : Math.random() > 0.5
                        ? writingSubId
                        : photographySubId,
                    tags: [uiTagId, uxTagId].filter(() => Math.random() > 0.6),
                  },
                ];
              }

              // Weekend social activities
              if (Math.random() > 0.7) {
                daySessions.push({
                  start: 19,
                  end: 21,
                  category: socialCategoryId as number,
                  subcategory: Math.random() > 0.5 ? friendsSubId : communitySubId,
                  tags: [],
                });
              }
            }

            // Create sessions for this day
            for (const session of daySessions) {
              const startTime = new Date(currentDay);
              startTime.setHours(Math.floor(session.start), (session.start % 1) * 60, 0, 0);

              const endTime = new Date(currentDay);
              endTime.setHours(Math.floor(session.end), (session.end % 1) * 60, 0, 0);

              const durationHours = session.end - session.start;
              totalHours += durationHours;
              sessionCount++;

              await db.sessions.add({
                categoryId: session.category,
                subcategoryId: session.subcategory,
                tagIds: session.tags || [],
                startedAt: startTime.toISOString(),
                endedAt: endTime.toISOString(),
                durationMs: endTime.getTime() - startTime.getTime(),
              });
            }
          }
        }
      );

      // Show success message
      alert(
        `Comprehensive 6-month demo data seeded successfully!\\n\\n` +
          `Created extensive data spanning ${daysToGenerate} days (6 months) with:\\n` +
          `• 10 major categories with 50+ subcategories\\n` +
          `• 40+ different technology and workflow tags\\n` +
          `• ${sessionCount} sessions totaling ~${Math.round(totalHours)} hours\\n` +
          `• Realistic work patterns with weekend variations\\n` +
          `• Seasonal project cycles and learning trends\\n` +
          `• Mix of work, projects, learning, health, creative, and social activities\\n\\n` +
          'This comprehensive dataset provides deep insights into long-term productivity patterns!'
      );
    } catch (error) {
      console.error('Error seeding 6-month demo data:', error);
      alert('Error seeding demo data. Please check the console for details.');
    } finally {
      this.isSeedingDemo.set(false);
      this.loadAllData();
    }
  }
}
