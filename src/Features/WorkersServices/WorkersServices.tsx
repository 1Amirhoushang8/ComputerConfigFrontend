import { useEffect, useState } from 'react';
import { fetchWorkers, type WorkerListItem } from '../../API/workersApi';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const WorkersServices = () => {
    const { user } = useAuth();
    const [workers, setWorkers] = useState<WorkerListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Only admin can view this page
    if (!user || user.role !== 'admin') {
        return <Navigate to="/app/PCServices" replace />;
    }

    useEffect(() => {
        const loadWorkers = async () => {
            try {
                const data = await fetchWorkers();
                setWorkers(data);
            } catch (err) {
                setError('خطا در بارگذاری اطلاعات تعمیرکاران');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadWorkers();
    }, []);

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
        return (
            <div className="alert alert-danger">{error}</div>
        );
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
                            <th scope="col">#</th>
                            <th scope="col">نام کامل</th>
                            <th scope="col">شماره موبایل</th>
                            <th scope="col">کد ملی</th>
                            <th scope="col">تعداد سرویس‌های فعال</th>
                            <th scope="col">وضعیت</th>
                        </tr>
                        </thead>
                        <tbody>
                        {workers.map((worker, index) => (
                            <tr key={worker.id}>
                                <td>{index + 1}</td>
                                <td>{worker.fullName}</td>
                                <td dir="ltr" className="text-start">{worker.phoneNumber}</td>
                                <td>{worker.personalId}</td>
                                <td>{worker.activeTicketCount}</td>
                                <td>
                    <span
                        className={`badge rounded-pill ${
                            worker.currentStatus === 'فعال' ? 'bg-success' : 'bg-secondary'
                        }`}
                    >
                      {worker.currentStatus}
                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default WorkersServices;