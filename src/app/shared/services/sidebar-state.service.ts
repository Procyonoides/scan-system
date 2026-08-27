import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  readonly collapsed = signal(localStorage.getItem('sidebarCollapsed') === 'true');

  toggle() {
    const nextState = !this.collapsed();
    this.collapsed.set(nextState);
    localStorage.setItem('sidebarCollapsed', String(nextState));
  }
}
