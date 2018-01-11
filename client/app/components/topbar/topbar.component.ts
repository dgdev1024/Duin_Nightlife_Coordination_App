import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { VenueService, QueryService } from '../../services/venue.service';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styles: []
})
export class TopbarComponent implements OnInit {

  // On mobile devices, toggles whether the topbar menu is shown.
  private m_mobileMenuShown: boolean = false;

  constructor(
    private routerService: Router,
    private loginService: LoginService,
    private venueService: VenueService,
    private queryService: QueryService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
  }

  ///
  /// @fn     toggleMobileMenu
  /// @brief  On mobile devices, toggles the topbar menu on and off.
  ///
  toggleMobileMenu () {
    this.m_mobileMenuShown = !this.m_mobileMenuShown;
  }

  ///
  /// @fn     dismissMobileMenu
  /// @brief  On mobile devices, dismisses the topbar menu.
  ///
  dismissMobileMenu () {
    this.m_mobileMenuShown = false;
  }

  socialLogin (event, provider: string) {
    event.preventDefault();

    // First, get the URL of the current route. 
    // Strip the query parameters out if present.
    // Store that URL in the browser's local storage.
    let currentRouteURL = this.routerService.url;
    const queryParamStart = currentRouteURL.indexOf('?');
    if (queryParamStart !== -1) {
      currentRouteURL = currentRouteURL.slice(0, queryParamStart);
    }
    localStorage.setItem('-ddd-return', currentRouteURL);

    // If this return route is the home route, we need to find out if the user
    // was carrying out a search when the logged in.
    if (currentRouteURL === '/') {
      // Was the user carrying out a location or a coordinates search?
      const method = this.queryService.method;
      if (method === 'location') {
        localStorage.setItem('-ddd-method', this.queryService.method);
        localStorage.setItem('-ddd-location', this.queryService.location);
      }
      else if (method === 'coordinates') {
        localStorage.setItem('-ddd-method', this.queryService.method);
        localStorage.setItem('-ddd-latitude', this.queryService.latitude.toString());
        localStorage.setItem('-ddd-longitude', this.queryService.longitude.toString());
      }
    }

    // Redirect our user to the proper authentication route.
    window.location.href = `/api/auth/${provider}`;
  }

  deleteUser (ev) {
    ev.preventDefault();

    const ays = confirm('This will detach your social media account from this website and log you out. Are you sure?');

    if (ays === false) { return; }

    this.loginService.deleteAccount().subscribe(
      (response) => {
        const { message } = response.json();
        this.loginService.clearToken();
        this.flashService.deploy(message, [], FlashType.OK);
      },

      (error) => {
        const { message } = error.json().error;
        this.flashService.deploy(message, [], FlashType.Error);
      }
    );
  }

  // Getters
  get mobileMenuShown () { return this.m_mobileMenuShown; }

}
