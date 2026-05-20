import api from './axiosInstance';
import type { PaginatedResponse } from '../Models/DataTable';
import type { CustomerListItem } from '../Models/CustomerListItem';
import type { UpdateCustomerPayload } from '../Models/UpdateCustomerPayload';
import type { RegisterCustomerPayload } from '../Models/RegisterCustomerPayload';

export const fetchCustomers = async (
    page = 1,
    pageSize = 20,
    search?: string,
    sortColumn?: string,
    sortDirection?: string
): Promise<PaginatedResponse<CustomerListItem>> => {
    const params: any = { page, pageSize };
    if (search) params.search = search;
    if (sortColumn) params.sortColumn = sortColumn;
    if (sortDirection) params.sortDirection = sortDirection;
    const response = await api.get<PaginatedResponse<CustomerListItem>>('/customers', { params });
    return response.data;
};

export const updateCustomer = async (id: number, data: UpdateCustomerPayload) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
};

export const deleteCustomer = async (id: number) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
};

export const registerCustomer = async (data: RegisterCustomerPayload) => {
    const response = await api.post('/auth/register', { ...data, password: '' });
    return response.data;
};