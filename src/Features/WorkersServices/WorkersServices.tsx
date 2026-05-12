import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { fetchWorkers, updateWorker, type WorkerListItem, type UpdateWorkerPayload } from '../../API/workersApi';
import { useAuth } from '../../hooks/useAuth';

const WorkersServices = () => {
    const { user } = useAuth();

    // All hooks at the top – no conditional returns before them
    const [workers, setWorkers] = useState<WorkerListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<WorkerListItem | null>(null);
    const [formData, setFormData] = useState<UpdateWorkerPayload>({
        fullName: '',
        phoneNumber: '',
        email: '',
        personalId: '',
    });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const isAdmin = user?.role === 'admin';

    // Load workers only if admin – called unconditionally
    useEffect(() => {
        if (!isAdmin) return;   // Early return – no setState needed, redirect will handle it

        const load = async () => {
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
        };

        load();
    }, [isAdmin]);

    // If not admin, redirect (but after hooks)
    if (!isAdmin) {
        return <Navigate to="/app/PCServices" replace />;
    }

    const handleEdit = (worker: WorkerListItem) => {
        setSelectedWorker(worker);
        setFormData({
            fullName: worker.fullName,
            phoneNumber: worker.phoneNumber,
            email: '',               // email not in list, backend expects it, leave empty
            personalId: worker.personalId,
        });
        setSaveError('');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedWorker(null);
        setSaveError('');
    };

    const handleSave = async () => {
        if (!selectedWorker) return;

        setSaving(true);
        setSaveError('');
        try {
            await updateWorker(selectedWorker.id, formData);
            handleCloseModal();
            // Refresh list
            const data = await fetchWorkers();
            setWorkers(data);
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                const msg = err.response.data?.message || err.response.data;
                setSaveError(typeof msg === 'string' ? msg : 'خطا در بروزرسانی');
            } else {
                setSaveError('خطا در بروزرسانی');
            }
        } finally {
            setSaving(false);
        }
    };

    // ---- RENDER ----
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-secondary" role="status">
                    <span className="visually-hidden">در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    return (
        <div className="container-fluid">
            <h2 className="mb-4">مدیریت تعمیرکاران</h2>

            {workers.length === 0 ? (
                <div className="alert alert-info">هیچ تعمیرکاری ثبت نشده است.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-dark">
                        <tr>
                            <th>#</th>
                            <th>نام کامل</th>
                            <th>شماره موبایل</th>
                            <th>کد ملی</th>
                            <th>سرویس‌های فعال</th>
                            <th>وضعیت</th>
                            <th>عملیات</th>
                        </tr>
                        </thead>
                        <tbody>
                        {workers.map((worker, idx) => (
                            <tr key={worker.id}>
                                <td>{idx + 1}</td>
                                <td>{worker.fullName}</td>
                                <td dir="ltr" className="text-start">{worker.phoneNumber}</td>
                                <td>{worker.personalId}</td>
                                <td>{worker.activeTicketCount}</td>
                                <td>
                    <span className={`badge rounded-pill ${worker.currentStatus === 'فعال' ? 'bg-success' : 'bg-secondary'}`}>
                      {worker.currentStatus}
                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(worker)}>
                                        ویرایش
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal – no isActive checkbox */}
            <div className={`modal fade ${showModal ? 'show' : ''}`} style={{ display: showModal ? 'block' : 'none' }} tabIndex={-1}>
                <div className="modal-dialog">
                    <div className="modal-content" dir="rtl">
                        <div className="modal-header">
                            <h5 className="modal-title">ویرایش اطلاعات تعمیرکار</h5>
                            <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                        </div>
                        <div className="modal-body">
                            {saveError && <div className="alert alert-danger py-2">{saveError}</div>}
                            <div className="mb-3">
                                <label className="form-label">نام کامل</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">شماره موبایل</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    dir="ltr"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">ایمیل</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    dir="ltr"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">کد ملی</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.personalId}
                                    onChange={(e) => setFormData({ ...formData, personalId: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={saving}>
                                انصراف
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showModal && <div className="modal-backdrop fade show" onClick={handleCloseModal}></div>}
        </div>
    );
};

export default WorkersServices;