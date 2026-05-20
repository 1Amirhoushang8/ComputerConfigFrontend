import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../Components/DataTable/DataTable';
import Pagination from '../../Components/Pagination/Pagination';
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

    // Data & pagination
    const [requests, setRequests] = useState<CustomerRequestListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    // Search, filter & sort
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCustomerId, setFilterCustomerId] = useState<number | ''>('');
    const [sortColumn, setSortColumn] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Modals
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<CustomerRequestListItem | null>(null);
    const [formData, setFormData] = useState<CreateCustomerRequestPayload>({
        customerId: 0,
        title: '',
        ticketId: null,
        message: '',
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<CustomerRequestListItem | null>(null);

    // Dropdown data
    const [customers, setCustomers] = useState<{ id: number; fullName: string }[]>([]);
    const [allTickets, setAllTickets] = useState<{ id: number; trackingCode: string; customerId: number }[]>([]);

    // ----- Load paginated requests + dropdown data -----
    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch paginated requests
            const requestsResponse = await fetchCustomerRequests(
                page,
                pageSize,
                searchTerm || undefined,
                filterCustomerId === '' ? undefined : filterCustomerId,
                sortColumn || undefined,
                sortDirection
            );
            setRequests(requestsResponse.items);
            setTotal(requestsResponse.total);

            // Fetch all customers & tickets for dropdowns (large page size)
            const [customersResponse, ticketsResponse] = await Promise.all([
                fetchCustomers(1, 1000),
                fetchTickets(1, 1000),
            ]);
            setCustomers(customersResponse.items.map(c => ({ id: c.id, fullName: c.fullName })));
            setAllTickets(ticketsResponse.items.map(t => ({
                id: t.id,
                trackingCode: t.trackingCode,
                customerId: t.customerId,
            })));
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                setError(err.response.data?.message || 'خطا در بارگذاری داده‌ها');
            } else {
                setError('خطا در بارگذاری داده‌ها');
            }
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, filterCustomerId, sortColumn, sortDirection]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ----- Handlers that reset page -----
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setPage(1);
    };

    const handleCustomerFilter = (value: string) => {
        setFilterCustomerId(value ? +value : '');
        setPage(1);
    };

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
        setPage(1);
    };

    // ----- Add / Edit handlers -----
    const openAddModal = () => {
        setEditingRequest(null);
        setFormData({
            customerId: customers.length > 0 ? customers[0].id : 0,
            title: '',
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
            title: req.title,
            ticketId: req.ticketId,
            message: req.message,
        });
        setFormError('');
        setShowFormModal(true);
    };

    const customerTickets = allTickets.filter(t => t.customerId === formData.customerId);

    const handleFormSave = async () => {
        if (!formData.title.trim() || !formData.message.trim() || formData.customerId <= 0) {
            setFormError('عنوان، متن درخواست و مشتری الزامی هستند.');
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

    // ----- Columns -----
    const columns: Column<CustomerRequestListItem>[] = [
        { key: 'title', header: 'عنوان' },
        { key: 'customerName', header: 'مشتری', render: (value) => (value as string) || '---' },
        {
            key: 'ticketTrackingCode',
            header: 'سرویس مرتبط',
            render: (value) => (value as string) || '---',
        },
        { key: 'message', header: 'متن درخواست' },
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

            {/* Filter bar */}
            <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
                <div className="input-group" style={{ maxWidth: '250px' }}>
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
                        onChange={(e) => handleSearch(e.target.value)}
                        dir="rtl"
                        style={{ backgroundColor: '#f5ebe0' }}
                    />
                </div>

                <select
                    className="form-select shadow-sm"
                    style={{ maxWidth: '220px' }}
                    value={filterCustomerId}
                    onChange={(e) => handleCustomerFilter(e.target.value)}
                >
                    <option value="">همه مشتریان</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>

                {canManage && (
                    <button className="btn btn-nude ms-auto" onClick={openAddModal}>
                        + افزودن درخواست
                    </button>
                )}
            </div>

            <DataTable
                data={requests}
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

            <Pagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />

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
                                    <label className="form-label">عنوان *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-12 mb-3">
                                    <label className="form-label">مشتری *</label>
                                    <select
                                        className="form-select"
                                        value={formData.customerId || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                customerId: e.target.value ? +e.target.value : 0,
                                                ticketId: null,
                                            })
                                        }
                                    >
                                        <option value="">انتخاب کنید</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                                    </select>
                                </div>
                                <div className="col-12 mb-3">
                                    <label className="form-label">سرویس مرتبط (اختیاری)</label>
                                    <select
                                        className="form-select"
                                        value={formData.ticketId || ''}
                                        onChange={(e) => setFormData({ ...formData, ticketId: e.target.value ? +e.target.value : null })}
                                    >
                                        <option value="">بدون سرویس</option>
                                        {customerTickets.map(t => <option key={t.id} value={t.id}>{t.trackingCode}</option>)}
                                    </select>
                                </div>
                                <div className="col-12 mb-3">
                                    <label className="form-label">متن درخواست *</label>
                                    <textarea
                                        className="form-control"
                                        rows={4}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowFormModal(false)} disabled={saving}>
                                انصراف
                            </button>
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