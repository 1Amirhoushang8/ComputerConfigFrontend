import { useEffect, useState } from 'react';
import {Navigate, useNavigate} from 'react-router-dom';
import { isAxiosError } from 'axios';
import { fetchCustomers, type CustomerListItem } from '../../API/customersApi';
import { useAuth } from '../../hooks/useAuth';
import DataTable, { type Column, type Action } from '../../Components/DataTable/DataTable';

const CustomersService = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [customers, setCustomers] = useState<CustomerListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    const canView = user?.role === 'admin' || user?.role === 'worker';

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

        return <Navigate to="/" replace />;
    }

    const columns: Column<CustomerListItem>[] = [
        { key: 'fullName', header: 'نام کامل' },
        { key: 'phoneNumber', header: 'شماره موبایل', className: 'text-start', render: (value) => <span dir="ltr">{value as string}</span> },
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
            label: 'مشاهده',
            onClick: (row) => navigate(`/app/customer-requests/${row.id}`),
            className: 'btn-outline-primary',
            // No role restriction – visible to all who can see the page
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
        </div>
    );
};

export default CustomersService;