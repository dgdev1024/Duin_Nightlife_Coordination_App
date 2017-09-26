///
/// @file   flash.component.ts
/// @brief  Displays the flash box onscreen.
///

import { Component, OnInit } from '@angular/core';
import { FlashService, FlashType } from '../../services/flash.service';

@Component({
  selector: 'app-flash',
  templateUrl: './flash.component.html',
  styles: []
})
export class FlashComponent implements OnInit {

  constructor(
    private flashService: FlashService
  ) { }

  ngOnInit() {
    // this.flashService.deploy('Test Message', [ 'Test 1', 'Test 2'], FlashType.Error);
  }

}