import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import dayjs, { Dayjs } from 'dayjs/esm';
import utc from 'dayjs/esm/plugin/utc';
dayjs.extend(utc);
import { NgxDaterangepickerMd, LOCALE_CONFIG, LocaleService } from 'ngx-daterangepicker-material';

@Component({
    selector: 'app-record',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, NgxDaterangepickerMd],
    providers: [
        { provide: LOCALE_CONFIG, useValue: {} },
        { provide: LocaleService, useClass: LocaleService, deps: [LOCALE_CONFIG] }
    ],
    templateUrl: './record.component.html',
    styleUrl: './record.component.scss'
})
export class RecordComponent implements OnInit, OnDestroy {
    records: any[] = [];
    isLoading = false;
    successMessage = '';
    errorMessage = '';

    recordFilter = {
        type: 'receiving',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        username: '',
        scanNo: '',
        search: ''
    };

    selectedDateRange: { startDate: Dayjs; endDate: Dayjs } = {
        startDate: dayjs(),
        endDate: dayjs()
    };

    // Pagination state
    currentPage = 1;
    itemsPerPage = 50;
    totalItems = 0;
    totalPages = 0;
    goToPageInput: number | null = null;
    Math = Math;

    selectedRecord: any = null;
    recordForm!: FormGroup;
    showRecordEditModal = false;

    // ==================== BATCH DELETE ====================
    selectedRecords: Set<string> = new Set();
    showBatchDeleteModal = false;

    constructor(
        private http: HttpClient,
        private fb: FormBuilder
    ) { }
    
    private search$ = new Subject<string>();
    private destroy$ = new Subject<void>();

    ngOnInit() {
        this.initForm();
        this.search$.pipe(debounceTime(400), takeUntil(this.destroy$))
            .subscribe(() => this.loadRecords(1, true));
        this.loadRecords();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onSearchInput() {
        this.search$.next(this.recordFilter.search);
    }

    onDateRangeSelected(range: { startDate: Dayjs; endDate: Dayjs }) {
        this.selectedDateRange = range;
        this.recordFilter.startDate = range.startDate.format('YYYY-MM-DD');
        this.recordFilter.endDate = range.endDate.format('YYYY-MM-DD');
        this.loadRecords(1, true);
    }

    clearSearch() {
        this.recordFilter.search = '';
        this.loadRecords(1);
    }

    initForm() {
        this.recordForm = this.fb.group({
            quantity: [0, [Validators.required, Validators.min(1)]],
            username: ['', Validators.required],
            description: ['']
        });
    }

    /** Nomor halaman yang ditampilin di pagination, dengan "…" kalau totalPages banyak
     * (misal 823 halaman - gak masuk akal nampilin semuanya, cukup sekitar halaman aktif). */
    get pageNumbers(): (number | string)[] {
        const total = this.totalPages;
        const current = this.currentPage;
        const delta = 2; // berapa halaman di kiri-kanan current yang ditampilin penuh
        const pages: (number | string)[] = [];

        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
            return pages;
        }

        pages.push(1);
        if (current - delta > 2) pages.push('...');

        const start = Math.max(2, current - delta);
        const end = Math.min(total - 1, current + delta);
        for (let i = start; i <= end; i++) pages.push(i);

        if (current + delta < total - 1) pages.push('...');
        pages.push(total);

        return pages;
    }

    goToPage() {
        if (this.goToPageInput && this.goToPageInput >= 1 && this.goToPageInput <= this.totalPages) {
            this.onPageChange(this.goToPageInput);
            this.goToPageInput = null;
        }
    }

    clearFilters() {
        this.recordFilter = {
            type: 'receiving',
            startDate: new Date().toISOString().slice(0, 10),
            endDate: new Date().toISOString().slice(0, 10),
            username: '',
            scanNo: '',
            search: ''
        };
        this.selectedDateRange = { startDate: dayjs(), endDate: dayjs() };
        this.loadRecords();
    }

    loadRecords(page: number = 1, silent: boolean = false) {
        this.currentPage = page;
        console.log(`🔍 Loading records (Page ${this.currentPage}, Limit ${this.itemsPerPage})`);

        if (!silent) this.isLoading = true;
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
                    if (!silent) this.isLoading = false;
                },
                error: (err) => {
                    console.error('❌ Failed to load records:', err);
                    this.errorMessage = err.error?.error || 'Failed to load records';
                    if (!silent) this.isLoading = false;
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
        this.recordForm.markAsPristine();
        this.recordForm.markAsUntouched();
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
        const confirmMsg = `Delete this record?\n\nBarcode: ${record.original_barcode}\nScan #${record.scan_no}\nQuantity: ${record.quantity}\nDate/Time: ${record.date_time}`;
        if (!confirm(confirmMsg)) return;

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

    getRecordId(r: any): string {
        return `${this.recordFilter.type}|${r.date_time}|${r.scan_no}|${r.username}`;
    }

    isRecordSelected(id: string): boolean {
        return this.selectedRecords.has(id);
    }

    toggleRecordSelection(id: string): void {
        if (this.selectedRecords.has(id)) {
            this.selectedRecords.delete(id);
        } else {
            this.selectedRecords.add(id);
        }
    }

    get hasSelectedRecords(): boolean {
        return this.selectedRecords.size > 0;
    }

    get allRecordsSelected(): boolean {
        return this.records.length > 0 &&
            this.records.every(r => this.isRecordSelected(this.getRecordId(r)));
    }

    selectAllRecords(): void {
        this.records.forEach(r => this.selectedRecords.add(this.getRecordId(r)));
    }

    deselectAllRecords(): void {
        this.selectedRecords.clear();
    }

    openBatchDeleteModal(): void {
        if (this.selectedRecords.size === 0) {
            this.errorMessage = 'Please select at least one record to delete';
            setTimeout(() => this.errorMessage = '', 3000);
            return;
        }
        this.showBatchDeleteModal = true;
    }

    onBatchDelete(): void {
        if (this.selectedRecords.size === 0) return;

        this.isLoading = true;
        const items = Array.from(this.selectedRecords).map(id => {
            const [type, dateTime, scanNo, username] = id.split('|');
            return { type, dateTime, scanNo, username };
        });

        this.http.post<any>(`${environment.apiUrl}/master-data/record/batch-delete`, { items })
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.successMessage = response.message || `${response.successCount} record(s) deleted`;
                        this.selectedRecords.clear();
                        this.showBatchDeleteModal = false;
                        this.loadRecords();
                        setTimeout(() => this.successMessage = '', 3000);
                    }
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('❌ Batch delete failed:', err);
                    this.errorMessage = err.error?.error || 'Failed to batch delete records';
                    this.isLoading = false;
                }
            });
    }
}