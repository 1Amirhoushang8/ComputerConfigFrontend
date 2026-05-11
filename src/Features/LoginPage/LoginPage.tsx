import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { loginUser } from '../../API/authApi';
import { useAuth } from '../../hooks/useAuth';

const LoginPage = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await loginUser({ phoneNumber: phone, password });

            login(data.fullName, data.role);

            if (data.role === 'customer') {
                navigate('/customer-dashboard', { replace: true });
            } else {
                navigate('/app/PCServices', { replace: true });
            }
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                if (err.response?.status === 503) {
                    setError('تعداد تلاش‌های شما بیش از حد مجاز است. لطفاً یک دقیقه صبر کنید.');
                } else {
                    setError(
                        typeof err.response?.data === 'string'
                            ? err.response.data
                            : 'خطا در ورود'
                    );
                }
            } else {
                setError('خطا در برقراری ارتباط با سرور');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: '100vh', background: '#f4f6f9' }}
        >
            <div className="card shadow-lg p-4" style={{ width: '400px', borderRadius: '16px' }}>
                <h3 className="text-center mb-4">ورود به سیستم</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">شماره موبایل</label>
                        <input
                            type="text"
                            className="form-control"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            placeholder="09xxxxxxxxx"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">رمز عبور</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <div className="alert alert-danger py-2">{error}</div>}
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                        {loading ? 'در حال ورود...' : 'ورود'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;