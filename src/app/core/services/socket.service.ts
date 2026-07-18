import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, fromEvent, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;

  // Reactive connection status - components can subscribe to this
  // instead of only checking isConnected() once at load time.
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  public status$: Observable<boolean> = this.connectionStatus$.asObservable();

  constructor() {}

  /**
   * Connect to Socket.IO server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('🔌 Already connected to Socket.IO');
      return;
    }

    // Use explicit socketUrl if available, otherwise fallback to apiUrl
    const socketUrl = (environment as any).socketUrl || environment.apiUrl.replace('/api', '');
    
    console.log('🔌 Connecting to Socket.IO at:', socketUrl);

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      // Keep retrying indefinitely instead of giving up after 5 tries -
      // this dashboard has no polling fallback, so it must not stop
      // trying to reconnect on its own.
      reconnectionAttempts: Infinity
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket?.id);
      this.connectionStatus$.next(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      this.connectionStatus$.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket.IO connection error:', error);
      this.connectionStatus$.next(false);
    });

    this.socket.on('reconnect', (attempt) => {
      console.log(`✅ Socket.IO reconnected after ${attempt} attempt(s)`);
      this.connectionStatus$.next(true);
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus$.next(false);
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