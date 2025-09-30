// Angular Core
import { Injectable } from '@angular/core';

// Application Data
import { db } from '../data/db.service';

// Application Models
import { Category, Subcategory, Tag } from '../models';

@Injectable({
  providedIn: 'root',
})
export class TaxonomyService {
  /**
   * Gets all categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      return await db.categories.orderBy('name').toArray();
    } catch (error) {
      console.error('Error loading categories:', error);
      return [];
    }
  }

  /**
   * Gets subcategories for a specific category
   */
  async getSubcategoriesForCategory(categoryId: number): Promise<Subcategory[]> {
    try {
      return await db.subcategories.where('categoryId').equals(categoryId).sortBy('name');
    } catch (error) {
      console.error('Error loading subcategories:', error);
      return [];
    }
  }

  /**
   * Gets all tags
   */
  async getTags(): Promise<Tag[]> {
    try {
      return await db.tags.orderBy('name').toArray();
    } catch (error) {
      console.error('Error loading tags:', error);
      return [];
    }
  }

  /**
   * Adds a new category
   */
  async addCategory(name: string): Promise<number> {
    try {
      return (await db.categories.add({ name })) as number;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  /**
   * Deletes a category and all its subcategories
   */
  async deleteCategory(id: number): Promise<void> {
    try {
      // Delete all subcategories first
      await db.subcategories.where('categoryId').equals(id).delete();
      // Delete the category
      await db.categories.delete(id);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Adds a new subcategory
   */
  async addSubcategory(name: string, categoryId: number): Promise<number> {
    try {
      return (await db.subcategories.add({ name, categoryId })) as number;
    } catch (error) {
      console.error('Error adding subcategory:', error);
      throw error;
    }
  }

  /**
   * Deletes a subcategory
   */
  async deleteSubcategory(id: number): Promise<void> {
    try {
      await db.subcategories.delete(id);
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      throw error;
    }
  }

  /**
   * Adds a new tag
   */
  async addTag(name: string): Promise<number> {
    try {
      return (await db.tags.add({ name })) as number;
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
    }
  }

  /**
   * Deletes a tag
   */
  async deleteTag(id: number): Promise<void> {
    try {
      await db.tags.delete(id);
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }
}
