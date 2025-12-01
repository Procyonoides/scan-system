import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  // Signal untuk reactive state management
  private _collapsed = signal<boolean>(false);

  // Public readonly signal
  public collapsed = this._collapsed.asReadonly();

  constructor() {
    // Load state dari localStorage saat service init
    this.loadState();

    // Sync dengan DOM attribute
    effect(() => {
      this.syncDOMAttribute(this._collapsed());
    });
  }

  /**
   * Load sidebar state dari localStorage
   */
  private loadState(): void {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      const isCollapsed = saved === 'true';
      this._collapsed.set(isCollapsed);
    }
  }

  /**
   * Sync state dengan DOM attribute untuk CSS styling
   */
  private syncDOMAttribute(collapsed: boolean): void {
    const root = document.documentElement;

    if (collapsed) {
      root.setAttribute('data-sidebar-collapse', 'true');
    } else {
      root.removeAttribute('data-sidebar-collapse');
    }
  }

  /**
   * Toggle sidebar collapse state
   */
  public toggle(): void {
    const newState = !this._collapsed();
    this._collapsed.set(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  }

  /**
   * Set sidebar collapse state explicitly
   */
  public setCollapsed(collapsed: boolean): void {
    this._collapsed.set(collapsed);
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }

  /**
   * Expand sidebar (set to not collapsed)
   */
  public expand(): void {
    this.setCollapsed(false);
  }

  /**
   * Collapse sidebar
   */
  public collapse(): void {
    this.setCollapsed(true);
  }

  /**
   * Get current collapsed state (for non-reactive use)
   */
  public isCollapsed(): boolean {
    return this._collapsed();
  }
}
