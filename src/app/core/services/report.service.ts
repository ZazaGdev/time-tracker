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

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  /**
   * Gets totals for a specific date, grouped by category/subcategory/tags
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
        // Clamp session duration to day range
        const sessionStart = new Date(session.startedAt);
        const sessionEnd = new Date(session.endedAt);

        // Calculate effective start and end within the day
        const effectiveStart = sessionStart < dayStart ? dayStart : sessionStart;
        const effectiveEnd = sessionEnd > dayEnd ? dayEnd : sessionEnd;

        // Skip if session doesn't overlap with the day
        if (effectiveStart >= effectiveEnd) {
          continue;
        }

        const clampedDurationMs = effectiveEnd.getTime() - effectiveStart.getTime();

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
        group.totalMs += clampedDurationMs;
      }

      // Convert map to array and sort by totalMs descending
      return Array.from(groupMap.values()).sort((a, b) => b.totalMs - a.totalMs);
    } catch (error) {
      console.error('Error calculating day totals:', error);
      throw error;
    }
  }
}
