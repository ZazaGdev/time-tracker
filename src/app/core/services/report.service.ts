import { Injectable } from '@angular/core';
import { startOfDay, endOfDay } from 'date-fns';
import { db } from '../data/db.service';
import { Session } from '../models';

export interface DayTotals {
  categoryId: number;
  subcategoryId?: number;
  tagIds: number[];
  totalMs: number;
}

/**
 * Interface for time window boundaries
 */
interface TimeWindow {
  start: Date;
  end: Date;
}

/**
 * Result of clamping a session to a time window
 */
interface ClampedSession {
  /** The clamped duration in milliseconds, 0 if no overlap */
  durationMs: number;
  /** Whether the session overlaps with the window */
  hasOverlap: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  /**
   * Utility function to clamp a session's time range to a specific time window.
   * Ensures that reported durations never exceed the window bounds and only
   * reflect the actual overlap between the session and the target window.
   *
   * @param sessionStart Start time of the session
   * @param sessionEnd End time of the session
   * @param windowStart Start of the target time window
   * @param windowEnd End of the target time window
   * @returns ClampedSession with duration and overlap information
   */
  private clampSessionToWindow(
    sessionStart: Date,
    sessionEnd: Date,
    windowStart: Date,
    windowEnd: Date
  ): ClampedSession {
    // Calculate effective start and end within the window
    const effectiveStart = sessionStart < windowStart ? windowStart : sessionStart;
    const effectiveEnd = sessionEnd > windowEnd ? windowEnd : sessionEnd;

    // Check if there's any overlap
    if (effectiveStart >= effectiveEnd) {
      return {
        durationMs: 0,
        hasOverlap: false,
      };
    }

    // Calculate clamped duration
    const durationMs = effectiveEnd.getTime() - effectiveStart.getTime();

    // Ensure duration is never negative (additional safety check)
    return {
      durationMs: Math.max(0, durationMs),
      hasOverlap: true,
    };
  }

  /**
   * Gets totals for a specific date, grouped by category/subcategory/tags.
   * Uses clamping logic to ensure totals only include overlap with the selected day
   * and never exceed 24 hours total.
   *
   * @param date The date to get totals for
   * @returns Array of totals sorted by totalMs descending
   */
  async totalsForDate(date: Date): Promise<DayTotals[]> {
    try {
      // Get start and end of the specified day
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayStartISO = dayStart.toISOString();
      const dayEndISO = dayEnd.toISOString();

      // Fetch sessions that started within the day
      const sessions = await db.sessions
        .where('startedAt')
        .between(dayStartISO, dayEndISO, true, true)
        .toArray();

      // Group sessions and sum durations
      const groupMap = new Map<string, DayTotals>();

      for (const session of sessions) {
        // Parse session times
        const sessionStart = new Date(session.startedAt);
        const sessionEnd = new Date(session.endedAt);

        // Clamp session to the target day using utility function
        const clampedSession = this.clampSessionToWindow(
          sessionStart,
          sessionEnd,
          dayStart,
          dayEnd
        );

        // Skip sessions that don't overlap with the target day
        if (!clampedSession.hasOverlap) {
          continue;
        }

        // Create grouping key: categoryId|subcategoryId|sortedTagIds
        const sortedTagIds = [...session.tagIds].sort((a, b) => a - b);
        const groupKey = `${session.categoryId}|${session.subcategoryId || ''}|${sortedTagIds.join(
          ','
        )}`;

        // Get or create group
        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            categoryId: session.categoryId,
            subcategoryId: session.subcategoryId,
            tagIds: sortedTagIds,
            totalMs: 0,
          });
        }

        // Add clamped duration to total
        const group = groupMap.get(groupKey)!;
        group.totalMs += clampedSession.durationMs;
      }

      // Convert map to array and sort by totalMs descending
      const dayTotals = Array.from(groupMap.values()).sort((a, b) => b.totalMs - a.totalMs);

      // Validation: Ensure no individual total exceeds 24 hours (86,400,000 ms)
      // This is a safety check to catch potential data issues or logic errors
      const MAX_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      dayTotals.forEach((total) => {
        if (total.totalMs > MAX_DAY_MS) {
          console.warn(
            `Warning: Total duration (${Math.round(total.totalMs / 1000 / 60)} minutes) ` +
              `exceeds 24 hours for category ${total.categoryId}. This may indicate data issues.`
          );
          // Clamp to 24 hours maximum as safety measure
          total.totalMs = Math.min(total.totalMs, MAX_DAY_MS);
        }
      });

      return dayTotals;
    } catch (error) {
      console.error('Error calculating day totals:', error);
      throw error;
    }
  }

  /**
   * Helper method to get the total tracked hours for a specific date.
   * Useful for validation and summary reporting.
   *
   * @param date The date to calculate total hours for
   * @returns Total hours tracked on the date (max 24.0)
   */
  async getTotalHoursForDate(date: Date): Promise<number> {
    const dayTotals = await this.totalsForDate(date);
    const totalMs = dayTotals.reduce((sum, total) => sum + total.totalMs, 0);
    return Math.round((totalMs / 3_600_000) * 100) / 100; // Convert to hours with 2 decimal precision
  }
}
