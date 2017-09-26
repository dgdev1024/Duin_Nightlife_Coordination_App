///
/// @file   flash.service.ts
/// @brief  The service in charge of displaying our flash messages.
///

import { Injectable } from '@angular/core';

// Flash duration constants.
export const FLASH_DURATION: number = 10000;
export const FLASH_DURATION_WITH_DETAILS: number = 15000;

// Flash type enumeration.
export enum FlashType {
  Default,
  OK,
  Error
}

@Injectable()
export class FlashService {

  private m_message: string = '';                   // The text that appears in the flash box.
  private m_details: string[] = [];                 // The message detail strings.
  private m_type: FlashType = FlashType.Default;    // The flash's level of urgency.
  private m_timeoutId: number = null;               // The ID of the flash timeout, dictating how long it stays on screen.

  ///
  /// @fn     deploy
  /// @brief  Displays a flash box onscreen with the given message.
  ///
  /// @param {string} message The message to be displayed.
  /// @param {string[]} details The detail strings to be displayed.
  /// @param {FlashType} type The flash box's level of urgency.
  ///
  deploy (message: string, details: string[], type: FlashType): void {
    // Set the details.
    this.m_message = message;
    this.m_details = details;
    this.m_type = type;

    // Prepare and prime the timeout object.
    clearTimeout(this.m_timeoutId);
    this.m_timeoutId = setTimeout(
      () => this.clear(),
      this.m_details.length > 0 ?
        FLASH_DURATION_WITH_DETAILS :
        FLASH_DURATION
    );
  }

  ///
  /// @fn     clear
  /// @brief  Clears the flash box.
  ///
  clear (): void {
    // Clear the details.
    this.m_message = '';
    this.m_details = [];
    this.m_type = FlashType.Default;

    // Clear the timeout, too.
    clearTimeout(this.m_timeoutId);
  }

  ///
  /// @fn     getTypeClass
  /// @brief  Generates a CSS class based on the flash's level of urgency.
  ///
  /// @return The CSS class string.
  ///
  getTypeClass (): string {
    switch (this.m_type) {
      case FlashType.Default: return 'ddd-flash-default';
      case FlashType.OK: return 'ddd-flash-ok';
      case FlashType.Error: return 'ddd-flash-error';
      default: return 'ddd-flash-default';
    }
  }

  // Getters
  get message (): string   { return this.m_message; }
  get details (): string[] { return this.m_details; }
  get type (): FlashType   { return this.m_type; }

}