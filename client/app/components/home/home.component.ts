import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';
import { VenueService, QueryService } from '../../services/venue.service';
import { FlashService, FlashType } from '../../services/flash.service';

// The interface for our venue search results.
interface VenueResult {
  id: string,
  name: string,
  image: string,
  going: number
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styles: []
})
export class HomeComponent implements OnInit, OnDestroy {

  // Search parameters.
  private m_searchMethod: string          = '';
  private m_searchLocation: string        = '';
  private m_searchLatitude: number        = 0;
  private m_searchLongitude: number       = 0;

  // Venue parameters
  private m_venueFetching: boolean        = false;
  private m_venueResults: VenueResult[]   = [];
  private m_venuePage: number             = 0;
  private m_venueLastPage: boolean        = true;
  private m_venueError: string            = '';

  // Initializes our Socket.IO events.
  private initializeEvents () {
    // Emitted when an attendant is added to a venue.
    this.socketService.on('add attendant', data => {
      this.m_venueResults.find(venue => {
        if (venue.id === data['venueId']) {
          venue.going++;
          return true;
        }
        return false;
      });
    });

    // Emitted when an attendant is removed from a venue.
    this.socketService.on('remove attendant', data => {
      this.m_venueResults.find(venue => {
        if (venue.id === data['venueId']) {
          venue.going--;
          return true;
        }
        return false;
      });
    });
  }

  // Fetches our venue search results.
  private fetchVenues (page: number = 0) {
    // Temporarily clear our socket event listeners.
    this.socketService.clear();

    // Set up our fetching flags.
    this.m_venueError = '';
    this.m_venueFetching = true;
    this.m_venuePage = page;

    // What searching method are we using - Location or Coordinates?
    if (this.m_searchMethod === 'location') {
      this.queryService.method = this.m_searchMethod;
      this.queryService.location = this.m_searchLocation;

      this.venueService.searchByArea(
        this.m_searchLocation,
        this.m_venuePage
      ).subscribe(
        response => {
          const { venues, lastPage } = response.json();
        
          this.m_venueResults = venues;
          this.m_venueLastPage = lastPage;
          this.m_venueFetching = false;

          this.locationService.replaceState(
            '/',
            `searchMethod=${this.m_searchMethod}&searchLocation=${this.m_searchLocation}&page=${page}`
          );

          this.initializeEvents();
        },

        error => {
          const { message } = error.json().error;

          this.m_venueError = message;
          this.m_venueFetching = false;
        }
      );
    }
    else if (this.m_searchMethod === 'coordinates') {
      this.queryService.method = this.m_searchMethod;
      this.queryService.latitude = this.m_searchLatitude;
      this.queryService.longitude = this.m_searchLongitude;

      this.venueService.searchByLocation(
        this.m_searchLatitude,
        this.m_searchLongitude,
        this.m_venuePage
      ).subscribe(
        response => {
          const { venues, lastPage } = response.json();
        
          this.m_venueResults = venues;
          this.m_venueLastPage = lastPage;
          this.m_venueFetching = false;

          this.locationService.replaceState(
            '/',
            `searchMethod=${this.m_searchMethod}&searchLatitude=${this.m_searchLatitude}&searchLongitude=${this.m_searchLongitude}&page=${page}`
          );

          this.initializeEvents();
        },

        error => {
          const { message } = error.json().error;

          this.m_venueError = message;
          this.m_venueFetching = false;
        }
      );
    }
    else {
      this.m_venueError = 'Invalid search method.';
      this.m_venueFetching = false;
    }
  }

  // Recalls a search query stored in query parameters and executs it.
  private recallFromQueryParams () {
    // Grab our query parameters.
    this.activatedRoute.queryParams.subscribe(params => {
      // Get our search method. Are we searching by location, or by coordinates?
      const searchMethod = params['searchMethod'];

      if (searchMethod === 'location') {
        this.m_searchMethod = searchMethod;
        this.m_searchLocation = params['searchLocation'] || '';
        if (this.m_searchLocation !== '') { this.fetchVenues(); }
      }
      else if (searchMethod === 'coordinates') {
        this.m_searchMethod = searchMethod;
        this.m_searchLatitude = parseFloat(params['searchLatitude']) || 0;
        this.m_searchLongitude = parseFloat(params['searchLongitude']) || 0;
        this.fetchVenues();
      }
    });
  }

  constructor(
    private locationService: Location,
    private routerService: Router,
    private activatedRoute: ActivatedRoute,
    private socketService: SocketService,
    private queryService: QueryService,
    private venueService: VenueService,
    private flashService: FlashService,
    private titleService: Title
  ) { }

  ngOnInit() {
    this.titleService.setTitle('Duin\' - The Nightlife App');
    localStorage.removeItem('-ddd-return');
    localStorage.removeItem('-ddd-method');
    localStorage.removeItem('-ddd-location');
    localStorage.removeItem('-ddd-latitude');
    localStorage.removeItem('-ddd-longitude');
    this.recallFromQueryParams();
  }

  ngOnDestroy () {
    this.socketService.clear();
  }

  // Called when an area search is submitted.
  onAreaSearchSubmit (ev) {
    ev.preventDefault();
    this.m_searchMethod = 'location';
    this.fetchVenues();
  }

  // Called when a coordinate search is submitted.
  onCoordinateSearchSubmit (ev) {
    ev.preventDefault();

    // First, we need to know if the browser supports geolocation.
    if (navigator.geolocation) {
      // Get the current position.
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;

          this.m_searchMethod = 'coordinates';
          this.m_searchLatitude = latitude;
          this.m_searchLongitude = longitude;
          this.fetchVenues();
        },

        error => {
          this.m_searchMethod = 'coordinates';
          this.m_venueError = `Geolocation Error: ${error.message}`;
        }
      );
    } else {
      this.m_venueError = 'You are attempting a geolocational search, but your browser does not support geolocation.';
    }
  }

  onPrevClicked () {
    if (this.m_venuePage > 0) {
      this.fetchVenues(this.m_venuePage - 1);
    }
  }

  onNextClicked () {
    if (this.m_venueLastPage === false) {
      this.fetchVenues(this.m_venuePage + 1);
    }
  }

  // Getters
  get searchMethod ()       { return this.m_searchMethod; }
  get searchLocation ()     { return this.m_searchLocation; }
  get searchLatitude ()     { return this.m_searchLatitude; }
  get searchLongitude ()    { return this.m_searchLongitude; }
  get venueFetching ()      { return this.m_venueFetching; }
  get venueResults ()       { return this.m_venueResults; }
  get venuePage ()          { return this.m_venuePage; }
  get venueLastPage ()      { return this.m_venueLastPage; }
  get venueError ()         { return this.m_venueError; }

  // Setters
  set searchLocation (location: string) { this.m_searchLocation = location; }

}
