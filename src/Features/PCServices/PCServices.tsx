import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../Components/DataTable/DataTable';
import type { Column, Action } from '../../Models/DataTable';
import type { CustomerListItem } from '../../Models/CustomerListItem';
import {
    fetchTickets,
    createTicket,
    updateTicket,
    updateTicketStatus,
    deleteTicket,
    type TicketListItem,
    type CreateTicketPayload,
    type UpdateTicketPayload,
} from '../../API/ticketsApi';
import  {fetchCustomers} from '../../API/customersApi';
import { fetchWorkers } from '../../API/workersApi';
import type {WorkerListItem} from '../../Models/WorkerListItem';
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

    const [tickets, setTickets] = useState<TicketListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [sortColumn, setSortColumn] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Add modal (admin only)
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState<CreateTicketPayload>({
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
    const [savingAdd, setSavingAdd] = useState(false);
    const [addError, setAddError] = useState('');

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

    // Dropdown data
    const [customers, setCustomers] = useState<CustomerListItem[]>([]);
    const [workers, setWorkers] = useState<WorkerListItem[]>([]);

    // System info modal (available to both roles)
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoTicket, setInfoTicket] = useState<TicketListItem | null>(null);

    const canView = user?.role === 'admin' || user?.role === 'worker';
    const isAdmin = user?.role === 'admin';

    // Data loader – workers only fetched when admin
    const loadData = useCallback(async () => {
        if (!canView) return;

        await new Promise(resolve => setTimeout(resolve, 0)); // avoid sync setState

        setLoading(true);
        setError('');

        try {
            const customerPromise = fetchCustomers();
            // Only admin can fetch workers; workers get 403 otherwise
            const workerPromise = isAdmin ? fetchWorkers() : Promise.resolve([] as WorkerListItem[]);
            const ticketPromise = fetchTickets(searchTerm, statusFilter);

            const [ticketData, customerData, workerData] = await Promise.all([
                ticketPromise,
                customerPromise,
                workerPromise,
            ]);

            setTickets(ticketData);
            setCustomers(customerData);
            setWorkers(workerData);
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                setError(err.response.data?.message || 'خطا در بارگذاری داده‌ها');
            } else {
                setError('خطا در بارگذاری داده‌ها');
            }
        } finally {
            setLoading(false);
        }
    }, [canView, searchTerm, statusFilter, isAdmin]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Sorting
    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    const sortedTickets = [...tickets].sort((a, b) => {
        if (!sortColumn) return 0;
        const valA = a[sortColumn as keyof TicketListItem];
        const valB = b[sortColumn as keyof TicketListItem];
        if (valA == null || valB == null) return 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortDirection === 'asc' ? valA.localeCompare(valB, 'fa') : valB.localeCompare(valA, 'fa');
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
    });

    // Status change – allowed for both roles
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

    // Admin actions – guarded by isAdmin
    const openAddModal = () => {
        if (!isAdmin) return;
        setAddForm({
            title: '',
            customerId: customers.length > 0 ? customers[0].id : 0,
            workerId: workers.length > 0 ? workers[0].id : 0,
            serviceType: '',
            deviceType: '',
            brand: '',
            model: '',
            serialNumber: '',
            problemDescription: '',
        });
        setAddError('');
        setShowAddModal(true);
    };

    const handleAddSave = async () => {
        if (!isAdmin) return;
        if (!addForm.title.trim() || !addForm.customerId || !addForm.workerId || !addForm.serviceType.trim()) {
            setAddError('عنوان، مشتری، تعمیرکار و نوع سرویس الزامی هستند.');
            return;
        }
        setSavingAdd(true);
        setAddError('');
        try {
            await createTicket(addForm);
            setShowAddModal(false);
            loadData();
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                setAddError(err.response.data?.message || 'خطا در ایجاد سرویس');
            } else {
                setAddError('خطا در ایجاد سرویس');
            }
        } finally {
            setSavingAdd(false);
        }
    };

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
            loadData();
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
            loadData();
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                alert(err.response.data?.message || 'خطا در حذف سرویس');
            } else {
                alert('خطا در حذف سرویس');
            }
        }
    };

    // System info – both roles
    const openInfoModal = (ticket: TicketListItem) => {
        setInfoTicket(ticket);
        setShowInfoModal(true);
    };

    // Columns definition
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

    // Actions – only admin sees edit/delete
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
                        onChange={(e) => setSearchTerm(e.target.value)}
                        dir="rtl"
                        style={{ backgroundColor: '#f5ebe0' }}
                    />
                </div>
                <select
                    className="form-select shadow-sm"
                    style={{ maxWidth: '180px' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">همه وضعیت‌ها</option>
                    {statusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                {isAdmin && (
                    <button className="btn btn-nude ms-auto" onClick={openAddModal}>
                        + افزودن سرویس
                    </button>
                )}
            </div>

            <DataTable
                data={sortedTickets}
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

            {/* Add Modal – admin only */}
            {isAdmin && (
                <div className={`modal fade ${showAddModal ? 'show' : ''}`} style={{ display: showAddModal ? 'block' : 'none' }} tabIndex={-1}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content" dir="rtl">
                            <div className="modal-header">
                                <h5 className="modal-title">افزودن سرویس جدید</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {addError && <div className="alert alert-danger">{addError}</div>}
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">عنوان *</label>
                                        <input type="text" className="form-control" value={addForm.title}
                                               onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">مشتری *</label>
                                        <select className="form-select" value={addForm.customerId} onChange={(e) => setAddForm({ ...addForm, customerId: +e.target.value })} required>
                                            <option value={0}>انتخاب کنید</option>
                                            {customers.map((c) => (<option key={c.id} value={c.id}>{c.fullName}</option>))}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">تعمیرکار *</label>
                                        <select className="form-select" value={addForm.workerId} onChange={(e) => setAddForm({ ...addForm, workerId: +e.target.value })} required>
                                            <option value={0}>انتخاب کنید</option>
                                            {workers.map((w) => (<option key={w.id} value={w.id}>{w.fullName}</option>))}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">نوع سرویس *</label>
                                        <input type="text" className="form-control" value={addForm.serviceType}
                                               onChange={(e) => setAddForm({ ...addForm, serviceType: e.target.value })} required placeholder="مثلاً سخت‌افزاری" />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">نوع دستگاه</label>
                                        <input type="text" className="form-control" value={addForm.deviceType}
                                               onChange={(e) => setAddForm({ ...addForm, deviceType: e.target.value })} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">برند</label>
                                        <input type="text" className="form-control" value={addForm.brand}
                                               onChange={(e) => setAddForm({ ...addForm, brand: e.target.value })} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">مدل</label>
                                        <input type="text" className="form-control" value={addForm.model}
                                               onChange={(e) => setAddForm({ ...addForm, model: e.target.value })} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">سریال</label>
                                        <input type="text" className="form-control" value={addForm.serialNumber}
                                               onChange={(e) => setAddForm({ ...addForm, serialNumber: e.target.value })} />
                                    </div>
                                    <div className="col-12 mb-3">
                                        <label className="form-label">توضیحات مشکل</label>
                                        <textarea className="form-control" rows={3} value={addForm.problemDescription}
                                                  onChange={(e) => setAddForm({ ...addForm, problemDescription: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={savingAdd}>انصراف</button>
                                <button className="btn btn-primary" onClick={handleAddSave} disabled={savingAdd}>
                                    {savingAdd ? 'در حال ثبت...' : 'ثبت سرویس'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showAddModal && <div className="modal-backdrop fade show" onClick={() => setShowAddModal(false)}></div>}

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

            {/* System Info Modal – both roles */}
            <div className={`modal fade ${showInfoModal ? 'show' : ''}`} style={{ display: showInfoModal ? 'block' : 'none' }} tabIndex={-1}>
                <div className="modal-dialog">
                    <div className="modal-content" dir="rtl">
                        <div className="modal-header">
                            <h5 className="modal-title">مشخصات سیستم</h5>
                            <button type="button" className="btn-close" onClick={() => setShowInfoModal(false)}></button>
                        </div>
                        <div className="modal-body">
                            {infoTicket && (
                                <dl className="row">
                                    <dt className="col-sm-4">نوع دستگاه</dt><dd className="col-sm-8">{infoTicket.deviceType || '---'}</dd>
                                    <dt className="col-sm-4">برند</dt><dd className="col-sm-8">{infoTicket.brand || '---'}</dd>
                                    <dt className="col-sm-4">مدل</dt><dd className="col-sm-8">{infoTicket.model || '---'}</dd>
                                    <dt className="col-sm-4">سریال</dt><dd className="col-sm-8">{infoTicket.serialNumber || '---'}</dd>
                                    <dt className="col-sm-4">توضیحات</dt><dd className="col-sm-8">{infoTicket.problemDescription || '---'}</dd>
                                </dl>
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