const LoadingSpinner = () => {
    return (
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '100%', minHeight: 200 }}>
            <div className="spinner-border text-secondary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">در حال بارگذاری...</span>
            </div>
            <p className="mt-3 text-muted" style={{ fontSize: '0.9rem', letterSpacing: 0.5 }}>لطفاً صبر کنید...</p>
        </div>
    );
};

export default LoadingSpinner;