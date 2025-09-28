import { Component } from '@angular/core';
import { TimerFormComponent } from '../../components/timer-form/timer-form.component';

@Component({
  selector: 'app-timer-page',
  standalone: true,
  imports: [TimerFormComponent],
  template: '<app-timer-form></app-timer-form>'
})
export class TimerPage {}