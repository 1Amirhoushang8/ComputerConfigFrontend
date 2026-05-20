import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../Components/DataTable/DataTable';
import Pagination from '../../Components/Pagination/Pagination';
import {
    fetchTickets,
    updateTicket,
    updateTicketStatus,
    deleteTicket,
    type TicketListItem,
    type UpdateTicketPayload,
} from '../../API/ticketsApi';
import type { Column, Action } from '../../Models/DataTable';
import { fetchCustomers } from '../../API/customersApi';
import { fetchWorkers } from '../../API/workersApi';
import type { WorkerListItem } from '../../Models/WorkerListItem';
import type { CustomerListItem } from '../../Models/CustomerListItem';
import { isAxiosError } from 'axios';
import ConfirmModal from '../../Components/ConfirmModal/ConfirmModal';
import "./PCServices.scss";

const statusOptions = [
    'در انتظار پرداخت',
    'پرداخت شده',
    'در انتظار قطعه',
    'درحال تعمیر',
    'تعمیر شده',
    'لغو شده',
];

const PCServices = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [tickets, setTickets] = useState<TicketListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ---------- Pagination ----------
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    // ---------- Search, filter & sort ----------
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [sortColumn, setSortColumn] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Edit modal (admin only)
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState<UpdateTicketPayload>({
        title: '',
        customerId: 0,
        workerId: 0,
        serviceType: '',
        deviceType: '',
        brand: '',
        model: '',
        serialNumber: '',
        problemDescription: '',
    });
    const [editTicketId, setEditTicketId] = useState<number | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState('');

    // Delete confirmation (admin only)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<TicketListItem | null>(null);

    // Dropdown data (for edit modal)
    const [customers, setCustomers] = useState<CustomerListItem[]>([]);
    const [workers, setWorkers] = useState<WorkerListItem[]>([]);

    // System info modal (both roles)
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoTicket, setInfoTicket] = useState<TicketListItem | null>(null);

    const canView = user?.role === 'admin' || user?.role === 'worker';
    const isAdmin = user?.role === 'admin';

    // ----- Data loader (server‑side paginated tickets) -----
    const loadTickets = useCallback(async () => {
        if (!canView) return;
        setLoading(true);
        setError('');
        try {
            const data = await fetchTickets(
                page,
                pageSize,
                searchTerm,
                statusFilter || undefined,
                undefined,        // customerId – not used on this page
                sortColumn || undefined,
                sortDirection
            );
            setTickets(data.items);
            setTotal(data.total);
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                setError(err.response.data?.message || 'خطا در بارگذاری داده‌ها');
            } else {
                setError('خطا در بارگذاری داده‌ها');
            }
        } finally {
            setLoading(false);
        }
    }, [canView, page, searchTerm, statusFilter, sortColumn, sortDirection]);

    // ----- Load dropdown data (customers & workers) -----
    const loadDropdowns = useCallback(async () => {
        if (!isAdmin) {
            setWorkers([]);
            return;
        }
        try {
            const [custData, workData] = await Promise.all([
                fetchCustomers(1, 1000),
                fetchWorkers(1, 1000),
            ]);
            setCustomers(custData.items);
            setWorkers(workData.items);
        } catch {
            // ignore dropdown errors
        }
    }, [isAdmin]);

    useEffect(() => {
        loadTickets();
        loadDropdowns();
    }, [loadTickets, loadDropdowns]);

    // ----- Handlers that reset page -----
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setPage(1);
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
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

    // ----- Status change (inline) -----
    const handleStatusChange = async (ticketId: number, newStatus: string) => {
        try {
            const updatedTicket = await updateTicketStatus(ticketId, newStatus);
            setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)));
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                alert(err.response.data?.message || 'خطا در بروزرسانی وضعیت');
            } else {
                alert('خطا در بروزرسانی وضعیت');
            }
        }
    };

    // ----- Edit handlers -----
    const openEditModal = (ticket: TicketListItem) => {
        if (!isAdmin) return;
        setEditTicketId(ticket.id);
        setEditForm({
            title: ticket.title,
            customerId: ticket.customerId,
            workerId: ticket.workerId ?? 0,
            serviceType: ticket.serviceType,
            deviceType: ticket.deviceType,
            brand: ticket.brand,
            model: ticket.model,
            serialNumber: ticket.serialNumber,
            problemDescription: ticket.problemDescription,
        });
        setEditError('');
        setShowEditModal(true);
    };

    const handleEditSave = async () => {
        if (!isAdmin || !editTicketId) return;
        if (!editForm.title.trim() || !editForm.customerId || !editForm.workerId || !editForm.serviceType.trim()) {
            setEditError('عنوان، مشتری، تعمیرکار و نوع سرویس الزامی هستند.');
            return;
        }
        setSavingEdit(true);
        setEditError('');
        try {
            await updateTicket(editTicketId, editForm);
            setShowEditModal(false);
            loadTickets();
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                setEditError(err.response.data?.message || 'خطا در بروزرسانی سرویس');
            } else {
                setEditError('خطا در بروزرسانی سرویس');
            }
        } finally {
            setSavingEdit(false);
        }
    };

    // ----- Delete handlers -----
    const requestDelete = (ticket: TicketListItem) => {
        if (!isAdmin) return;
        setDeleteTarget(ticket);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirmed = async () => {
        if (!isAdmin || !deleteTarget) return;
        try {
            await deleteTicket(deleteTarget.id);
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
            loadTickets();
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                alert(err.response.data?.message || 'خطا در حذف سرویس');
            } else {
                alert('خطا در حذف سرویس');
            }
        }
    };

    // ----- System info -----
    const openInfoModal = (ticket: TicketListItem) => {
        setInfoTicket(ticket);
        setShowInfoModal(true);
    };

    // ----- Columns -----
    const columns: Column<TicketListItem>[] = [
        { key: 'trackingCode', header: 'کد رهگیری' },
        { key: 'title', header: 'عنوان' },
        { key: 'customerName', header: 'مشتری' },
        {
            key: 'deviceType',
            header: 'مشخصات سیستم',
            render: (_value, row) => (
                <button className="btn btn-sm btn-outline-secondary" onClick={() => openInfoModal(row)}>
                    مشاهده
                </button>
            ),
        },
        { key: 'serviceType', header: 'نوع سرویس' },
        {
            key: 'status',
            header: 'وضعیت',
            render: (_value, row) => (
                <select
                    className="form-select form-select-sm"
                    value={row.status}
                    onChange={(e) => handleStatusChange(row.id, e.target.value)}
                    style={{ minWidth: '140px' }}
                >
                    {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            ),
        },
        {
            key: 'updatedAt',
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
        {
            key: 'workerName',
            header: 'تعمیرکار',
            render: (value) => (value as string) || '---',
        },
    ];

    const actions: Action<TicketListItem>[] = isAdmin
        ? [
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
        ]
        : [];

    return (
        <div className="container-fluid pcservices-page">
            <h2 className="mb-3">مدیریت سیستم‌ها</h2>

            <div className="d-flex align-items-center gap-2 mb-4 flex-wrap search-row">
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
                    style={{ maxWidth: '180px' }}
                    value={statusFilter}
                    onChange={(e) => handleStatusFilter(e.target.value)}
                >
                    <option value="">همه وضعیت‌ها</option>
                    {statusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                {isAdmin && (
                    <button className="btn btn-nude ms-auto" onClick={() => navigate('/app/add-service')}>
                        + افزودن سرویس
                    </button>
                )}
            </div>

            <DataTable
                data={tickets}                  // directly from API
                columns={columns}
                keyExtractor={(t) => t.id}
                actions={actions}
                userRole={user?.role}
                loading={loading}
                error={error}
                emptyMessage="هیچ سرویسی ثبت نشده است."
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
            />

            <Pagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />

            {/* Edit Modal – admin only */}
            {isAdmin && (
                <div className={`modal fade ${showEditModal ? 'show' : ''}`} style={{ display: showEditModal ? 'block' : 'none' }} tabIndex={-1}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content" dir="rtl">
                            <div className="modal-header">
                                <h5 className="modal-title">ویرایش سرویس</h5>
                                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {editError && <div className="alert alert-danger">{editError}</div>}
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">عنوان *</label>
                                        <input type="text" className="form-control" value={editForm.title}
                                               onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">مشتری *</label>
                                        <select className="form-select" value={editForm.customerId} onChange={(e) => setEditForm({ ...editForm, customerId: +e.target.value })} required>
                                            <option value={0}>انتخاب کنید</option>
                                            {customers.map((c) => (<option key={c.id} value={c.id}>{c.fullName}</option>))}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">تعمیرکار *</label>
                                        <select className="form-select" value={editForm.workerId} onChange={(e) => setEditForm({ ...editForm, workerId: +e.target.value })} required>
                                            <option value={0}>انتخاب کنید</option>
                                            {workers.map((w) => (<option key={w.id} value={w.id}>{w.fullName}</option>))}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">نوع سرویس *</label>
                                        <input type="text" className="form-control" value={editForm.serviceType}
                                               onChange={(e) => setEditForm({ ...editForm, serviceType: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">نوع دستگاه</label>
                                        <input type="text" className="form-control" value={editForm.deviceType}
                                               onChange={(e) => setEditForm({ ...editForm, deviceType: e.target.value })} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">برند</label>
                                        <input type="text" className="form-control" value={editForm.brand}
                                               onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">مدل</label>
                                        <input type="text" className="form-control" value={editForm.model}
                                               onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">سریال</label>
                                        <input type="text" className="form-control" value={editForm.serialNumber}
                                               onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })} />
                                    </div>
                                    <div className="col-12 mb-3">
                                        <label className="form-label">توضیحات مشکل</label>
                                        <textarea className="form-control" rows={3} value={editForm.problemDescription}
                                                  onChange={(e) => setEditForm({ ...editForm, problemDescription: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={savingEdit}>انصراف</button>
                                <button className="btn btn-primary" onClick={handleEditSave} disabled={savingEdit}>
                                    {savingEdit ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showEditModal && <div className="modal-backdrop fade show" onClick={() => setShowEditModal(false)}></div>}

            {/* ===== FULL DETAIL PANEL ===== */}
            <div className={`modal fade ${showInfoModal ? 'show' : ''}`} style={{ display: showInfoModal ? 'block' : 'none' }} tabIndex={-1}>
                <div className="modal-dialog modal-lg detail-panel">
                    <div className="modal-content" dir="rtl">
                        <div className="modal-header bg-dark text-white">
                            <h5 className="modal-title">جزئیات کامل سرویس</h5>
                            <button type="button" className="btn-close btn-close-white" onClick={() => setShowInfoModal(false)}></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {infoTicket && (
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3"><label className="fw-bold text-muted">کد رهگیری</label><div className="fs-5">{infoTicket.trackingCode}</div></div>
                                        <div className="mb-3"><label className="fw-bold text-muted">عنوان</label><div className="fs-5">{infoTicket.title}</div></div>
                                        <div className="mb-3"><label className="fw-bold text-muted">مشتری</label><div className="fs-5">{infoTicket.customerName}</div></div>
                                        <div className="mb-3"><label className="fw-bold text-muted">تعمیرکار</label><div className="fs-5">{infoTicket.workerName || '---'}</div></div>
                                        <div className="mb-3"><label className="fw-bold text-muted">نوع سرویس</label><div className="fs-5">{infoTicket.serviceType}</div></div>
                                        <div className="mb-3"><label className="fw-bold text-muted">وضعیت</label>
                                            <span className={`badge ${infoTicket.status === 'تعمیر شده' ? 'bg-success' : infoTicket.status === 'لغو شده' ? 'bg-danger' : 'bg-primary'}`}>{infoTicket.status}</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3"><label className="fw-bold text-muted">نوع دستگاه</label><div className="fs-5">{infoTicket.deviceType || '---'}</div></div>
                                        <div className="mb-3"><label className="fw-bold text-muted">برند</label><div className="fs-5">{infoTicket.brand || '---'}</div></div>
                                        <div className="mb-3"><label className="fw-bold text-muted">مدل</label><div className="fs-5">{infoTicket.model || '---'}</div></div>
                                        <div className="mb-3"><label className="fw-bold text-muted">سریال</label><div className="fs-5">{infoTicket.serialNumber || '---'}</div></div>
                                        <div className="mb-3"><label className="fw-bold text-muted">توضیحات</label><div className="fs-5">{infoTicket.problemDescription || '---'}</div></div>
                                        <div className="mb-3"><label className="fw-bold text-muted">تاریخ ایجاد</label><div className="fs-5">{new Date(infoTicket.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></div>
                                        <div className="mb-3"><label className="fw-bold text-muted">آخرین بروزرسانی</label><div className="fs-5">{new Date(infoTicket.updatedAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowInfoModal(false)}>بستن</button>
                        </div>
                    </div>
                </div>
            </div>
            {showInfoModal && <div className="modal-backdrop fade show" onClick={() => setShowInfoModal(false)}></div>}

            {/* Delete Confirmation Modal – admin only */}
            {isAdmin && (
                <ConfirmModal
                    show={showDeleteConfirm}
                    title="حذف سرویس"
                    message={<span>آیا از حذف سرویس <strong>{deleteTarget?.title}</strong> مطمئن هستید؟</span>}
                    confirmLabel="حذف"
                    cancelLabel="انصراف"
                    onConfirm={handleDeleteConfirmed}
                    onCancel={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
                />
            )}
        </div>
    );
};

export default PCServices;