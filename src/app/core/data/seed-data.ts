import { db } from './db.service';

/**
 * Seeds the database with sample data for testing
 */
export async function seedSampleData(): Promise<void> {
  try {
    // Check if data already exists
    const existingCategories = await db.categories.count();
    if (existingCategories > 0) {
      console.log('Sample data already exists, skipping seed');
      return;
    }

    // Add sample categories
    const workCategoryId = await db.categories.add({ name: 'Work' });
    const personalCategoryId = await db.categories.add({ name: 'Personal' });
    const learningCategoryId = await db.categories.add({ name: 'Learning' });

    // Add sample subcategories
    await db.subcategories.bulkAdd([
      { name: 'Development', categoryId: workCategoryId as number },
      { name: 'Meetings', categoryId: workCategoryId as number },
      { name: 'Email', categoryId: workCategoryId as number },
      { name: 'Exercise', categoryId: personalCategoryId as number },
      { name: 'Reading', categoryId: personalCategoryId as number },
      { name: 'Tutorials', categoryId: learningCategoryId as number },
      { name: 'Documentation', categoryId: learningCategoryId as number },
    ]);

    // Add sample tags
    await db.tags.bulkAdd([
      { name: 'Angular' },
      { name: 'TypeScript' },
      { name: 'Frontend' },
      { name: 'Backend' },
      { name: 'Research' },
      { name: 'Planning' },
      { name: 'Bug Fix' },
      { name: 'Feature' },
    ]);

    console.log('Sample data seeded successfully');
  } catch (error) {
    console.error('Error seeding sample data:', error);
  }
}