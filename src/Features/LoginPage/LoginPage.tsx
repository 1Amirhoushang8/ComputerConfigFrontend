import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth } from '../../hooks/useAuth';
import api from '../../API/axiosInstance';

const phoneRegex = /^09\d{9}$/;

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const codeInputRef = useRef<HTMLInputElement>(null);

    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [sending, setSending] = useState(false);

    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [cooldown, setCooldown] = useState(0);

    // Countdown
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

    const stripSpaces = (value: string) => value.replace(/\s+/g, '');
    const blockSpaceKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ') e.preventDefault();
    };

    const clearMessages = () => {
        setError('');
        setPhoneError('');
        setCodeError('');
        setSuccessMsg('');
    };

    // Send OTP
    const handleSendOtp = async () => {
        clearMessages();
        const cleanPhone = stripSpaces(phone);

        if (!phoneRegex.test(cleanPhone)) {
            setPhoneError('شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود (بدون فاصله یا خط تیره).');
            return;
        }

        setSending(true);
        try {
            await api.post('/auth/send-otp', { phoneNumber: cleanPhone });
            setPhone(cleanPhone);
            setCodeSent(true);
            setSuccessMsg('کد تأیید به شماره شما ارسال شد. لطفاً کد را وارد کنید.');
            setCooldown(180);
            setTimeout(() => codeInputRef.current?.focus(), 100);
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                if (err.response) {
                    const { status, data } = err.response;
                    if (status === 400 && data?.remainingSeconds) {
                        setCooldown(data.remainingSeconds);
                        setError(`لطفاً ${data.remainingSeconds} ثانیه دیگر صبر کنید.`);
                    } else if (status === 404) {
                        setError('کاربری با این شماره موبایل یافت نشد. لطفاً شماره را بررسی کنید.');
                    } else if (status === 429 || status === 503) {
                        setError('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند دقیقه دیگر تلاش کنید.');
                    } else {
                        setError('خطایی در ارسال کد رخ داد. لطفاً دوباره تلاش کنید.');
                    }
                } else if (err.request) {
                    setError('ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت را بررسی کنید.');
                } else {
                    setError('خطای غیرمنتظره. لطفاً دوباره تلاش کنید.');
                }
            } else {
                setError('خطای غیرمنتظره. لطفاً دوباره تلاش کنید.');
            }
        } finally {
            setSending(false);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        clearMessages();

        const cleanPhone = stripSpaces(phone);
        const cleanCode = stripSpaces(code);

        if (!cleanCode || cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
            setCodeError('کد تأیید باید ۶ رقم باشد (فقط اعداد).');
            return;
        }

        setVerifying(true);
        try {
            const response = await api.post('/auth/verify-otp', {
                phoneNumber: cleanPhone,
                code: cleanCode,
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
                if (err.response) {
                    const { status } = err.response;
                    if (status === 401) {
                        setCodeError('کد وارد شده نامعتبر یا منقضی شده است. لطفاً کد جدید درخواست کنید.');
                    } else if (status === 429 || status === 503) {
                        setError('تعداد تلاش‌ها بیش از حد مجاز است. لطفاً چند دقیقه دیگر تلاش کنید.');
                    } else {
                        setError('خطایی در تأیید کد رخ داد. لطفاً دوباره تلاش کنید.');
                    }
                } else if (err.request) {
                    setError('ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت را بررسی کنید.');
                } else {
                    setError('خطای غیرمنتظره. لطفاً دوباره تلاش کنید.');
                }
            } else {
                setError('خطای غیرمنتظره. لطفاً دوباره تلاش کنید.');
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

    const isPhoneValid = phoneRegex.test(stripSpaces(phone));
    const canSend = !sending && !cooldown && isPhoneValid;

    return (
        <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: '100vh', background: '#f4f6f9' }}
        >
            <div className="card shadow-lg p-4" style={{ width: '420px', borderRadius: '16px' }}>
                <h3 className="text-center mb-4">ورود به سیستم</h3>

                {successMsg && <div className="alert alert-success py-2">{successMsg}</div>}
                {error && <div className="alert alert-danger py-2">{error}</div>}

                <form onSubmit={handleVerifyOtp}>
                    {/* Phone field */}
                    <div className="mb-3">
                        <label className="form-label">شماره موبایل</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            className={`form-control ${phoneError ? 'is-invalid' : ''}`}
                            value={phone}
                            onChange={(e) => {
                                const val = stripSpaces(e.target.value);
                                setPhone(val);
                                if (phoneError) setPhoneError('');
                                if (error) setError('');
                                if (successMsg) setSuccessMsg('');
                                if (codeSent) {
                                    setCodeSent(false);
                                    setCooldown(0);
                                    setCode('');
                                }
                            }}
                            onKeyDown={blockSpaceKey}
                            placeholder="09xxxxxxxxx"
                            dir="ltr"
                            disabled={verifying || sending}
                        />
                        {phoneError && <div className="invalid-feedback">{phoneError}</div>}
                    </div>

                    {/* Code field + send button */}
                    <div className="mb-3">
                        <label className="form-label">کد تأیید</label>
                        <div className="input-group">
                            <input
                                ref={codeInputRef}
                                type="text"
                                inputMode="numeric"
                                className={`form-control ${codeError ? 'is-invalid' : ''}`}
                                value={code}
                                onChange={(e) => {
                                    const val = stripSpaces(e.target.value);
                                    setCode(val);
                                    if (codeError) setCodeError('');
                                    if (error) setError('');
                                }}
                                onKeyDown={blockSpaceKey}
                                placeholder="کد ۶ رقمی"
                                dir="ltr"
                                maxLength={6}
                                disabled={verifying}
                            />
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
                                        canSend ? 'bg-light text-primary' : 'bg-light text-muted'
                                    }`}
                                    style={{
                                        cursor: canSend ? 'pointer' : 'default',
                                        userSelect: 'none',
                                        minWidth: '90px',
                                        justifyContent: 'center',
                                    }}
                                    onClick={canSend ? handleSendOtp : undefined}
                                    role="button"
                                >
                  {sending ? '...' : cooldown > 0 ? formatCooldown(cooldown) : 'ارسال کد تأیید'}
                </span>
                            )}
                        </div>
                        {codeError && <div className="invalid-feedback d-block">{codeError}</div>}
                    </div>

                    {/* Submit button */}
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