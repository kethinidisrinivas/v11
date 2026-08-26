import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GalaxyComponent } from './galaxy/galaxy.component';
import { SparklesComponent } from './sparkles/sparkles.component';
import { MessengerComponent } from './messenger/messenger.component';
import { SidebarComponent } from './messenger/sidebar/sidebar.component';
import { ChatWindowComponent } from './messenger/chat-window/chat-window.component';
import { ContactInfoComponent } from './messenger/contact-info/contact-info.component';
import { ProfileComponent } from './profile/profile.component';

@NgModule({
  declarations: [
    AppComponent,
    GalaxyComponent,
    SparklesComponent,
    MessengerComponent,
    SidebarComponent,
    ChatWindowComponent,
    ContactInfoComponent,
    ProfileComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
