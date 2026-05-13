import type {ReactNode} from "react";

export interface ConfirmModalProps {
    show: boolean;
    title: string;
    message: ReactNode | string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}