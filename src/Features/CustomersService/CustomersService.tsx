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
import type { RegisterCustomerPayload } from '../../Models/RegisterCustomerPayload';
import type { Column, Action } from '../../Models/DataTable';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../Components/DataTable/DataTable';
import ConfirmModal from '../../Components/ConfirmModal/ConfirmModal';

const phoneRegex = /^09\d{9}$/;
const personalIdRegex = /^\d{10}$/;

const CustomersService = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [customers, setCustomers] = useState<CustomerListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ---------- Search state ----------
    const [searchTerm, setSearchTerm] = useState('');

    // ---------- Sorting state ----------
    const [sortColumn, setSortColumn] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // ---------- Add customer modal ----------
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState<RegisterCustomerPayload>({
        fullName: '',
        phoneNumber: '',
        email: '',
        personalId: '',
        role: 'customer',
    });
    const [savingAdd, setSavingAdd] = useState(false);
    const [addError, setAddError] = useState('');
    const [addFieldErrors, setAddFieldErrors] = useState<{
        fullName?: string;
        phoneNumber?: string;
        email?: string;
        personalId?: string;
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
    const isAdmin = user?.role === 'admin';

    // ---------- Callbacks ----------
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
        } = {};

        if (!addForm.fullName.trim()) errors.fullName = 'نام کامل الزامی است.';
        if (!phoneRegex.test(addForm.phoneNumber))
            errors.phoneNumber = 'شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود.';
        // Only validate email format if it's non‑empty after trimming
        const emailTrimmed = addForm.email.trim();
        if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed))
            errors.email = 'ایمیل نامعتبر است.';
        if (!personalIdRegex.test(addForm.personalId))
            errors.personalId = 'کد ملی باید دقیقاً ۱۰ رقم باشد.';

        setAddFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddSave = async () => {
        if (!validateAddForm()) return;
        setSavingAdd(true);
        setAddError('');
        try {
            // Send "ندارد" if email is empty
            const payload = {
                ...addForm,
                email: addForm.email.trim() || 'ندارد',
            };
            await registerCustomer(payload);
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
            // Send "ندارد" if email is empty
            const payload = {
                ...editForm,
                email: editForm.email.trim() || 'ندارد',
            };
            await updateCustomer(selectedCustomer.id, payload);
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

    // ---------- Sort handler ----------
    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    // ---------- Filter & sort customers ----------
    const filteredCustomers = customers.filter((c) =>
        c.fullName.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
        if (!sortColumn) return 0;
        const valA = a[sortColumn as keyof CustomerListItem];
        const valB = b[sortColumn as keyof CustomerListItem];

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
            render: (value, _row) => (
                <button
                    className="btn p-0 fw-bold"
                    style={{ color: 'black', textDecoration: 'none' }}
                    onClick={() => navigate('/app/PCServices')}
                    title="مشاهده سرویس‌های مشتری"
                >
                    {value as number}
                </button>
            ),
        },
        {
            key: 'totalTickets',
            header: 'درخواست‌ها',
            render: (_value, row) => (
                <button
                    className="btn btn-sm btn-outline-info"
                    onClick={() => navigate(`/app/customer-requests/${row.id}`)}
                >
                    مشاهده
                </button>
            ),
        },
    ];

    // Actions – only edit/delete for admin
    const actions: Action<CustomerListItem>[] = isAdmin
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
        <div className="container-fluid">
            <h2 className="mb-3">مدیریت مشتری‌ها</h2>

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
                {isAdmin && (
                    <button className="btn btn-nude ms-auto" onClick={openAddModal}>
                        + افزودن مشتری
                    </button>
                )}
            </div>

            <DataTable
                data={sortedCustomers}
                columns={columns}
                keyExtractor={(c) => c.id}
                actions={actions}
                userRole={user?.role}
                loading={loading}
                error={error}
                emptyMessage={
                    searchTerm
                        ? 'هیچ مشتری‌ای با این نام یافت نشد.'
                        : 'هیچ مشتری‌ای ثبت نشده است.'
                }
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
            />

            {/* Add Customer Modal – no password field */}
            <div className={`modal fade ${showAddModal ? 'show' : ''}`} style={{ display: showAddModal ? 'block' : 'none' }} tabIndex={-1}>
                <div className="modal-dialog">
                    <div className="modal-content" dir="rtl">
                        <div className="modal-header">
                            <h5 className="modal-title">افزودن مشتری جدید</h5>
                            <button type="button" className="btn-close" onClick={closeAddModal}></button>
                        </div>
                        <div className="modal-body">
                            {addError && <div className="alert alert-danger py-2">{addError}</div>}

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

            {/* Edit Modal */}
            <div className={`modal fade ${showEditModal ? 'show' : ''}`} style={{ display: showEditModal ? 'block' : 'none' }} tabIndex={-1}>
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

            {/* Delete Confirmation Modal */}
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