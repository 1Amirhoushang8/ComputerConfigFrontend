export interface RegisterWorkerPayload {
    fullName: string;
    phoneNumber: string;
    email: string;
    personalId: string;
    role: string;          // "worker"
    specialty: string;

}