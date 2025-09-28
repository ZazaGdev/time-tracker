import { Component } from '@angular/core';
import { ManageFormComponent } from '../../components/manage-form/manage-form.component';

@Component({
  selector: 'app-manage',
  standalone: true,
  imports: [ManageFormComponent],
  template: '<app-manage-form></app-manage-form>',
})
export class ManageComponent {}
