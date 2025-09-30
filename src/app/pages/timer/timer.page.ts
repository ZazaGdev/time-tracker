// Angular Core
import { Component, OnInit } from '@angular/core';

// Angular Common
import { CommonModule } from '@angular/common';

// Application Components
import { TimerFormComponent } from '../../components/timer-form/timer-form.component';
import { HoursChartComponent } from '../../components/hours-chart/hours-chart.component';

// Application Services
import { TimerService } from '../../core/services';

@Component({
  selector: 'app-timer-page',
  standalone: true,
  imports: [
    // Angular Common
    CommonModule,

    // Application Components
    TimerFormComponent,
    HoursChartComponent,
  ],
  template: `
    <div class="timer-page">
      <!-- Timer Controls -->
      <app-timer-form></app-timer-form>

      <!-- Hours Chart -->
      <app-hours-chart></app-hours-chart>
    </div>
  `,
  styles: [
    `
      .timer-page {
        min-height: calc(100vh - 64px);
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
