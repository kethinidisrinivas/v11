import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GalaxyComponent } from './galaxy/galaxy.component';
import { MessengerComponent } from './messenger/messenger.component';
import { HeartEmitterComponent } from './heart-emitter/heart-emitter.component';
import { SparklesComponent } from './sparkles/sparkles.component';

@NgModule({
  declarations: [
    AppComponent,
    GalaxyComponent,
    MessengerComponent,
    HeartEmitterComponent,
    SparklesComponent
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
