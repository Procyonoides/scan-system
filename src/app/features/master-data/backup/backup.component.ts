import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-backup',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
    templateUrl: './backup.component.html',
    styleUrl: './backup.component.scss'
})
export class BackupComponent implements OnInit {
    isLoading = false;
    successMessage = '';
    errorMessage = '';

    // Backup state
    backupType: 'receiving' | 'shipping' = 'receiving';
    currentYear = new Date().getFullYear();

    // Duplicate state
    duplicateFilter = {
        type: 'receiving',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10)
    };

    constructor(private http: HttpClient) { }

    ngOnInit() { }

    onBackup() {
        if (!confirm(`Are you sure you want to archive ${this.backupType} data older than January 1st, ${this.currentYear}?`)) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.http.post<any>(`${environment.apiUrl}/master-data/backup`, { type: this.backupType })
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.successMessage = res.message || 'Data archived successfully!';
                        setTimeout(() => this.clearMessages(), 3000);
                    }
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('❌ Backup failed:', err);
                    this.errorMessage = err.error?.error || 'Backup operation failed';
                    setTimeout(() => this.clearMessages(), 3000);
                    this.isLoading = false;
                }
            });
    }

    onDuplicate() {
        if (!confirm('Warning: This will permanently delete redundant entries in the selected date range. Proceed?')) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.http.post<any>(`${environment.apiUrl}/master-data/duplicate`, this.duplicateFilter)
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.successMessage = res.message || 'Duplicates cleaned successfully!';
                        setTimeout(() => this.clearMessages(), 3000);
                    }
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('❌ Deduplication failed:', err);
                    this.errorMessage = err.error?.error || 'Deduplication failed';
                    setTimeout(() => this.clearMessages(), 3000);
                    this.isLoading = false;
                }
            });
    }

    clearMessages() {
        this.successMessage = '';
        this.errorMessage = '';
    }
}
