import api from './axiosInstance';

export interface WorkerListItem {
    id: number;
    fullName: string;
    phoneNumber: string;
    personalId: string;
    email: string;
    specialty: string;
    activeTicketCount: number;
    currentStatus: string;
}

export interface UpdateWorkerPayload {
    fullName: string;
    phoneNumber: string;
    email: string;
    personalId: string;
    specialty: string;
}

export interface RegisterWorkerPayload {
    fullName: string;
    phoneNumber: string;
    email: string;
    personalId: string;

    password: string;
    role: string;
    specialty: string;
}

export const fetchWorkers = async (): Promise<WorkerListItem[]> => {
    const response = await api.get<WorkerListItem[]>('/workers');
    return response.data;
};

export const updateWorker = async (id: number, data: UpdateWorkerPayload) => {
    const response = await api.put(`/workers/${id}`, data);
    return response.data;
};

export const registerWorker = async (data: RegisterWorkerPayload) => {
    const response = await api.post('/auth/register', data);
    return response.data;
};