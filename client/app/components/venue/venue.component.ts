import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { VenueService } from '../../services/venue.service';
import { SocketService } from '../../services/socket.service';
import { FlashService, FlashType } from '../../services/flash.service';

// The interface for our fetched venue.
interface Venue {
  name: string,
  image: string,
  yelp: string,
  price: string,
  rating: number,
  address: string,
  phone: string,
  going: number
}

// The interface for our venue chatters.
interface Chatter {
  author: string,
  body: string;
}

@Component({
  selector: 'app-venue',
  templateUrl: './venue.component.html',
  styles: []
})
export class VenueComponent implements OnInit, OnDestroy {

  // Venue Parameters
  private m_venueId: string             = '';
  private m_venueFetching: boolean      = false;
  private m_venue: Venue                = null;
  private m_venueError: string          = '';
  private m_venueAttending: boolean     = false;

  // Chatter Parameters
  private m_chatterFetching: boolean    = false;
  private m_chatters: Chatter[]         = [];
  private m_chatterInput: string        = '';

  // Initializes our socket events.
  private initializeEvents () {
    this.socketService.on('add attendant', data => {
      if (this.m_venueId === data['venueId'] && this.m_venue !== null) {
        this.m_venue.going++;
      }
    });

    this.socketService.on('remove attendant', data => {
      if (this.m_venueId === data['venueId'] && this.m_venue !== null) {
        this.m_venue.going--;
      }
    });

    this.socketService.on('new chatter', data => {
      if (this.m_venueId === data['venueId'] && this.m_venue !== null) {
        this.m_chatters.unshift({ author: data['authorName'], body: data['body'] });

        if (this.m_chatters.length > 100) {
          this.m_chatters.pop();
        }
      }
    });
  }

  // Fetches a venue by its ID.
  private fetchVenue () {
    // Prepare to fetch our venue.
    this.m_venueError = '';
    this.m_chatters = [];
    this.m_venueFetching = true;

    // Fetch our venue.
    this.venueService.viewVenue(this.m_venueId).subscribe(
      response => {
        const { venue } = response.json();

        this.m_venue = venue;
        this.m_venueFetching = false;

        // Check to see if the user is attending the venue.
        this.venueService.isAttendingVenue(this.m_venueId).subscribe(
          response => {
            const { attending } = response.json();
            this.m_venueAttending = attending;
          },

          error => {
            const { status, message } = error.json().error;
            if (status !== 401) {
              this.flashService.deploy(message, [], FlashType.Error);
            }

            this.m_venueAttending = false;
          }
        );

        // Now fetch our chatters.
        this.m_chatterFetching = true;
        this.venueService.viewVenueChatters(this.m_venueId).subscribe(
          response => {
            const { chatters } = response.json();

            this.m_chatters = chatters;
            this.m_chatterFetching = false;
            this.initializeEvents();
          },

          error => {
            const { message, status } = error.json().error;

            if (status !== 404) {
              this.flashService.deploy(message, [], FlashType.Error);
            }

            this.m_chatterFetching = false;
            this.initializeEvents();
          }
        );
      },

      error => {
        const { message } = error.json().error;

        this.m_venueError = message;
        this.m_venueFetching = false;
      }
    );
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private loginService: LoginService,
    private venueService: VenueService,
    private socketService: SocketService,
    private flashService: FlashService
  ) { }

  ngOnInit() {
    this.socketService.clear();

    this.activatedRoute.params.subscribe(params => {
      this.m_venueId = params['venueId'];
      this.fetchVenue();
    });
  }

  ngOnDestroy () {
    this.socketService.clear();
  }

  getYelpStars () {
    if (this.m_venue === null) { return ''; }

    switch (this.m_venue.rating) {
      case 0: return 'assets/small_0.png';
      case 1: return 'assets/small_1.png';
      case 1.5: return 'assets/small_1_half.png';
      case 2: return 'assets/small_2.png';
      case 2.5: return 'assets/small_2_half.png';
      case 3: return 'assets/small_3.png';
      case 3.5: return 'assets/small_3_half.png';
      case 4: return 'assets/small_4.png';
      case 4.5: return 'assets/small_4_half.png';
      case 5: return 'assets/small_5.png';
    }
  }

  onAttendClicked (ev) {
    ev.preventDefault();

    this.venueService.toggleAttendVenue(this.m_venueId).subscribe(
      () => {
        this.m_venueAttending = !this.m_venueAttending;
      },

      error => {
        const { message } = error.json().error;

        this.flashService.deploy(message, [], FlashType.Error);
      }
    );
  }

  onChatterPost (ev) {
    ev.preventDefault();

    this.venueService.postChatter(this.m_venueId, this.m_chatterInput).subscribe(
      () => {
        this.m_chatterInput = '';
      },

      error => {
        const { message } = error.json().error;
        
        this.flashService.deploy(message, [], FlashType.Error);
      }
    );
  }

  // Getters
  get venueId () { return this.m_venueId; }
  get venueFetching () { return this.m_venueFetching; }
  get venue () { return this.m_venue; }
  get venueError () { return this.m_venueError; }
  get venueAttending () { return this.m_venueAttending; }
  get chatterFetching () { return this.m_chatterFetching; }
  get chatters () { return this.m_chatters; }
  get chatterInput () { return this.m_chatterInput; }

  // Setters
  set chatterInput(text: string) { this.m_chatterInput = text; }

}
