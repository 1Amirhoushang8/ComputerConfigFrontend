import { useEffect, useState, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
    fetchCustomers,
    updateCustomer,
    deleteCustomer,
    registerCustomer,
} from '../../API/customersApi';
import type { UpdateCustomerPayload } from '../../Models/UpdateCustomerPayload';
import type { CustomerListItem } from '../../Models/CustomerListItem';
import type { RegisterCustomerPayload } from '../../Models/RegisterCustomerPayload';  // adjust path if needed
import type { Column, Action } from '../../Models/DataTable';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../Components/DataTable/DataTable';
import ConfirmModal from '../../Components/ConfirmModal/ConfirmModal';

const phoneRegex = /^09\d{9}$/;
const passwordRegex = /^[a-zA-Z0-9]+$/;
const personalIdRegex = /^\d{10}$/;

const CustomersService = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [customers, setCustomers] = useState<CustomerListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ---------- Add customer modal ----------
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState<RegisterCustomerPayload>({
        fullName: '',
        phoneNumber: '',
        email: '',
        personalId: '',
        password: '',
        role: 'customer',
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

    // ---------- Edit modal ----------
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | null>(null);
    const [editForm, setEditForm] = useState<UpdateCustomerPayload>({
        fullName: '',
        phoneNumber: '',
        email: '',
        personalId: '',
    });
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState('');

    // ---------- Delete confirmation modal ----------
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<CustomerListItem | null>(null);

    const canView = user?.role === 'admin' || user?.role === 'worker';
    // const isAdmin = user?.role === 'admin';

    // ---------- Callbacks (before any early return) ----------
    const openEditModal = useCallback((customer: CustomerListItem) => {
        setSelectedCustomer(customer);
        setEditForm({
            fullName: customer.fullName,
            phoneNumber: customer.phoneNumber,
            email: customer.email || '',
            personalId: customer.personalId,
        });
        setEditError('');
        setShowEditModal(true);
    }, []);

    const requestDelete = useCallback((customer: CustomerListItem) => {
        setCustomerToDelete(customer);
        setShowDeleteConfirm(true);
    }, []);

    const handleDeleteConfirmed = useCallback(async () => {
        if (!customerToDelete) return;
        try {
            await deleteCustomer(customerToDelete.id);
            setShowDeleteConfirm(false);
            setCustomerToDelete(null);
            const data = await fetchCustomers();
            setCustomers(data);
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                alert(err.response.data?.message || 'خطا در حذف مشتری');
            } else {
                alert('خطا در حذف مشتری');
            }
        }
    }, [customerToDelete]);

    const handleDeleteCancelled = () => {
        setShowDeleteConfirm(false);
        setCustomerToDelete(null);
    };

    useEffect(() => {
        if (!canView) return;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const data = await fetchCustomers();
                setCustomers(data);
            } catch (err: unknown) {
                if (isAxiosError(err) && err.response) {
                    setError(err.response.data?.message || 'خطا در بارگذاری اطلاعات مشتریان');
                } else {
                    setError('خطا در بارگذاری اطلاعات مشتریان');
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [canView]);

    if (!canView) {
        return <Navigate to="/app/PCServices" replace />;
    }

    // ---------- Add customer handlers ----------
    const openAddModal = () => {
        setAddForm({
            fullName: '',
            phoneNumber: '',
            email: '',
            personalId: '',
            password: '',
            role: 'customer',
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
        // email is optional
        if (addForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email))
            errors.email = 'ایمیل نامعتبر است.';
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
            await registerCustomer(addForm);
            closeAddModal();
            const data = await fetchCustomers();
            setCustomers(data);
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

    // ---------- Edit handlers ----------
    const closeEditModal = () => {
        setShowEditModal(false);
        setSelectedCustomer(null);
        setEditError('');
    };

    const handleEditSave = async () => {
        if (!selectedCustomer) return;
        setSavingEdit(true);
        setEditError('');
        try {
            await updateCustomer(selectedCustomer.id, editForm);
            closeEditModal();
            const data = await fetchCustomers();
            setCustomers(data);
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

    // ---------- DataTable columns ----------
    const columns: Column<CustomerListItem>[] = [
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
        { key: 'personalId', header: 'کد ملی' },
        {
            key: 'totalTickets',
            header: 'سرویس‌ها',
            render: (value, row) => (
                <button
                    className="btn btn-link p-0 fw-bold"
                    onClick={() => navigate(`/app/customer-services/${row.id}`)}
                    title="مشاهده سرویس‌های مشتری"
                >
                    {value as number}
                </button>
            ),
        },
    ];

    const actions: Action<CustomerListItem>[] = [
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
        {
            label: 'مشاهده',
            onClick: (row) => navigate(`/app/customer-requests/${row.id}`),
            className: 'btn-outline-info',
        },
    ];

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>مدیریت مشتری‌ها</h2>
                <button className="btn btn-nude" onClick={openAddModal}>
                    + افزودن مشتری
                </button>
            </div>

            <DataTable
                data={customers}
                columns={columns}
                keyExtractor={(c) => c.id}
                actions={actions}
                userRole={user?.role}
                loading={loading}
                error={error}
                emptyMessage="هیچ مشتری‌ای ثبت نشده است."
            />

            {/* ===== ADD CUSTOMER MODAL ===== */}
            <div
                className={`modal fade ${showAddModal ? 'show' : ''}`}
                style={{ display: showAddModal ? 'block' : 'none' }}
                tabIndex={-1}
            >
                <div className="modal-dialog">
                    <div className="modal-content" dir="rtl">
                        <div className="modal-header">
                            <h5 className="modal-title">افزودن مشتری جدید</h5>
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
                                        if (addFieldErrors.fullName) setAddFieldErrors((prev) => ({ ...prev, fullName: undefined }));
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
                                        if (addFieldErrors.phoneNumber) setAddFieldErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                                    }}
                                    dir="ltr"
                                    placeholder="09xxxxxxxxx"
                                    required
                                />
                                {addFieldErrors.phoneNumber && <div className="invalid-feedback">{addFieldErrors.phoneNumber}</div>}
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
                                        if (addFieldErrors.email) setAddFieldErrors((prev) => ({ ...prev, email: undefined }));
                                    }}
                                    dir="ltr"
                                    placeholder="اختیاری"
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
                                        if (addFieldErrors.personalId) setAddFieldErrors((prev) => ({ ...prev, personalId: undefined }));
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
                                        if (addFieldErrors.password) setAddFieldErrors((prev) => ({ ...prev, password: undefined }));
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
                                {savingAdd ? 'در حال ثبت...' : 'ثبت مشتری'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showAddModal && <div className="modal-backdrop fade show" onClick={closeAddModal}></div>}

            {/* ===== EDIT MODAL ===== */}
            <div
                className={`modal fade ${showEditModal ? 'show' : ''}`}
                style={{ display: showEditModal ? 'block' : 'none' }}
                tabIndex={-1}
            >
                <div className="modal-dialog">
                    <div className="modal-content" dir="rtl">
                        <div className="modal-header">
                            <h5 className="modal-title">ویرایش اطلاعات مشتری</h5>
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

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            <ConfirmModal
                show={showDeleteConfirm}
                title="حذف مشتری"
                message={
                    <span>
            آیا از حذف مشتری
            <strong> {customerToDelete?.fullName} </strong>
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

export default CustomersService;