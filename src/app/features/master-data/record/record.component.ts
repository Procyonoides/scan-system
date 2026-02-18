import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-record',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
    templateUrl: './record.component.html',
    styleUrl: './record.component.scss'
})
export class RecordComponent implements OnInit {
    records: any[] = [];
    isLoading = false;
    successMessage = '';
    errorMessage = '';

    recordFilter = {
        type: 'receiving',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        username: '',
        scanNo: ''
    };

    // Pagination state
    currentPage = 1;
    itemsPerPage = 50;
    totalItems = 0;
    totalPages = 0;
    Math = Math;

    selectedRecord: any = null;
    recordForm!: FormGroup;
    showRecordEditModal = false;

    constructor(
        private http: HttpClient,
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        this.initForm();
        this.loadRecords();
    }

    initForm() {
        this.recordForm = this.fb.group({
            quantity: [0, [Validators.required, Validators.min(1)]],
            username: ['', Validators.required],
            description: ['']
        });
    }

    loadRecords(page: number = 1) {
        this.currentPage = page;
        console.log(`🔍 Loading records (Page ${this.currentPage}, Limit ${this.itemsPerPage})`);

        this.isLoading = true;
        const params: any = {
            ...this.recordFilter,
            page: this.currentPage,
            limit: this.itemsPerPage
        };

        this.http.get<any>(`${environment.apiUrl}/master-data/records`, { params })
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.records = response.data;
                        this.totalItems = response.total;
                        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
                    }
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('❌ Failed to load records:', err);
                    this.errorMessage = err.error?.error || 'Failed to load records';
                    this.isLoading = false;
                }
            });
    }

    onPageChange(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.loadRecords(page);
        }
    }

    onItemsPerPageChange() {
        this.loadRecords(1);
    }

    openRecordEditModal(record: any) {
        this.selectedRecord = record;
        this.recordForm.patchValue({
            quantity: record.quantity,
            username: record.username,
            description: record.description
        });
        this.showRecordEditModal = true;
    }

    onUpdateRecord() {
        if (this.recordForm.invalid) return;

        this.isLoading = true;
        const body = {
            type: this.recordFilter.type,
            dateTime: this.selectedRecord.date_time,
            scanNo: this.selectedRecord.scan_no,
            oldUsername: this.selectedRecord.username,
            ...this.recordForm.value
        };

        console.log('📤 Updating record with body:', body);

        this.http.put(`${environment.apiUrl}/master-data/record`, body)
            .subscribe({
                next: (response: any) => {
                    if (response.success) {
                        this.successMessage = 'Record updated successfully';
                        this.showRecordEditModal = false;
                        this.loadRecords();
                        setTimeout(() => this.successMessage = '', 3000);
                    }
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('❌ Update failed:', err);
                    this.errorMessage = err.error?.error || 'Failed to update record';
                    this.isLoading = false;
                }
            });
    }

    onDeleteRecord(record: any) {
        if (!confirm('Are you sure you want to delete this record?')) return;

        this.isLoading = true;
        const params = {
            type: this.recordFilter.type,
            dateTime: record.date_time,
            scanNo: record.scan_no,
            username: record.username
        };

        console.log('🗑️ Deleting record with params:', params);

        this.http.delete(`${environment.apiUrl}/master-data/record`, { params })
            .subscribe({
                next: (response: any) => {
                    if (response.success) {
                        this.successMessage = 'Record deleted successfully';
                        this.loadRecords();
                        setTimeout(() => this.successMessage = '', 3000);
                    }
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('❌ Delete failed:', err);
                    this.errorMessage = err.error?.error || 'Failed to delete record';
                    this.isLoading = false;
                }
            });
    }
}
