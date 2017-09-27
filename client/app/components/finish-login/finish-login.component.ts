import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-finish-login',
  template: '',
  styles: []
})
export class FinishLoginComponent implements OnInit {

  private redirect () {
    // Get the return route URL from the local storage.
    // If none is found, then default to the home route.
    let returnUrl = localStorage.getItem('-ddd-return');
    if (returnUrl === null) { returnUrl = '/'; }

    // Remove the URL from storage.
    localStorage.removeItem('-ddd-return');

    // If the user is to be redirect to the home route, then we need to
    // determine if the user was carrying out a search.
    if (returnUrl === '/') {
      // Find a search method and parameters in local storage.
      const method = localStorage.getItem('-ddd-method');

      // Check to see if a location or a coordinates search was executed.
      if (method === 'location') {
        const location = localStorage.getItem('-ddd-location');
        if (location) {
          this.routerService.navigate([ '/' ], {
            queryParams: {
              searchMethod: method,
              searchLocation: location
            },
            replaceUrl: true
          });
          return;
        }
      }
      else if (method === 'coordinates') {
        const latitude = localStorage.getItem('-ddd-latitude');
        const longitude = localStorage.getItem('-ddd-longitude');
        if (latitude && longitude) {
          this.routerService.navigate([ '/' ], {
            queryParams: {
              searchMethod: method,
              searchLatitude: latitude,
              searchLongitude: longitude
            },
            replaceUrl: true
          });
          return;
        }
      }

      this.routerService.navigate([ '/' ], { replaceUrl: true });
    } else {
      // Otherwise, just redirect the user to the page they were at.
      this.routerService.navigate([ returnUrl ], { replaceUrl: true });
    }
  }

  constructor(
    private titleService: Title,
    private activatedRoute: ActivatedRoute,
    private routerService: Router,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    this.titleService.setTitle('Duin\' - The Nightlife App');
    this.activatedRoute.queryParams.subscribe(params => {
      // Grab the JWT from the query parameter.
      const jwt = params['jwt'];

      // If a JWT was found, then store it in local storage.
      if (jwt) {
        localStorage.setItem('-ddd-login', jwt);
        this.flashService.deploy('You are now logged in.', [], FlashType.OK);
      } else {
        this.flashService.deploy('No valid login token found.', [], FlashType.Error);
      }

      // Now redirect the user.
      this.redirect();
    });
  }

}
