import { Injectable, signal } from '@angular/core';
import { db } from '../data/db.service';
import { ActiveTimer, Session } from '../models';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private _active = signal<ActiveTimer | null>(null);

  // Read-only access to the active timer signal
  readonly active = this._active.asReadonly();

  constructor() {
    // Load active timer on service initialization
    this.loadActive();
  }

  /**
   * Loads the single active timer row from the database and updates the signal
   */
  async loadActive(): Promise<void> {
    try {
      const activeTimer = await db.activeTimer.orderBy('id').first();
      this._active.set(activeTimer || null);
    } catch (error) {
      console.error('Error loading active timer:', error);
      this._active.set(null);
    }
  }

  /**
   * Starts a new timer by clearing any existing active timer and creating a new one
   * @param input Timer configuration without id and startedAt
   */
  async startTimer(input: Omit<ActiveTimer, 'id' | 'startedAt'>): Promise<void> {
    try {
      // Clear any existing active timer
      await db.activeTimer.clear();

      // Create new active timer with current timestamp
      const newTimer: ActiveTimer = {
        ...input,
        startedAt: new Date().toISOString(),
      };

      // Insert into database
      const id = await db.activeTimer.add(newTimer);

      // Update signal with the new timer (including the generated id)
      this._active.set({ ...newTimer, id: id as number });
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  }

  /**
   * Stops the active timer by converting it to a session and clearing the active timer
   * @returns The ID of the created session
   */
  async stopTimer(): Promise<number> {
    const activeTimer = this._active();

    if (!activeTimer) {
      throw new Error('No active timer to stop');
    }

    try {
      const endedAt = new Date().toISOString();
      const startedAt = new Date(activeTimer.startedAt);
      const endedAtDate = new Date(endedAt);
      const durationMs = endedAtDate.getTime() - startedAt.getTime();

      // Create session from active timer
      const session: Session = {
        categoryId: activeTimer.categoryId,
        subcategoryId: activeTimer.subcategoryId,
        tagIds: activeTimer.tagIds,
        startedAt: activeTimer.startedAt,
        endedAt: endedAt,
        durationMs: durationMs,
      };

      // Save session to database
      const sessionId = await db.sessions.add(session);

      // Clear active timer from database
      await db.activeTimer.clear();

      // Update signal to null
      this._active.set(null);

      return sessionId as number;
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  }
}
