import { type ReactNode } from 'react';
import './DataTable.scss';

export interface Column<T> {
    key: keyof T;
    header: string;

    render?: (value: T[keyof T], row: T) => ReactNode;
    className?: string;
}

export interface Action<T> {
    label: string;
    onClick: (row: T) => void;

    requiredRoles?: string[];
    className?: string;
    disabled?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];

    keyExtractor: (row: T) => string | number;
    actions?: Action<T>[];
    userRole?: string | null;
    loading?: boolean;
    error?: string;
    emptyMessage?: string;
}

const DataTable = <T,>({
                           data,
                           columns,
                           keyExtractor,
                           actions = [],
                           userRole,
                           loading = false,
                           error,
                           emptyMessage = 'داده‌ای یافت نشد',
                       }: DataTableProps<T>) => {

    // Filter actions based on user role
    const visibleActions = actions.filter(
        (action) => !action.requiredRoles || (userRole && action.requiredRoles.includes(userRole))
    );

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '30vh' }}>
                <div className="spinner-border text-secondary" role="status">
                    <span className="visually-hidden">در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    if (data.length === 0) {
        return <div className="alert alert-info">{emptyMessage}</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-striped table-hover align-middle data-table">
                <thead className="table-dark">
                <tr>
                    <th scope="col">#</th>
                    {columns.map((col) => (
                        <th key={String(col.key)} scope="col" className={col.className}>
                            {col.header}
                        </th>
                    ))}
                    {visibleActions.length > 0 && <th scope="col">عملیات</th>}
                </tr>
                </thead>
                <tbody>
                {data.map((row, idx) => (
                    <tr key={keyExtractor(row)}>
                        <td>{idx + 1}</td>
                        {columns.map((col) => (
                            <td key={String(col.key)} className={col.className}>
                                {col.render
                                    ? col.render(row[col.key], row)
                                    : (row[col.key] as ReactNode)}
                            </td>
                        ))}
                        {visibleActions.length > 0 && (
                            <td>
                                <div className="d-flex gap-1 flex-wrap">
                                    {visibleActions.map((action, actionIdx) => (
                                        <button
                                            key={actionIdx}
                                            className={`btn btn-sm ${action.className || 'btn-outline-primary'}`}
                                            onClick={() => action.onClick(row)}
                                            disabled={action.disabled}
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;