import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, fromEvent } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;

  constructor() {}

  /**
   * Connect to Socket.IO server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('🔌 Already connected to Socket.IO');
      return;
    }

    this.socket = io(environment.apiUrl.replace('/api', ''), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket.IO connection error:', error);
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket.IO disconnected manually');
    }
  }

  /**
   * Listen to a specific event
   */
  on<T = any>(eventName: string): Observable<T> {
    if (!this.socket) {
      console.warn('⚠️ Socket not connected. Call connect() first.');
      return new Observable(observer => observer.error('Socket not connected'));
    }

    return fromEvent<T>(this.socket, eventName);
  }

  /**
   * Emit an event to server
   */
  emit(eventName: string, data?: any): void {
    if (!this.socket) {
      console.warn('⚠️ Socket not connected. Call connect() first.');
      return;
    }

    this.socket.emit(eventName, data);
    console.log(`📤 Emitted event: ${eventName}`, data);
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}