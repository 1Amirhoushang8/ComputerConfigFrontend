import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { loginUser } from '../../API/authApi';
import { useAuth } from '../../hooks/useAuth';

const phoneRegex = /^09\d{9}$/;
const passwordRegex = /^[a-zA-Z0-9]+$/;

const LoginPage = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ phone?: string; password?: string }>({});
    const { login } = useAuth();
    const navigate = useNavigate();

    const validateForm = (): boolean => {
        const errors: { phone?: string; password?: string } = {};

        if (!phoneRegex.test(phone)) {
            errors.phone = 'شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹)';
        }

        if (password.length < 6) {
            errors.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
        } else if (!passwordRegex.test(password)) {
            errors.password = 'رمز عبور فقط می‌تواند شامل حروف انگلیسی و اعداد باشد.';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!validateForm()) return;

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
                } else if (err.response?.status === 400) {

                    const data = err.response.data;
                    if (data?.errors) {

                        const messages = Object.values(data.errors).flat().join(' ');
                        setError(messages);
                    } else {
                        setError('اطلاعات وارد شده معتبر نیست.');
                    }
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
                <form onSubmit={handleSubmit} noValidate>
                    {/* Phone field */}
                    <div className="mb-3">
                        <label className="form-label">شماره موبایل</label>
                        <input
                            type="text"
                            className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: undefined }));
                            }}
                            required
                            placeholder="09xxxxxxxxx"
                            dir="ltr"
                        />
                        {fieldErrors.phone && <div className="invalid-feedback">{fieldErrors.phone}</div>}
                    </div>

                    {/* Password field */}
                    <div className="mb-3">
                        <label className="form-label">رمز عبور</label>
                        <input
                            type="password"
                            className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                            }}
                            required
                            dir="ltr"
                        />
                        {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
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