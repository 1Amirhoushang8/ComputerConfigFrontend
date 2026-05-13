import { useEffect, useState, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
    fetchCustomers,
    updateCustomer,
    deleteCustomer,
} from '../../API/customersApi';
import type { UpdateCustomerPayload } from '../../Models/UpdateCustomerPayload';
import type { CustomerListItem } from '../../Models/CustomerListItem';
import type { Column, Action } from '../../Models/DataTable';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../Components/DataTable/DataTable';
import ConfirmModal from '../../Components/ConfirmModal/ConfirmModal';

// const phoneRegex = /^09\d{9}$/;
// const personalIdRegex = /^\d{10}$/;

const CustomersService = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [customers, setCustomers] = useState<CustomerListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
            <h2 className="mb-4">مدیریت مشتری‌ها</h2>

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