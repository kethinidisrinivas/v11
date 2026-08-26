import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MessengerComponent } from './messenger/messenger.component';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [
  { path: 'messenger', component: MessengerComponent },
  { path: 'profile', component: ProfileComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
