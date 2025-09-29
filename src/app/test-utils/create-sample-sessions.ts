import { db } from '../core/data/db.service';

/**
 * Creates sample sessions for testing the reports functionality
 */
export async function createSampleSessions(): Promise<void> {
  try {
    // Get existing categories, subcategories, and tags
    const categories = await db.categories.toArray();
    const subcategories = await db.subcategories.toArray();
    const tags = await db.tags.toArray();

    if (categories.length === 0) {
      console.log('No categories found. Please run seed data first.');
      return;
    }

    // Create sample sessions for today
    const today = new Date();
    const todayStr = today.toISOString();

    // Sample session data for the current day
    const session1Start = new Date(today.setHours(9, 0, 0, 0));
    const session1End = new Date(today.setHours(11, 30, 0, 0));
    const session2Start = new Date(today.setHours(13, 0, 0, 0));
    const session2End = new Date(today.setHours(14, 0, 0, 0));
    const session3Start = new Date(today.setHours(15, 30, 0, 0));
    const session3End = new Date(today.setHours(16, 45, 0, 0));

    const sampleSessions = [
      {
        categoryId: categories[0].id!, // Work
        subcategoryId: subcategories.find((s) => s.name === 'Development')?.id,
        tagIds: [
          tags.find((t) => t.name === 'Angular')?.id,
          tags.find((t) => t.name === 'Frontend')?.id,
        ].filter(Boolean) as number[],
        startedAt: session1Start.toISOString(),
        endedAt: session1End.toISOString(),
        durationMs: session1End.getTime() - session1Start.getTime(),
      },
      {
        categoryId: categories[0].id!, // Work
        subcategoryId: subcategories.find((s) => s.name === 'Meetings')?.id,
        tagIds: [tags.find((t) => t.name === 'Planning')?.id].filter(Boolean) as number[],
        startedAt: session2Start.toISOString(),
        endedAt: session2End.toISOString(),
        durationMs: session2End.getTime() - session2Start.getTime(),
      },
      {
        categoryId: categories.find((c) => c.name === 'Learning')?.id!,
        subcategoryId: subcategories.find((s) => s.name === 'Tutorials')?.id,
        tagIds: [
          tags.find((t) => t.name === 'TypeScript')?.id,
          tags.find((t) => t.name === 'Research')?.id,
        ].filter(Boolean) as number[],
        startedAt: session3Start.toISOString(),
        endedAt: session3End.toISOString(),
        durationMs: session3End.getTime() - session3Start.getTime(),
      },
    ];

    // Add sessions to database
    await db.sessions.bulkAdd(sampleSessions);

    console.log('Sample sessions created for today:', sampleSessions.length);
  } catch (error) {
    console.error('Error creating sample sessions:', error);
  }
}
