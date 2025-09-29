import { Component, OnInit } from '@angular/core';
import { TimerFormComponent } from '../../components/timer-form/timer-form.component';
import { TimerService } from '../../core/services';

@Component({
  selector: 'app-timer-page',
  standalone: true,
  imports: [TimerFormComponent],
  template: '<app-timer-form></app-timer-form>',
})
export class TimerPage implements OnInit {
  constructor(private timerService: TimerService) {}

  async ngOnInit(): Promise<void> {
    // Ensure active timer state is loaded on page initialization/reload
    await this.timerService.loadActive();
  }
}
