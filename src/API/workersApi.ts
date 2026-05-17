import api from './axiosInstance';
import type {WorkerListItem} from "../Models/WorkerListItem.ts";
import type {UpdateWorkerPayload} from "../Models/UpdateWorkerPayload.ts";
import type {RegisterWorkerPayload} from "../Models/RegisterWorkerPayload.ts";







export const fetchWorkers = async (): Promise<WorkerListItem[]> => {
    const response = await api.get<WorkerListItem[]>('/workers');
    return response.data;
};

export const updateWorker = async (id: number, data: UpdateWorkerPayload) => {
    const response = await api.put(`/workers/${id}`, data);
    return response.data;
};

export const registerWorker = async (data: RegisterWorkerPayload) => {
    // Backend will generate a random password if none sent
    const response = await api.post('/auth/register', { ...data, password: '' });
    return response.data;
};

export const deleteWorker = async (id: number) => {
    const response = await api.delete(`/workers/${id}`);
    return response.data;
};