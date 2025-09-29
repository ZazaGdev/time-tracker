import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TimerFormComponent } from '../../components/timer-form/timer-form.component';
import { HoursChartComponent } from '../../components/hours-chart/hours-chart.component';
import { TimerService } from '../../core/services';

@Component({
  selector: 'app-timer-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, TimerFormComponent, HoursChartComponent],
  template: `
    <div class="timer-page">
      <!-- Timer Controls -->
      <mat-card class="timer-card">
        <mat-card-header>
          <mat-card-title>Time Tracker</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <app-timer-form></app-timer-form>
        </mat-card-content>
      </mat-card>

      <!-- Today's Hours Chart -->
      <app-hours-chart [date]="today" period="daily"> </app-hours-chart>
    </div>
  `,
  styles: [
    `
      .timer-page {
        padding: 20px;
        max-width: 800px;
        margin: 0 auto;
      }

      .timer-card {
        margin-bottom: 24px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .timer-card mat-card-content {
        padding: 20px;
      }
    `,
  ],
})
export class TimerPage implements OnInit {
  today = new Date();

  constructor(private timerService: TimerService) {}

  async ngOnInit(): Promise<void> {
    // Ensure active timer state is loaded on page initialization/reload
    await this.timerService.loadActive();
  }
}
