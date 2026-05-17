import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth } from '../../hooks/useAuth';
import api from '../../API/axiosInstance';

const phoneRegex = /^09\d{9}$/;

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [sending, setSending] = useState(false);

    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [codeSent, setCodeSent] = useState(false);    // true after OTP successfully sent
    const [verifying, setVerifying] = useState(false);

    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);        // seconds remaining

    // Countdown effect
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    // Send OTP
    const handleSendOtp = async () => {
        setError('');
        setPhoneError('');
        if (!phoneRegex.test(phone)) {
            setPhoneError('شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود.');
            return;
        }
        setSending(true);
        try {
            await api.post('/auth/send-otp', { phoneNumber: phone });
            setCodeSent(true);
            setCooldown(180);   // 3 minutes
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                const data = err.response?.data;
                if (err.response?.status === 400 && data?.remainingSeconds) {
                    setCooldown(data.remainingSeconds);
                    setError(`لطفاً ${data.remainingSeconds} ثانیه دیگر صبر کنید.`);
                } else if (err.response?.status === 404) {
                    setError('کاربری با این شماره یافت نشد.');
                } else if (err.response?.status === 503) {
                    setError('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً صبر کنید.');
                } else {
                    setError('خطا در ارسال کد. دوباره تلاش کنید.');
                }
            } else {
                setError('خطا در برقراری ارتباط با سرور.');
            }
        } finally {
            setSending(false);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCodeError('');
        if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
            setCodeError('کد باید ۶ رقم باشد.');
            return;
        }
        setVerifying(true);
        try {
            const response = await api.post('/auth/verify-otp', {
                phoneNumber: phone,
                code: code,
            });
            const { fullName, role } = response.data;
            login(fullName, role);
            if (role === 'customer') {
                navigate('/customer-dashboard', { replace: true });
            } else {
                navigate('/app/PCServices', { replace: true });
            }
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                if (err.response?.status === 401) {
                    setCodeError('کد نامعتبر یا منقضی شده است.');
                } else if (err.response?.status === 503) {
                    setError('تعداد تلاش‌ها بیش از حد مجاز است. لطفاً صبر کنید.');
                } else {
                    setError('خطا در تأیید کد. دوباره تلاش کنید.');
                }
            } else {
                setError('خطا در برقراری ارتباط با سرور.');
            }
        } finally {
            setVerifying(false);
        }
    };

    const formatCooldown = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: '100vh', background: '#f4f6f9' }}
        >
            <div className="card shadow-lg p-4" style={{ width: '420px', borderRadius: '16px' }}>
                <h3 className="text-center mb-4">ورود به سیستم</h3>

                {error && <div className="alert alert-danger py-2">{error}</div>}

                <form onSubmit={handleVerifyOtp}>
                    {/* Phone number field */}
                    <div className="mb-3">
                        <label className="form-label">شماره موبایل</label>
                        <input
                            type="text"
                            className={`form-control ${phoneError ? 'is-invalid' : ''}`}
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                setPhoneError('');
                                if (codeSent) {
                                    setCodeSent(false);
                                    setCooldown(0);
                                }
                            }}
                            placeholder="09xxxxxxxxx"
                            dir="ltr"
                            disabled={verifying}
                        />
                        {phoneError && <div className="invalid-feedback">{phoneError}</div>}
                    </div>

                    {/* Verification code field + send text / timer */}
                    <div className="mb-3">
                        <label className="form-label">کد تأیید</label>
                        <div className="input-group">
                            <input
                                type="text"
                                className={`form-control ${codeError ? 'is-invalid' : ''}`}
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value);
                                    setCodeError('');
                                }}
                                placeholder="کد ۶ رقمی"
                                dir="ltr"
                                maxLength={6}
                                disabled={verifying}   // only disabled while verifying
                            />
                            {/* Send code text / countdown */}
                            {codeSent ? (
                                cooldown > 0 ? (
                                    <span
                                        className="input-group-text bg-warning text-dark fw-bold"
                                        style={{ minWidth: '70px', justifyContent: 'center' }}
                                    >
                    {formatCooldown(cooldown)}
                  </span>
                                ) : (
                                    <span
                                        className="input-group-text bg-light text-primary"
                                        style={{ cursor: 'pointer', userSelect: 'none' }}
                                        onClick={handleSendOtp}
                                        role="button"
                                    >
                    ارسال مجدد
                  </span>
                                )
                            ) : (
                                <span
                                    className={`input-group-text ${
                                        sending || cooldown > 0
                                            ? 'bg-light text-muted'
                                            : 'bg-light text-primary'
                                    }`}
                                    style={{
                                        cursor: sending || cooldown > 0 ? 'default' : 'pointer',
                                        userSelect: 'none',
                                    }}
                                    onClick={sending || cooldown > 0 ? undefined : handleSendOtp}
                                    role="button"
                                >
                  {sending ? '...' : cooldown > 0 ? formatCooldown(cooldown) : 'ارسال کد تأیید'}
                </span>
                            )}
                        </div>
                        {codeError && <div className="invalid-feedback d-block">{codeError}</div>}
                    </div>

                    {/* Login button – always available except during verifying */}
                    <button
                        type="submit"
                        className="btn btn-success w-100 mt-3"
                        disabled={verifying}
                    >
                        {verifying ? 'در حال ورود...' : 'ورود'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;