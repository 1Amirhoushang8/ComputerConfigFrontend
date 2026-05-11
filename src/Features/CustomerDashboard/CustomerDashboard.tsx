import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    return (
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f4f6f9' }}>
            <div className="text-center mb-4">
                <h2>داشبورد مشتری</h2>
                <p>این بخش به زودی تکمیل می‌شود.</p>
            </div>
            <button className="btn btn-danger" onClick={handleLogout}>
                خروج از حساب
            </button>
        </div>
    );
};

export default CustomerDashboard;