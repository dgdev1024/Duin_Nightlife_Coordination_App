import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { FlashService } from './services/flash.service';
import { FlashComponent } from './components/flash/flash.component';
import { LoginService } from './services/login.service';
import { TopbarComponent } from './components/topbar/topbar.component';
import { HomeComponent } from './components/home/home.component';
import { VenueService, QueryService } from './services/venue.service';
import { SocketService } from './services/socket.service';
import { VenueComponent } from './components/venue/venue.component';
import { FinishLoginComponent } from './components/finish-login/finish-login.component';
import { DataUsageComponent } from './components/data-usage/data-usage.component';

// Routing
const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent
  },
  {
    path: 'venue/:venueId',
    component: VenueComponent
  },
  {
    path: 'finishlogin',
    component: FinishLoginComponent
  },
  {
    path: 'datausage',
    component: DataUsageComponent
  }
];

@NgModule({
  declarations: [
    AppComponent,
    FlashComponent,
    TopbarComponent,
    HomeComponent,
    VenueComponent,
    FinishLoginComponent,
    DataUsageComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(routes)
  ],
  providers: [FlashService, LoginService, VenueService, QueryService, SocketService],
  bootstrap: [AppComponent]
})
export class AppModule { }
