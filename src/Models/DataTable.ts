import type {ReactNode} from "react";

export interface Column<T> {
    key: keyof T;
    header: string;
    render?: (value: T[keyof T], row: T) => ReactNode;
    className?: string;
    sortable?: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

export interface Action<T> {
    label: string;
    onClick: (row: T) => void;
    requiredRoles?: string[];
    className?: string;
    disabled?: boolean;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (row: T) => string | number;
    actions?: Action<T>[];
    userRole?: string | null;
    loading?: boolean;
    error?: string;
    emptyMessage?: string;
    // Sorting props
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (columnKey: string) => void;
}