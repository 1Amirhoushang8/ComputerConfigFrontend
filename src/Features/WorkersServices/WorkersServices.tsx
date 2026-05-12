import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
    fetchWorkers,
    updateWorker,
    registerWorker,
    type WorkerListItem,
    type UpdateWorkerPayload,
    type RegisterWorkerPayload,
} from '../../API/workersApi';
import { useAuth } from '../../hooks/useAuth';
import DataTable, { type Column, type Action } from '../../Components/DataTable/DataTable';

const phoneRegex = /^09\d{9}$/;
const passwordRegex = /^[a-zA-Z0-9]+$/;
const personalIdRegex = /^\d{10}$/;

const WorkersServices = () => {
    const { user } = useAuth();

    const [workers, setWorkers] = useState<WorkerListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ---------- Edit modal ----------
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<WorkerListItem | null>(null);
    const [editForm, setEditForm] = useState<UpdateWorkerPayload>({
        fullName: '',
        phoneNumber: '',
        email: '',
        personalId: '',
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
        password: '',
        role: 'worker',
    });
    const [savingAdd, setSavingAdd] = useState(false);
    const [addError, setAddError] = useState('');
    const [addFieldErrors, setAddFieldErrors] = useState<{
        fullName?: string;
        phoneNumber?: string;
        email?: string;
        personalId?: string;
        password?: string;
    }>({});

    const isAdmin = user?.role === 'admin';

    // ---------- Callbacks (before any early return) ----------
    const openEditModal = useCallback((worker: WorkerListItem) => {
        setSelectedWorker(worker);
        setEditForm({
            fullName: worker.fullName,
            phoneNumber: worker.phoneNumber,
            email: '',               // email not in list, leave empty for editing
            personalId: worker.personalId,
        });
        setEditError('');
        setShowEditModal(true);
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

    // Redirect non‑admin after hooks
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
            await updateWorker(selectedWorker.id, editForm);
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

    // ---------- Add worker handlers ----------
    const openAddModal = () => {
        setAddForm({
            fullName: '',
            phoneNumber: '',
            email: '',
            personalId: '',
            password: '',
            role: 'worker',
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
        const errors: {
            fullName?: string;
            phoneNumber?: string;
            email?: string;
            personalId?: string;
            password?: string;
        } = {};

        if (!addForm.fullName.trim()) errors.fullName = 'نام کامل الزامی است.';
        if (!phoneRegex.test(addForm.phoneNumber))
            errors.phoneNumber = 'شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود.';
        if (!addForm.email.trim()) errors.email = 'ایمیل الزامی است.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) errors.email = 'ایمیل نامعتبر است.';
        if (!personalIdRegex.test(addForm.personalId))
            errors.personalId = 'کد ملی باید دقیقاً ۱۰ رقم باشد.';
        if (addForm.password.length < 6) errors.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
        else if (!passwordRegex.test(addForm.password))
            errors.password = 'رمز عبور فقط می‌تواند شامل حروف انگلیسی و اعداد باشد.';

        setAddFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddSave = async () => {
        if (!validateAddForm()) return;
        setSavingAdd(true);
        setAddError('');
        try {
            await registerWorker(addForm);
            closeAddModal();
            const data = await fetchWorkers();
            setWorkers(data);
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                const msg = err.response.data?.message || err.response.data;
                setAddError(typeof msg === 'string' ? msg : 'خطا در ثبت نام');
            } else {
                setAddError('خطا در ثبت نام');
            }
        } finally {
            setSavingAdd(false);
        }
    };

    // ---------- DataTable columns ----------
    const columns: Column<WorkerListItem>[] = [
        { key: 'fullName', header: 'نام کامل' },
        { key: 'phoneNumber', header: 'شماره موبایل', className: 'text-start', render: (value) => <span dir="ltr">{value as string}</span> },
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
    ];

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>مدیریت تعمیرکاران</h2>
                <button className="btn btn-success" onClick={openAddModal}>
                    + افزودن تعمیرکار
                </button>
            </div>

            <DataTable
                data={workers}
                columns={columns}
                keyExtractor={(w) => w.id}
                actions={actions}
                userRole={user?.role}
                loading={loading}
                error={error}
                emptyMessage="هیچ تعمیرکاری ثبت نشده است."
            />

            {/* ===== EDIT MODAL ===== */}
            <div className={`modal fade ${showEditModal ? 'show' : ''}`} style={{ display: showEditModal ? 'block' : 'none' }} tabIndex={-1}>
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
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeEditModal} disabled={savingEdit}>
                                انصراف
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleEditSave} disabled={savingEdit}>
                                {savingEdit ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showEditModal && <div className="modal-backdrop fade show" onClick={closeEditModal}></div>}

            {/* ===== ADD WORKER MODAL ===== */}
            <div className={`modal fade ${showAddModal ? 'show' : ''}`} style={{ display: showAddModal ? 'block' : 'none' }} tabIndex={-1}>
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
                                        if (addFieldErrors.fullName) setAddFieldErrors(prev => ({ ...prev, fullName: undefined }));
                                    }}
                                    required
                                />
                                {addFieldErrors.fullName && <div className="invalid-feedback">{addFieldErrors.fullName}</div>}
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
                                        if (addFieldErrors.phoneNumber) setAddFieldErrors(prev => ({ ...prev, phoneNumber: undefined }));
                                    }}
                                    dir="ltr"
                                    placeholder="09xxxxxxxxx"
                                    required
                                />
                                {addFieldErrors.phoneNumber && <div className="invalid-feedback">{addFieldErrors.phoneNumber}</div>}
                            </div>

                            {/* Email */}
                            <div className="mb-3">
                                <label className="form-label">ایمیل *</label>
                                <input
                                    type="email"
                                    className={`form-control ${addFieldErrors.email ? 'is-invalid' : ''}`}
                                    value={addForm.email}
                                    onChange={(e) => {
                                        setAddForm({ ...addForm, email: e.target.value });
                                        if (addFieldErrors.email) setAddFieldErrors(prev => ({ ...prev, email: undefined }));
                                    }}
                                    dir="ltr"
                                    required
                                />
                                {addFieldErrors.email && <div className="invalid-feedback">{addFieldErrors.email}</div>}
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
                                        if (addFieldErrors.personalId) setAddFieldErrors(prev => ({ ...prev, personalId: undefined }));
                                    }}
                                    inputMode="numeric"
                                    maxLength={10}
                                    required
                                />
                                {addFieldErrors.personalId && <div className="invalid-feedback">{addFieldErrors.personalId}</div>}
                                <small className="form-text text-muted">باید دقیقاً ۱۰ رقم باشد</small>
                            </div>

                            {/* Password */}
                            <div className="mb-3">
                                <label className="form-label">رمز عبور *</label>
                                <input
                                    type="password"
                                    className={`form-control ${addFieldErrors.password ? 'is-invalid' : ''}`}
                                    value={addForm.password}
                                    onChange={(e) => {
                                        setAddForm({ ...addForm, password: e.target.value });
                                        if (addFieldErrors.password) setAddFieldErrors(prev => ({ ...prev, password: undefined }));
                                    }}
                                    dir="ltr"
                                    required
                                />
                                {addFieldErrors.password && <div className="invalid-feedback">{addFieldErrors.password}</div>}
                                <small className="form-text text-muted">حداقل ۶ کاراکتر، فقط حروف انگلیسی و اعداد</small>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeAddModal} disabled={savingAdd}>
                                انصراف
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleAddSave} disabled={savingAdd}>
                                {savingAdd ? 'در حال ثبت...' : 'ثبت تعمیرکار'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showAddModal && <div className="modal-backdrop fade show" onClick={closeAddModal}></div>}
        </div>
    );
};

export default WorkersServices;