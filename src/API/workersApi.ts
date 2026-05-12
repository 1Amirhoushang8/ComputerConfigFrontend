import api from './axiosInstance';

export interface WorkerListItem {
    id: number;
    fullName: string;
    phoneNumber: string;
    personalId: string;
    activeTicketCount: number;
    currentStatus: string;
}

export interface UpdateWorkerPayload {
    fullName: string;
    phoneNumber: string;
    email: string;
    personalId: string;

}

export const fetchWorkers = async (): Promise<WorkerListItem[]> => {
    const response = await api.get<WorkerListItem[]>('/workers');
    return response.data;
};

export const updateWorker = async (id: number, data: UpdateWorkerPayload) => {
    const response = await api.put(`/workers/${id}`, data);
    return response.data;
};