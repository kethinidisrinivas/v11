import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GalaxyComponent } from './galaxy/galaxy.component';
import { SparklesComponent } from './sparkles/sparkles.component';
import { MessengerComponent } from './messenger/messenger.component';
import { SidebarComponent } from './messenger/sidebar/sidebar.component';
import { ChatWindowComponent } from './messenger/chat-window/chat-window.component';
import { ContactInfoComponent } from './messenger/contact-info/contact-info.component';
import { CameraModalComponent } from './messenger/camera-modal/camera-modal.component';

import { JwtInterceptor } from './interceptors/jwt.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    GalaxyComponent,
    SparklesComponent,
    MessengerComponent,
    SidebarComponent,
    ChatWindowComponent,
    ContactInfoComponent,
    CameraModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
