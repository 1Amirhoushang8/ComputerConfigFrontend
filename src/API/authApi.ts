import api from './axiosInstance';

export interface LoginPayload {
    phoneNumber: string;
    password: string;
}

export interface LoginResponse {
    fullName: string;
    role: string;
}

export interface MeResponse {
    id: string;
    fullName: string;
    role: string;
    phone: string;
}

export const loginUser = async (data: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
};

export const fetchMe = async (): Promise<MeResponse> => {
    const response = await api.get<MeResponse>('/auth/me');
    return response.data;
};

export const logoutUser = async () => {
    await api.post('/auth/logout');
};