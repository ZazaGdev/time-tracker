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
    const tagIds = await db.tags.bulkAdd([
      { name: 'Angular' },
      { name: 'TypeScript' },
      { name: 'Frontend' },
      { name: 'Backend' },
      { name: 'Research' },
      { name: 'Planning' },
      { name: 'Bug Fix' },
      { name: 'Feature' },
    ]);

    // Add sample sessions for the past week to demonstrate chart functionality
    const now = new Date();
    const sampleSessions = [];

    // Create sessions for the past 7 days
    for (let i = 6; i >= 0; i--) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - i);

      // Morning work session (Development)
      const morningStart = new Date(sessionDate);
      morningStart.setHours(9, 0, 0, 0);
      const morningEnd = new Date(morningStart);
      morningEnd.setHours(11, 30, 0, 0);

      sampleSessions.push({
        name: `Development Session - Day ${7 - i}`,
        categoryId: workCategoryId as number,
        subcategoryId: undefined,
        tagIds: [1, 2], // Angular, TypeScript
        startedAt: morningStart.toISOString(),
        endedAt: morningEnd.toISOString(),
        durationMs: morningEnd.getTime() - morningStart.getTime(),
        notes: `Sample development work for ${sessionDate.toDateString()}`,
      });

      // Afternoon work session (Meetings) - only on weekdays
      if (sessionDate.getDay() >= 1 && sessionDate.getDay() <= 5) {
        const afternoonStart = new Date(sessionDate);
        afternoonStart.setHours(14, 0, 0, 0);
        const afternoonEnd = new Date(afternoonStart);
        afternoonEnd.setHours(15, 0, 0, 0);

        sampleSessions.push({
          name: `Team Meeting - Day ${7 - i}`,
          categoryId: workCategoryId as number,
          subcategoryId: undefined,
          tagIds: [6], // Planning
          startedAt: afternoonStart.toISOString(),
          endedAt: afternoonEnd.toISOString(),
          durationMs: afternoonEnd.getTime() - afternoonStart.getTime(),
          notes: `Daily standup meeting`,
        });
      }

      // Evening learning session - every other day
      if (i % 2 === 0) {
        const eveningStart = new Date(sessionDate);
        eveningStart.setHours(19, 0, 0, 0);
        const eveningEnd = new Date(eveningStart);
        eveningEnd.setHours(20, 30, 0, 0);

        sampleSessions.push({
          name: `Learning Session - Day ${7 - i}`,
          categoryId: learningCategoryId as number,
          subcategoryId: undefined,
          tagIds: [5], // Research
          startedAt: eveningStart.toISOString(),
          endedAt: eveningEnd.toISOString(),
          durationMs: eveningEnd.getTime() - eveningStart.getTime(),
          notes: `Self-study and skill development`,
        });
      }

      // Personal activities on weekends
      if (sessionDate.getDay() === 0 || sessionDate.getDay() === 6) {
        const personalStart = new Date(sessionDate);
        personalStart.setHours(10, 0, 0, 0);
        const personalEnd = new Date(personalStart);
        personalEnd.setHours(11, 0, 0, 0);

        sampleSessions.push({
          name: `Weekend Activity - Day ${7 - i}`,
          categoryId: personalCategoryId as number,
          subcategoryId: undefined,
          tagIds: [],
          startedAt: personalStart.toISOString(),
          endedAt: personalEnd.toISOString(),
          durationMs: personalEnd.getTime() - personalStart.getTime(),
          notes: `Weekend personal time`,
        });
      }
    }

    await db.sessions.bulkAdd(sampleSessions);

    console.log('Sample data seeded successfully with', sampleSessions.length, 'sample sessions');
  } catch (error) {
    console.error('Error seeding sample data:', error);
  }
}
