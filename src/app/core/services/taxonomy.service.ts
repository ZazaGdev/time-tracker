import { Injectable } from '@angular/core';
import { db } from '../data/db.service';
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
}