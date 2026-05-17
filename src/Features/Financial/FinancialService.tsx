import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../Components/DataTable/DataTable';
import type { Column, Action } from '../../Models/DataTable';
import {
    fetchFinancialRecords,
    createFinancialRecord,
    updateFinancialRecord,
    deleteFinancialRecord,
    type FinancialRecordListItem,
    type CreateFinancialRecordPayload,
    type UpdateFinancialRecordPayload,
} from '../../API/financialApi';
import { fetchTickets } from '../../API/ticketsApi';
import { isAxiosError } from 'axios';
import ConfirmModal from '../../Components/ConfirmModal/ConfirmModal';

const FinancialService = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [records, setRecords] = useState<FinancialRecordListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Add / Edit modal
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<FinancialRecordListItem | null>(null);
    const [formData, setFormData] = useState<CreateFinancialRecordPayload>({
        title: '',
        amount: 0,
        dateTime: new Date().toISOString(),
        ticketId: undefined,
        description: '',
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Delete modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<FinancialRecordListItem | null>(null);

    // Tickets for dropdown
    const [tickets, setTickets] = useState<{ id: number; trackingCode: string }[]>([]);

    const loadData = useCallback(async () => {
        if (!isAdmin) return;
        setLoading(true);
        setError('');
        try {
            const [financialData, ticketData] = await Promise.all([
                fetchFinancialRecords(),
                fetchTickets(),
            ]);
            setRecords(financialData);
            setTickets(ticketData.map(t => ({ id: t.id, trackingCode: t.trackingCode })));
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                setError(err.response.data?.message || 'خطا در بارگذاری داده‌ها');
            } else {
                setError('خطا در بارگذاری داده‌ها');
            }
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (!isAdmin) {
        return <div className="alert alert-warning">دسترسی غیرمجاز</div>;
    }

    // Sort & filter
    const filteredRecords = records.filter(r =>
        r.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
    const sortedRecords = [...filteredRecords].sort((a, b) => {
        if (!sortColumn) return 0;
        const valA = a[sortColumn as keyof FinancialRecordListItem];
        const valB = b[sortColumn as keyof FinancialRecordListItem];
        if (valA == null || valB == null) return 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortDirection === 'asc' ? valA.localeCompare(valB, 'fa') : valB.localeCompare(valA, 'fa');
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
    });

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    const openAddModal = () => {
        setEditingRecord(null);
        setFormData({
            title: '',
            amount: 0,
            dateTime: new Date().toISOString(),
            ticketId: undefined,
            description: '',
        });
        setFormError('');
        setShowFormModal(true);
    };

    const openEditModal = (record: FinancialRecordListItem) => {
        setEditingRecord(record);
        setFormData({
            title: record.title,
            amount: record.amount,
            dateTime: record.dateTime,
            ticketId: tickets.find(t => t.trackingCode === record.ticketTrackingCode)?.id,
            description: record.description,
        });
        setFormError('');
        setShowFormModal(true);
    };

    const handleFormSave = async () => {
        if (!formData.title.trim() || formData.amount <= 0) {
            setFormError('عنوان و مبلغ الزامی هستند.');
            return;
        }
        setSaving(true);
        setFormError('');
        try {
            if (editingRecord) {
                await updateFinancialRecord(editingRecord.id, formData as UpdateFinancialRecordPayload);
            } else {
                await createFinancialRecord(formData);
            }
            setShowFormModal(false);
            loadData();
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                setFormError(err.response.data?.message || 'خطا در ذخیره گزارش');
            } else {
                setFormError('خطا در ذخیره گزارش');
            }
        } finally {
            setSaving(false);
        }
    };

    const requestDelete = (record: FinancialRecordListItem) => {
        setDeleteTarget(record);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirmed = async () => {
        if (!deleteTarget) return;
        try {
            await deleteFinancialRecord(deleteTarget.id);
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            loadData();
        } catch (err: unknown) {
            alert('خطا در حذف گزارش');
        }
    };

    const columns: Column<FinancialRecordListItem>[] = [
        { key: 'title', header: 'عنوان' },
        {
            key: 'amount',
            header: 'مبلغ (ریال)',
            render: (value) => <span>{Number(value).toLocaleString()}</span>,
        },
        {
            key: 'dateTime',
            header: 'تاریخ و زمان',
            render: (value) => (
                <span>
          {new Date(value as string).toLocaleDateString('fa-IR', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
          })}
        </span>
            ),
        },
        {
            key: 'ticketTrackingCode',
            header: 'سرویس مرتبط',
            render: (value) => (value as string) || '---',
        },
        { key: 'description', header: 'توضیحات' },
    ];

    const actions: Action<FinancialRecordListItem>[] = [
        {
            label: 'ویرایش',
            onClick: openEditModal,
            requiredRoles: ['admin'],
            className: 'btn-outline-primary',
        },
        {
            label: 'حذف',
            onClick: requestDelete,
            requiredRoles: ['admin'],
            className: 'btn-outline-danger',
        },
    ];

    return (
        <div className="container-fluid">
            <h2 className="mb-3">گزارش‌های مالی</h2>

            <div className="d-flex align-items-center gap-2 mb-4">
                <div className="input-group" style={{ maxWidth: '320px' }}>
          <span className="input-group-text bg-dark text-white border-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85z"/>
              <path d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"/>
            </svg>
          </span>
                    <input
                        type="text"
                        className="form-control border-0 shadow-sm"
                        placeholder="جستجو بر اساس عنوان..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        dir="rtl"
                        style={{ backgroundColor: '#f5ebe0' }}
                    />
                </div>
                <button className="btn btn-nude ms-auto" onClick={openAddModal}>
                    + افزودن گزارش
                </button>
            </div>

            <DataTable
                data={sortedRecords}
                columns={columns}
                keyExtractor={(r) => r.id}
                actions={actions}
                userRole={user?.role}
                loading={loading}
                error={error}
                emptyMessage="هیچ گزارش مالی ثبت نشده است."
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
            />

            {/* Form Modal (Add/Edit) */}
            <div className={`modal fade ${showFormModal ? 'show' : ''}`} style={{ display: showFormModal ? 'block' : 'none' }} tabIndex={-1}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content" dir="rtl">
                        <div className="modal-header">
                            <h5 className="modal-title">{editingRecord ? 'ویرایش گزارش' : 'افزودن گزارش مالی'}</h5>
                            <button type="button" className="btn-close" onClick={() => setShowFormModal(false)}></button>
                        </div>
                        <div className="modal-body">
                            {formError && <div className="alert alert-danger">{formError}</div>}
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">عنوان *</label>
                                    <input type="text" className="form-control" value={formData.title}
                                           onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">مبلغ (ریال) *</label>
                                    <input type="number" className="form-control" value={formData.amount}
                                           onChange={(e) => setFormData({ ...formData, amount: +e.target.value })} required />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">تاریخ و زمان</label>
                                    <input type="datetime-local" className="form-control" value={formData.dateTime.slice(0,16)}
                                           onChange={(e) => setFormData({ ...formData, dateTime: new Date(e.target.value).toISOString() })} />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">سرویس مرتبط</label>
                                    <select className="form-select" value={formData.ticketId || ''} onChange={(e) => setFormData({ ...formData, ticketId: e.target.value ? +e.target.value : undefined })}>
                                        <option value="">بدون سرویس</option>
                                        {tickets.map(t => <option key={t.id} value={t.id}>{t.trackingCode}</option>)}
                                    </select>
                                </div>
                                <div className="col-12 mb-3">
                                    <label className="form-label">توضیحات</label>
                                    <textarea className="form-control" rows={3} value={formData.description}
                                              onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowFormModal(false)} disabled={saving}>انصراف</button>
                            <button className="btn btn-primary" onClick={handleFormSave} disabled={saving}>
                                {saving ? 'در حال ذخیره...' : 'ذخیره'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showFormModal && <div className="modal-backdrop fade show" onClick={() => setShowFormModal(false)}></div>}

            {/* Delete Confirm Modal */}
            <ConfirmModal
                show={showDeleteConfirm}
                title="حذف گزارش مالی"
                message={<span>آیا از حذف گزارش <strong>{deleteTarget?.title}</strong> مطمئن هستید؟</span>}
                confirmLabel="حذف"
                cancelLabel="انصراف"
                onConfirm={handleDeleteConfirmed}
                onCancel={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
            />
        </div>
    );
};

export default FinancialService;