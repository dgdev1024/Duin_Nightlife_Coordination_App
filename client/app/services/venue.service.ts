///
/// @file   venue.service.ts
/// @brief  The service responsible for managing our venues and chatters.
///

import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { LoginService } from './login.service';
import { FlashService, FlashType } from './flash.service';

@Injectable()
export class QueryService {
  method: string = '';
  location: string = '';
  latitude: number = 0;
  longitude: number = 0;
}

@Injectable()
export class VenueService {

  constructor(
    private httpService: Http,
    private loginService: LoginService,
    private flashService: FlashService
  ) { }

  ///
  /// @fn     searchForVenues
  /// @brief  Searches for venues in the given area.
  ///
  /// @param {string} query The area to search in. Leave blank to use your current location.
  /// @param {number} page The current page.
  ///
  /// @return An observable that will be subscribed to.
  ///
  searchByArea (query: string, page: number = 0) {
    return this.httpService.get(`/api/venue/search?location=${query}&page=${page}`);
  }

  ///
  /// @fn     searchByLocation
  /// @brief  Searchs for venues near the given geolocational position.
  ///
  /// @param {number} lat The geolocational latitude.
  /// @param {number} lon The geolocational longitude.
  /// @param {number} page The current page.
  ///
  /// @return An observable that will be subscribed to.
  ///
  searchByLocation (lat: number, lon: number, page: number = 0) {
    return this.httpService.get(`/api/venue/search?latitude=${lat}&longitude=${lon}&page=${page}`);
  }

  ///
  /// @fn     viewVenue
  /// @brief  Fetches a venue with the given business ID.
  ///
  /// @param {string} id The venue's business ID, per Yelp.
  ///
  /// @return An observable to be subscribed to.
  ///
  viewVenue (id: string) {
    return this.httpService.get(`/api/venue/view/${id}`);
  }

  ///
  /// @fn     viewVenueChatters
  /// @brief  Fetches some chatters on the given venue.
  ///
  /// @param {string} id The venue's business ID, per Yelp.
  ///
  viewVenueChatters (id: string) {
    return this.httpService.get(`/api/venue/chatters/${id}`);
  }

  ///
  /// @fn     isAttendingVenue
  /// @brief  Checks to see if the user is attending the venue.
  ///
  /// @param {string} id The venue's business ID.
  ///
  isAttendingVenue (id: string) {
    return this.httpService.get(`/api/venue/attending/${id}`, 
      this.loginService.buildRequestOptions());
  }

  ///
  /// @fn     toggleAttendVenue
  /// @brief  Attends or Unattends a venue.
  ///
  /// @param {string} id The venue's business ID.
  ///
  toggleAttendVenue (id: string) {
    return this.httpService.put(`/api/venue/toggleAttend/${id}`, {},
      this.loginService.buildRequestOptions());
  }

  ///
  /// @fn     postChatter
  /// @brief  Posts a chatter on the given venue.
  ///
  /// @param {string} id The venue's business ID.
  /// @param {string} body The chatter's body.
  ///
  postChatter (id: string, body: string) {
    return this.httpService.post(`/api/venue/chatter/${id}`, { body },
      this.loginService.buildRequestOptions());
  }

}
