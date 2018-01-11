///
/// @file   login.service.ts
/// @brief  The service in charge of managing our login status.
///

import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Headers, RequestOptions } from '@angular/http';

///
/// @interface  LoginToken
/// @brief      The interface for our JWT login token for this application.
///
export interface LoginToken {
  // The ID of the logged-in user.
  id: string,

  // The display name of the logged-in user.
  displayName: string,

  // The raw JWT token.
  raw: string
}

@Injectable()
export class LoginService {

  constructor(private httpService: Http) { }

  ///
  /// @fn     getToken
  /// @brief  Checks to see if a login token is valid and returns it.
  ///
  /// @return {LoginToken} The parsed token, if it is valid.
  ///
  getToken (): LoginToken {
      // Check local storage and see if there is a token.
      const token = localStorage.getItem('-ddd-login');
      if (!token) { 
        return null; 
      }
  
      // A valid JWT token will have three period-separated segments.
      const segments = token.split('.');
      if (segments.length !== 3) {
        this.clearToken();
        return null;
      }
  
      // Exceptions can be thrown in this next part. If one is caught, then
      // clear the token and return null.
      try {
        // The second segment of the token contains our payload. Decode it
        // and parse it as JSON.
        const decoded = JSON.parse(atob(segments[1]));
  
        // Has the token been decoded? If so, does the token contain a valid
        // user ID, display name, and expiration claim?
        if (!decoded || !decoded._id || !decoded.displayName || !decoded.exp) {
          this.clearToken();
          return null;
        }
  
        // Is the token still fresh? Has it expired?
        if (decoded.exp <= Date.now() / 1000) {
          this.clearToken();
          return null;
        }
  
        // Return the decoded login token.
        return {
          id: decoded._id,
          displayName: decoded.displayName,
          raw: token
        };
      }
      catch (err) {
        this.clearToken();
        return null;
      }
    }
  
    ///
    /// @fn     checkToken
    /// @brief  Checks to see if there is a valid login token stored in local storage.
    ///
    /// @return {boolean} True if there is a valid login token.
    ///
    checkToken (): boolean {
      return this.getToken() !== null;
    }
  
    ///
    /// @fn     clearToken
    /// @brief  Upon logging out, clears the login token from local storage.
    ///
    clearToken (): void {
      localStorage.clear();
    }

    ///
    /// @fn     deleteAccount
    /// @brief  Attempts to delete the user's account.
    ///
    deleteAccount () {
      return this.httpService.delete('/api/auth/delete', this.buildRequestOptions());
    }
  
    ///
    /// @fn     buildRequestOptions
    /// @brief  Builds the authorization header for requests that require user authentication.
    ///
    /// @return {RequestOptions} The compiled request options object.
    ///
    buildRequestOptions (): RequestOptions {
      const token = this.getToken();
      const bearer = token ? `Bearer ${token.raw}` : '';
      const headers = new Headers();
      const options = new RequestOptions();
      headers.append('Authorization', bearer);
      options.headers = headers;
      return options;
    }

}
