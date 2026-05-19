import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../Components/DataTable/DataTable';
import {
    fetchCustomerRequests,
    createCustomerRequest,
    updateCustomerRequest,
    deleteCustomerRequest,
    type CustomerRequestListItem,
    type CreateCustomerRequestPayload,
    type UpdateCustomerRequestPayload,
} from '../../API/customerRequestsApi';
import type { Column, Action } from '../../Models/DataTable';
import { fetchTickets } from '../../API/ticketsApi';
import { fetchCustomers } from '../../API/customersApi';
import { isAxiosError } from 'axios';
import ConfirmModal from '../../Components/ConfirmModal/ConfirmModal';
import "./CustomerRequestsList.scss";

const CustomerRequestsList = () => {
    const { user } = useAuth();
    const canManage = user?.role === 'admin' || user?.role === 'worker';

    const [requests, setRequests] = useState<CustomerRequestListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<CustomerRequestListItem | null>(null);
    const [formData, setFormData] = useState<CreateCustomerRequestPayload>({
        customerId: 0,
        ticketId: null,
        message: '',
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<CustomerRequestListItem | null>(null);

    // Dropdown data (all customers and tickets)
    const [customers, setCustomers] = useState<{ id: number; fullName: string }[]>([]);
    const [tickets, setTickets] = useState<{ id: number; trackingCode: string }[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [requestsData, customersData, ticketsData] = await Promise.all([
                fetchCustomerRequests(),          // no customerId → all requests
                fetchCustomers(),
                fetchTickets(),
            ]);
            setRequests(requestsData);
            setCustomers(customersData.map(c => ({ id: c.id, fullName: c.fullName })));
            setTickets(ticketsData.map(t => ({ id: t.id, trackingCode: t.trackingCode })));
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                setError(err.response.data?.message || 'خطا در بارگذاری داده‌ها');
            } else {
                setError('خطا در بارگذاری داده‌ها');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openAddModal = () => {
        setEditingRequest(null);
        setFormData({
            customerId: customers.length > 0 ? customers[0].id : 0,
            ticketId: null,
            message: '',
        });
        setFormError('');
        setShowFormModal(true);
    };

    const openEditModal = (req: CustomerRequestListItem) => {
        setEditingRequest(req);
        setFormData({
            customerId: req.customerId,
            ticketId: req.ticketId,
            message: req.message,
        });
        setFormError('');
        setShowFormModal(true);
    };

    const handleFormSave = async () => {
        if (!formData.message.trim() || formData.customerId <= 0) {
            setFormError('متن درخواست و مشتری الزامی هستند.');
            return;
        }
        setSaving(true);
        setFormError('');
        try {
            if (editingRequest) {
                await updateCustomerRequest(editingRequest.id, formData as UpdateCustomerRequestPayload);
            } else {
                await createCustomerRequest(formData);
            }
            setShowFormModal(false);
            loadData();
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                setFormError(err.response.data?.message || 'خطا در ذخیره درخواست');
            } else {
                setFormError('خطا در ذخیره درخواست');
            }
        } finally {
            setSaving(false);
        }
    };

    const requestDelete = (req: CustomerRequestListItem) => {
        setDeleteTarget(req);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirmed = async () => {
        if (!deleteTarget) return;
        try {
            await deleteCustomerRequest(deleteTarget.id);
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            loadData();
        } catch (err: unknown) {
            alert('خطا در حذف درخواست');
        }
    };

    // Filter & sort
    const filteredRequests = requests.filter(r =>
        r.message.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        (r.customerName || '').toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

    const sortedRequests = [...filteredRequests].sort((a, b) => {
        if (!sortColumn) return 0;
        const valA = a[sortColumn as keyof CustomerRequestListItem];
        const valB = b[sortColumn as keyof CustomerRequestListItem];
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

    const columns: Column<CustomerRequestListItem>[] = [
        { key: 'customerName', header: 'مشتری', render: (value) => (value as string) || '---' },
        { key: 'message', header: 'متن درخواست' },
        {
            key: 'ticketTrackingCode',
            header: 'کد رهگیری',
            render: (value) => (value as string) || '---',
        },
        {
            key: 'answer',
            header: 'پاسخ مشتری',
            render: (value) => {
                if (value === true) return <span className="badge bg-success">بله</span>;
                if (value === false) return <span className="badge bg-danger">خیر</span>;
                return <span className="badge bg-secondary">بی‌پاسخ</span>;
            },
        },
        { key: 'createdBy', header: 'ایجاد کننده' },
        {
            key: 'createdAt',
            header: 'تاریخ',
            render: (value) => (
                <span>
          {new Date(value as string).toLocaleDateString('fa-IR', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
          })}
        </span>
            ),
        },
    ];

    const actions: Action<CustomerRequestListItem>[] = canManage
        ? [
            {
                label: 'ویرایش',
                onClick: openEditModal,
                requiredRoles: ['admin', 'worker'],
                className: 'btn-outline-primary',
            },
            {
                label: 'حذف',
                onClick: requestDelete,
                requiredRoles: ['admin'],
                className: 'btn-outline-danger',
            },
        ]
        : [];

    return (
        <div className="container-fluid customer-requests-page">
            <h2 className="mb-3">درخواست‌های مشتریان</h2>

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
                        placeholder="جستجو..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        dir="rtl"
                        style={{ backgroundColor: '#f5ebe0' }}
                    />
                </div>
                {canManage && (
                    <button className="btn btn-nude ms-auto" onClick={openAddModal}>
                        + افزودن درخواست
                    </button>
                )}
            </div>

            <DataTable
                data={sortedRequests}
                columns={columns}
                keyExtractor={(r) => r.id}
                actions={actions}
                userRole={user?.role}
                loading={loading}
                error={error}
                emptyMessage="هیچ درخواستی ثبت نشده است."
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
            />

            {/* Add/Edit Modal */}
            <div className={`modal fade ${showFormModal ? 'show' : ''}`} style={{ display: showFormModal ? 'block' : 'none' }} tabIndex={-1}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content" dir="rtl">
                        <div className="modal-header">
                            <h5 className="modal-title">{editingRequest ? 'ویرایش درخواست' : 'افزودن درخواست'}</h5>
                            <button type="button" className="btn-close" onClick={() => setShowFormModal(false)}></button>
                        </div>
                        <div className="modal-body">
                            {formError && <div className="alert alert-danger">{formError}</div>}
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <label className="form-label">مشتری *</label>
                                    <select className="form-select" value={formData.customerId || ''}
                                            onChange={(e) => setFormData({ ...formData, customerId: e.target.value ? +e.target.value : 0 })}>
                                        <option value="">انتخاب کنید</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                                    </select>
                                </div>
                                <div className="col-12 mb-3">
                                    <label className="form-label">متن درخواست *</label>
                                    <textarea className="form-control" rows={4} value={formData.message}
                                              onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
                                </div>
                                <div className="col-12 mb-3">
                                    <label className="form-label">سرویس مرتبط (اختیاری)</label>
                                    <select className="form-select" value={formData.ticketId || ''}
                                            onChange={(e) => setFormData({ ...formData, ticketId: e.target.value ? +e.target.value : null })}>
                                        <option value="">بدون سرویس</option>
                                        {tickets.map(t => <option key={t.id} value={t.id}>{t.trackingCode}</option>)}
                                    </select>
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
                title="حذف درخواست"
                message={<span>آیا از حذف این درخواست مطمئن هستید؟</span>}
                confirmLabel="حذف"
                cancelLabel="انصراف"
                onConfirm={handleDeleteConfirmed}
                onCancel={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
            />
        </div>
    );
};

export default CustomerRequestsList;