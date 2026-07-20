import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ActAsLogEntry {
  event: 'SESSION_START' | 'SESSION_END' | 'ACTION';
  realUser: string;
  realPosition: string;
  actingAsUser: string;
  actingAsPosition: string;
  method?: string;
  path?: string;
  timestamp: string;
}

@Component({
  selector: 'app-act-as-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './act-as-log.component.html',
  styleUrl: './act-as-log.component.scss'
})
export class ActAsLogComponent implements OnInit {

  logs: ActAsLogEntry[] = [];
  isLoading = false;
  errorMessage = '';

  // Date filter, defaults to last 7 days
  fromDate = '';
  toDate = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    this.toDate = today.toISOString().slice(0, 10);
    this.fromDate = weekAgo.toISOString().slice(0, 10);

    this.loadLogs();
  }

  loadLogs() {
    this.isLoading = true;
    this.errorMessage = '';

    const params: any = {};
    if (this.fromDate) params.from = this.fromDate;
    if (this.toDate) params.to = this.toDate;

    this.http.get<{ success: boolean; data: ActAsLogEntry[] }>(`${environment.apiUrl}/auth/act-as-logs`, { params })
      .subscribe({
        next: (res) => {
          this.logs = res.data || [];
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Gagal memuat log';
          this.isLoading = false;
        }
      });
  }

  formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' });
  }

  eventLabel(event: string): string {
    switch (event) {
      case 'SESSION_START': return 'Mulai Act-as';
      case 'SESSION_END': return 'Keluar Act-as';
      case 'ACTION': return 'Aksi';
      default: return event;
    }
  }

  eventBadgeClass(event: string): string {
    switch (event) {
      case 'SESSION_START': return 'bg-warning text-dark';
      case 'SESSION_END': return 'bg-secondary';
      case 'ACTION': return 'bg-primary';
      default: return 'bg-light text-dark';
    }
  }

}
