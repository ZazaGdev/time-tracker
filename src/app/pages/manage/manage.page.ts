import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { TaxonomyService } from '../../core/services';
import { Category, Subcategory, Tag } from '../../core/models';

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
}
