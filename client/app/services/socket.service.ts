///
/// @file   socket.service.ts
/// @brief  The service in charge of our Socket.IO client.
///

import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';

@Injectable()
export class SocketService {

  private client: SocketIOClient.Socket;

  constructor() {
    this.client = io();
  }

  emit (id: string, data: object = {}): void {
    this.client.emit(id, data);
  }

  on (id: string, callback: (data: object) => void) {
    this.client.on(id, callback);
  }

  clear () {
    this.client.removeAllListeners();
  }

}
