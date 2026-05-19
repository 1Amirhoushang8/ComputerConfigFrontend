import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
    fetchWorkers,
    updateWorker,
    registerWorker,
    deleteWorker,
} from '../../API/workersApi';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../Components/DataTable/DataTable';
import type { Column, Action } from '../../Models/DataTable';
import ConfirmModal from '../../Components/ConfirmModal/ConfirmModal';
import "./WorkersServices.scss";
import type {WorkerListItem} from "../../Models/WorkerListItem.ts";
import type {UpdateWorkerPayload} from "../../Models/UpdateWorkerPayload.ts";
import type {RegisterWorkerPayload} from "../../Models/RegisterWorkerPayload.ts";

const phoneRegex = /^09\d{9}$/;
const personalIdRegex = /^\d{10}$/;

const WorkersServices = () => {
    const { user } = useAuth();

    const [workers, setWorkers] = useState<WorkerListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ---------- Search state ----------
    const [searchTerm, setSearchTerm] = useState('');

    // ---------- Sorting state ----------
    const [sortColumn, setSortColumn] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // ---------- Edit modal ----------
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<WorkerListItem | null>(null);
    const [editForm, setEditForm] = useState<UpdateWorkerPayload>({
        fullName: '',
        phoneNumber: '',
        email: '',
        personalId: '',
        specialty: '',
    });
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState('');

    // ---------- Add worker modal ----------
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState<RegisterWorkerPayload>({
        fullName: '',
        phoneNumber: '',
        email: '',
        personalId: '',
        role: 'worker',
        specialty: '',
    });
    const [savingAdd, setSavingAdd] = useState(false);
    const [addError, setAddError] = useState('');
    const [addFieldErrors, setAddFieldErrors] = useState<{
        fullName?: string;
        phoneNumber?: string;
        email?: string;
        personalId?: string;
        specialty?: string;
    }>({});

    // ---------- Delete confirmation modal ----------
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [workerToDelete, setWorkerToDelete] = useState<WorkerListItem | null>(null);

    const isAdmin = user?.role === 'admin';

    // ---------- Callbacks (before early return) ----------
    const openEditModal = useCallback((worker: WorkerListItem) => {
        setSelectedWorker(worker);
        setEditForm({
            fullName: worker.fullName,
            phoneNumber: worker.phoneNumber,
            email: worker.email || '',
            personalId: worker.personalId,
            specialty: worker.specialty,
        });
        setEditError('');
        setShowEditModal(true);
    }, []);

    const requestDelete = useCallback((worker: WorkerListItem) => {
        setWorkerToDelete(worker);
        setShowDeleteConfirm(true);
    }, []);

    const handleDeleteConfirmed = useCallback(async () => {
        if (!workerToDelete) return;
        try {
            await deleteWorker(workerToDelete.id);
            setShowDeleteConfirm(false);
            setWorkerToDelete(null);
            const data = await fetchWorkers();
            setWorkers(data);
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                alert(err.response.data?.message || 'خطا در حذف تعمیرکار');
            } else {
                alert('خطا در حذف تعمیرکار');
            }
        }
    }, [workerToDelete]);

    const handleDeleteCancelled = useCallback(() => {
        setShowDeleteConfirm(false);
        setWorkerToDelete(null);
    }, []);

    useEffect(() => {
        if (!isAdmin) return;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const data = await fetchWorkers();
                setWorkers(data);
            } catch (err: unknown) {
                if (isAxiosError(err) && err.response) {
                    setError(err.response.data?.message || 'خطا در بارگذاری اطلاعات تعمیرکاران');
                } else {
                    setError('خطا در بارگذاری اطلاعات تعمیرکاران');
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [isAdmin]);

    if (!isAdmin) {
        return <Navigate to="/app/PCServices" replace />;
    }

    // ---------- Edit handlers ----------
    const closeEditModal = () => {
        setShowEditModal(false);
        setSelectedWorker(null);
        setEditError('');
    };

    const handleEditSave = async () => {
        if (!selectedWorker) return;
        setSavingEdit(true);
        setEditError('');
        try {
            // Send empty string, NOT "ندارد"
            const payload = {
                ...editForm,
                email: editForm.email.trim(),
            };
            await updateWorker(selectedWorker.id, payload);
            closeEditModal();
            const data = await fetchWorkers();
            setWorkers(data);
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                const msg = err.response.data?.message || err.response.data;
                setEditError(typeof msg === 'string' ? msg : 'خطا در بروزرسانی');
            } else {
                setEditError('خطا در بروزرسانی');
            }
        } finally {
            setSavingEdit(false);
        }
    };

    // ---------- Add handlers ----------
    const openAddModal = () => {
        setAddForm({
            fullName: '',
            phoneNumber: '',
            email: '',
            personalId: '',
            role: 'worker',
            specialty: '',
        });
        setAddFieldErrors({});
        setAddError('');
        setShowAddModal(true);
    };

    const closeAddModal = () => {
        setShowAddModal(false);
        setAddError('');
        setAddFieldErrors({});
    };

    const validateAddForm = (): boolean => {
        const errors: typeof addFieldErrors = {};

        if (!addForm.fullName.trim()) errors.fullName = 'نام کامل الزامی است.';
        if (!phoneRegex.test(addForm.phoneNumber))
            errors.phoneNumber = 'شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود.';
        const emailTrimmed = addForm.email.trim();
        if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed))
            errors.email = 'ایمیل نامعتبر است.';
        if (!personalIdRegex.test(addForm.personalId))
            errors.personalId = 'کد ملی باید دقیقاً ۱۰ رقم باشد.';
        if (!addForm.specialty.trim()) errors.specialty = 'تخصص الزامی است.';

        setAddFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddSave = async () => {
        if (!validateAddForm()) return;

        setSavingAdd(true);
        setAddError('');
        setAddFieldErrors({});

        try {
            // Send empty string, NOT "ندارد"
            const payload = {
                ...addForm,
                email: addForm.email.trim(),
            };
            await registerWorker(payload);
            closeAddModal();
            const data = await fetchWorkers();
            setWorkers(data);
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                const { status, data } = err.response;

                if (status === 400) {
                    if (data.errors && typeof data.errors === 'object') {
                        const fieldMap: Record<string, keyof typeof addFieldErrors> = {
                            FullName: 'fullName',
                            fullName: 'fullName',
                            PhoneNumber: 'phoneNumber',
                            phoneNumber: 'phoneNumber',
                            Email: 'email',
                            email: 'email',
                            PersonalId: 'personalId',
                            personalId: 'personalId',
                            Specialty: 'specialty',
                            specialty: 'specialty',
                        };

                        const backendErrors: typeof addFieldErrors = {};
                        for (const [key, messages] of Object.entries(data.errors)) {
                            const mappedKey = fieldMap[key] ?? key;
                            backendErrors[mappedKey as keyof typeof addFieldErrors] = Array.isArray(messages)
                                ? messages[0]
                                : String(messages);
                        }
                        setAddFieldErrors(backendErrors);
                    } else if (typeof data === 'string') {
                        setAddError(data);
                    } else if (data.message) {
                        setAddError(data.message);
                    } else {
                        setAddError('اطلاعات وارد شده معتبر نیست.');
                    }
                } else if (status === 401) {
                    setAddError('شما اجازه ثبت نام ندارید. لطفاً دوباره وارد شوید.');
                } else {
                    const msg = data?.message || data?.title || 'خطا در ثبت نام';
                    setAddError(typeof msg === 'string' ? msg : 'خطا در ثبت نام');
                }
            } else {
                setAddError('خطا در برقراری ارتباط با سرور.');
            }
        } finally {
            setSavingAdd(false);
        }
    };

    // ---------- Sort handler ----------
    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    // ---------- Filter & sort workers ----------
    const filteredWorkers = workers.filter((w) =>
        w.fullName.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

    const sortedWorkers = [...filteredWorkers].sort((a, b) => {
        if (!sortColumn) return 0;
        const valA = a[sortColumn as keyof WorkerListItem];
        const valB = b[sortColumn as keyof WorkerListItem];

        if (valA == null || valB == null) return 0;

        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortDirection === 'asc'
                ? valA.localeCompare(valB, 'fa')
                : valB.localeCompare(valA, 'fa');
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        return 0;
    });

    // ---------- DataTable columns ----------
    const columns: Column<WorkerListItem>[] = [
        { key: 'fullName', header: 'نام کامل' },
        {
            key: 'phoneNumber',
            header: 'شماره موبایل',
            className: 'text-start',
            render: (value) => <span dir="ltr">{value as string}</span>,
        },
        {
            key: 'email',
            header: 'ایمیل',
            className: 'text-start',
            render: (value) => (
                <span dir="ltr">
          {(value as string)?.trim() ? (value as string) : 'ندارد'}
        </span>
            ),
        },
        { key: 'specialty', header: 'تخصص' },
        { key: 'personalId', header: 'کد ملی' },
        {
            key: 'activeTicketCount',
            header: 'سرویس‌های فعال',
            render: (value) => <strong>{value as number}</strong>,
        },
        {
            key: 'currentStatus',
            header: 'وضعیت',
            render: (value) => (
                <span className={`badge rounded-pill ${value === 'فعال' ? 'bg-success' : 'bg-secondary'}`}>
          {value as string}
        </span>
            ),
        },
    ];

    const actions: Action<WorkerListItem>[] = [
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
            {/* ---------- Title ---------- */}
            <h2 className="mb-3">مدیریت تعمیرکاران</h2>

            {/* ---------- Search bar + Add button ---------- */}
            <div className="d-flex align-items-center gap-2 mb-4">
                <div className="input-group" style={{ maxWidth: '320px' }}>
          <span className="input-group-text bg-dark text-white border-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85z"/>
              <path d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"/>
            </svg>
          </span>
                    <input
                        type="text"
                        className="form-control border-0 shadow-sm"
                        placeholder="جستجو بر اساس نام..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        dir="rtl"
                        style={{ backgroundColor: '#f5ebe0' }}
                    />
                    {searchTerm && (
                        <button
                            className="btn btn-outline-light border-0"
                            onClick={() => setSearchTerm('')}
                            type="button"
                            style={{ backgroundColor: '#d4a373', color: '#fff' }}
                        >
                            ✕
                        </button>
                    )}
                </div>
                <button className="btn btn-nude ms-auto" onClick={openAddModal}>
                    + افزودن تعمیرکار
                </button>
            </div>

            <DataTable
                data={sortedWorkers}
                columns={columns}
                keyExtractor={(w) => w.id}
                actions={actions}
                userRole={user?.role}
                loading={loading}
                error={error}
                emptyMessage={
                    searchTerm
                        ? 'هیچ تعمیرکاری با این نام یافت نشد.'
                        : 'هیچ تعمیرکاری ثبت نشده است.'
                }
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
            />

            {/* ===== EDIT MODAL ===== */}
            <div
                className={`modal fade ${showEditModal ? 'show' : ''}`}
                style={{ display: showEditModal ? 'block' : 'none' }}
                tabIndex={-1}
            >
                <div className="modal-dialog">
                    <div className="modal-content" dir="rtl">
                        <div className="modal-header">
                            <h5 className="modal-title">ویرایش اطلاعات تعمیرکار</h5>
                            <button type="button" className="btn-close" onClick={closeEditModal}></button>
                        </div>
                        <div className="modal-body">
                            {editError && <div className="alert alert-danger py-2">{editError}</div>}
                            <div className="mb-3">
                                <label className="form-label">نام کامل</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">شماره موبایل</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editForm.phoneNumber}
                                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                    dir="ltr"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">ایمیل</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    dir="ltr"
                                    placeholder="اختیاری"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">کد ملی</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editForm.personalId}
                                    onChange={(e) => setEditForm({ ...editForm, personalId: e.target.value })}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">تخصص</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editForm.specialty}
                                    onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                                    placeholder="مانند: سخت‌افزار، نرم‌افزار"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeEditModal}
                                disabled={savingEdit}
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleEditSave}
                                disabled={savingEdit}
                            >
                                {savingEdit ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showEditModal && <div className="modal-backdrop fade show" onClick={closeEditModal}></div>}

            {/* ===== ADD WORKER MODAL (without password) ===== */}
            <div
                className={`modal fade ${showAddModal ? 'show' : ''}`}
                style={{ display: showAddModal ? 'block' : 'none' }}
                tabIndex={-1}
            >
                <div className="modal-dialog">
                    <div className="modal-content" dir="rtl">
                        <div className="modal-header">
                            <h5 className="modal-title">افزودن تعمیرکار جدید</h5>
                            <button type="button" className="btn-close" onClick={closeAddModal}></button>
                        </div>
                        <div className="modal-body">
                            {addError && <div className="alert alert-danger py-2">{addError}</div>}

                            {/* Full Name */}
                            <div className="mb-3">
                                <label className="form-label">نام کامل *</label>
                                <input
                                    type="text"
                                    className={`form-control ${addFieldErrors.fullName ? 'is-invalid' : ''}`}
                                    value={addForm.fullName}
                                    onChange={(e) => {
                                        setAddForm({ ...addForm, fullName: e.target.value });
                                        if (addFieldErrors.fullName)
                                            setAddFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                                    }}
                                    required
                                />
                                {addFieldErrors.fullName && (
                                    <div className="invalid-feedback">{addFieldErrors.fullName}</div>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="mb-3">
                                <label className="form-label">شماره موبایل *</label>
                                <input
                                    type="text"
                                    className={`form-control ${addFieldErrors.phoneNumber ? 'is-invalid' : ''}`}
                                    value={addForm.phoneNumber}
                                    onChange={(e) => {
                                        setAddForm({ ...addForm, phoneNumber: e.target.value });
                                        if (addFieldErrors.phoneNumber)
                                            setAddFieldErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                                    }}
                                    dir="ltr"
                                    placeholder="09xxxxxxxxx"
                                    required
                                />
                                {addFieldErrors.phoneNumber && (
                                    <div className="invalid-feedback">{addFieldErrors.phoneNumber}</div>
                                )}
                            </div>

                            {/* Email (optional) */}
                            <div className="mb-3">
                                <label className="form-label">ایمیل</label>
                                <input
                                    type="email"
                                    className={`form-control ${addFieldErrors.email ? 'is-invalid' : ''}`}
                                    value={addForm.email}
                                    onChange={(e) => {
                                        setAddForm({ ...addForm, email: e.target.value });
                                        if (addFieldErrors.email)
                                            setAddFieldErrors((prev) => ({ ...prev, email: undefined }));
                                    }}
                                    dir="ltr"
                                    placeholder="اختیاری"
                                />
                                {addFieldErrors.email && (
                                    <div className="invalid-feedback">{addFieldErrors.email}</div>
                                )}
                            </div>

                            {/* Personal ID */}
                            <div className="mb-3">
                                <label className="form-label">کد ملی *</label>
                                <input
                                    type="text"
                                    className={`form-control ${addFieldErrors.personalId ? 'is-invalid' : ''}`}
                                    value={addForm.personalId}
                                    onChange={(e) => {
                                        setAddForm({ ...addForm, personalId: e.target.value });
                                        if (addFieldErrors.personalId)
                                            setAddFieldErrors((prev) => ({ ...prev, personalId: undefined }));
                                    }}
                                    inputMode="numeric"
                                    maxLength={10}
                                    required
                                />
                                {addFieldErrors.personalId && (
                                    <div className="invalid-feedback">{addFieldErrors.personalId}</div>
                                )}
                                <small className="form-text text-muted">باید دقیقاً ۱۰ رقم باشد</small>
                            </div>

                            {/* Specialty */}
                            <div className="mb-3">
                                <label className="form-label">تخصص *</label>
                                <input
                                    type="text"
                                    className={`form-control ${addFieldErrors.specialty ? 'is-invalid' : ''}`}
                                    value={addForm.specialty}
                                    onChange={(e) => {
                                        setAddForm({ ...addForm, specialty: e.target.value });
                                        if (addFieldErrors.specialty)
                                            setAddFieldErrors((prev) => ({ ...prev, specialty: undefined }));
                                    }}
                                    placeholder="مانند: سخت‌افزار، نرم‌افزار"
                                    required
                                />
                                {addFieldErrors.specialty && (
                                    <div className="invalid-feedback">{addFieldErrors.specialty}</div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeAddModal}
                                disabled={savingAdd}
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleAddSave}
                                disabled={savingAdd}
                            >
                                {savingAdd ? 'در حال ثبت...' : 'ثبت تعمیرکار'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showAddModal && <div className="modal-backdrop fade show" onClick={closeAddModal}></div>}

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            <ConfirmModal
                show={showDeleteConfirm}
                title="حذف تعمیرکار"
                message={
                    <span>
            آیا از حذف تعمیرکار
            <strong> {workerToDelete?.fullName} </strong>
            مطمئن هستید؟ این عمل قابل بازگشت نیست.
          </span>
                }
                confirmLabel="حذف"
                cancelLabel="انصراف"
                onConfirm={handleDeleteConfirmed}
                onCancel={handleDeleteCancelled}
            />
        </div>
    );
};

export default WorkersServices;