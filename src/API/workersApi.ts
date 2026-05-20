import api from './axiosInstance';
import type { PaginatedResponse } from '../Models/DataTable';
import type { WorkerListItem } from '../Models/WorkerListItem';
import type { UpdateWorkerPayload } from '../Models/UpdateWorkerPayload';
import type { RegisterWorkerPayload } from '../Models/RegisterWorkerPayload';

export const fetchWorkers = async (
    page = 1,
    pageSize = 20,
    search?: string,
    sortColumn?: string,
    sortDirection?: string
): Promise<PaginatedResponse<WorkerListItem>> => {
    const params: any = { page, pageSize };
    if (search) params.search = search;
    if (sortColumn) params.sortColumn = sortColumn;
    if (sortDirection) params.sortDirection = sortDirection;
    const response = await api.get<PaginatedResponse<WorkerListItem>>('/workers', { params });
    return response.data;
};

export const updateWorker = async (id: number, data: UpdateWorkerPayload) => {
    const response = await api.put(`/workers/${id}`, data);
    return response.data;
};

export const registerWorker = async (data: RegisterWorkerPayload) => {
    const response = await api.post('/auth/register', { ...data, password: '' });
    return response.data;
};

export const deleteWorker = async (id: number) => {
    const response = await api.delete(`/workers/${id}`);
    return response.data;
};