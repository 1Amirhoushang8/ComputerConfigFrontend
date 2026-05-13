import type {ConfirmModalProps} from "../../Models/ConfirmModal.ts"
import './ConfirmModal.scss';



const ConfirmModal = ({
                          show,
                          title,
                          message,
                          confirmLabel = 'تأیید',
                          cancelLabel = 'انصراف',
                          onConfirm,
                          onCancel,
                          loading = false,
                      }: ConfirmModalProps) => {
    if (!show) return null;

    return (
        <>
            <div className="modal confirm-modal fade show" style={{ display: 'block' }} tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-sm">
                    <div className="modal-content border-0 shadow-lg" dir="rtl">
                        <div className="modal-header border-0 bg-dark text-white">
                            <h6 className="modal-title">{title}</h6>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onCancel}
                                disabled={loading}
                            ></button>
                        </div>
                        <div className="modal-body bg-light text-dark">{message}</div>
                        <div className="modal-footer border-0 bg-light">
                            <button
                                className="btn btn-secondary"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                {cancelLabel}
                            </button>
                            <button
                                className="btn btn-nude"
                                onClick={onConfirm}
                                disabled={loading}
                            >
                                {loading ? 'لطفاً صبر کنید...' : confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />
        </>
    );
};

export default ConfirmModal;