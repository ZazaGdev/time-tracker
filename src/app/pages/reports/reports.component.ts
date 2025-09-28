import { Component } from '@angular/core';
import { ReportsViewComponent } from '../../components/reports-view/reports-view.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [ReportsViewComponent],
  template: '<app-reports-view></app-reports-view>',
})
export class ReportsComponent {}
