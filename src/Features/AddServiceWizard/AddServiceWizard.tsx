import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { fetchCustomers } from '../../API/customersApi';
import { fetchWorkers } from '../../API/workersApi';
import { createTicket } from '../../API/ticketsApi';
import type { CreateTicketPayload } from '../../API/ticketsApi';
import { isAxiosError } from 'axios';
import "./AddServiceWizard.scss";

// ---------- Radio choices ----------
const DEVICE_TYPES = ['لپ‌تاپ', 'کامپیوتر رومیزی', 'موبایل', 'تبلت', 'پرینتر', 'سایر موارد'];
const DEVICE_BRANDS = ['Asus', 'HP', 'Lenovo', 'Dell', 'Apple', 'Samsung', 'سایر موارد'];

const SOFTWARE_QUESTIONS = [
    { id: 'sq1', question: 'مشکل اصلی', options: ['کندی', 'ویروس', 'بالا نیامدن ویندوز', 'نصب نرم‌افزار', 'سایر'] },
    { id: 'sq2', question: 'سیستم عامل', options: ['Windows 10', 'Windows 11', 'Linux', 'macOS', 'سایر'] },
    { id: 'sq3', question: 'نوع نرم‌افزار', options: ['اداری', 'گرافیکی', 'برنامه‌نویسی', 'امنیتی', 'سایر'] },
];
const HARDWARE_QUESTIONS = [
    { id: 'hq1', question: 'قطعه معیوب', options: ['باتری', 'صفحه نمایش', 'هارد', 'رم', 'مادربورد', 'سایر'] },
    { id: 'hq2', question: 'علت خرابی', options: ['ضربه', 'آب‌خوردگی', 'استهلاک', 'نوسان برق', 'سایر'] },
    { id: 'hq3', question: 'مدت زمان مشکل', options: ['ناگهانی', 'تدریجی', 'از ابتدای خرید', 'سایر'] },
];

// ---------- Types ----------
interface StepData {
    title: string;
    customerId: number;
    workerId: number;
    serviceType: '' | 'software' | 'hardware' | 'both';
    deviceType: { selected: string; custom: string };
    deviceBrand: { selected: string; custom: string };
    softwareAnswers: { questionId: string; selected: string; custom: string }[];
    hardwareAnswers: { questionId: string; selected: string; custom: string }[];
    extraNotes: string;
    model: string;
    serialNumber: string;
}

const emptyStepData: StepData = {
    title: '',
    customerId: 0,
    workerId: 0,
    serviceType: '',
    deviceType: { selected: '', custom: '' },
    deviceBrand: { selected: '', custom: '' },
    softwareAnswers: SOFTWARE_QUESTIONS.map(q => ({ questionId: q.id, selected: '', custom: '' })),
    hardwareAnswers: HARDWARE_QUESTIONS.map(q => ({ questionId: q.id, selected: '', custom: '' })),
    extraNotes: '',
    model: '',
    serialNumber: '',
};

const AddServiceWizard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<StepData>(emptyStepData);
    const [customers, setCustomers] = useState<{ id: number; fullName: string }[]>([]);
    const [workers, setWorkers] = useState<{ id: number; fullName: string; specialty: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [trackingCode, setTrackingCode] = useState<string | null>(null);

    useEffect(() => {
        if (!isAdmin) return;
        (async () => {
            try {
                const [custData, workData] = await Promise.all([
                    fetchCustomers(),
                    fetchWorkers(),
                ]);
                setCustomers(custData.map(c => ({ id: c.id, fullName: c.fullName })));
                setWorkers(workData.map(w => ({ id: w.id, fullName: w.fullName, specialty: w.specialty })));
            } catch { /* ignore */ }
        })();
    }, [isAdmin]);

    if (!isAdmin) return <Navigate to="/app/PCServices" replace />;

    // Build step labels dynamically – the last step is ALWAYS "رسید"
    const buildSteps = (): { label: string }[] => {
        const steps: { label: string }[] = [
            { label: 'اطلاعات اولیه' },
            { label: 'نوع دستگاه' },
            { label: 'برند دستگاه' },
        ];
        if (formData.serviceType === 'software') {
            steps.push({ label: 'سؤالات نرم‌افزار' });
        } else if (formData.serviceType === 'hardware') {
            steps.push({ label: 'سؤالات سخت‌افزار' });
        } else if (formData.serviceType === 'both') {
            steps.push({ label: 'سؤالات نرم‌افزار' });
            steps.push({ label: 'سؤالات سخت‌افزار' });
        }
        steps.push({ label: 'توضیحات تکمیلی' });
        steps.push({ label: 'رسید' });   // always present
        return steps;
    };

    const steps = buildSteps();
    const totalSteps = steps.length;
    const isFirst = currentStep === 0;
    const isLast = currentStep === totalSteps - 1;

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    // Validation per step (receipt step always valid)
    const canProceed = (): boolean => {
        if (isLast) return true; // receipt step
        switch (currentStep) {
            case 0:
                return formData.title.trim() !== '' && formData.customerId !== 0 && formData.workerId !== 0 && formData.serviceType !== '';
            case 1:
                return formData.deviceType.selected !== '' &&
                    !(formData.deviceType.selected === 'سایر موارد' && formData.deviceType.custom.trim() === '');
            case 2:
                return formData.deviceBrand.selected !== '' &&
                    !(formData.deviceBrand.selected === 'سایر موارد' && formData.deviceBrand.custom.trim() === '');
            default: {
                // service questions steps
                const firstQuestionStep = 3;
                const lastQuestionStep = steps.length - 2;
                if (currentStep >= firstQuestionStep && currentStep < steps.length - 2) {
                    const allQuestions = formData.serviceType === 'software'
                        ? SOFTWARE_QUESTIONS
                        : formData.serviceType === 'hardware'
                            ? HARDWARE_QUESTIONS
                            : [...SOFTWARE_QUESTIONS, ...HARDWARE_QUESTIONS];
                    const questionIndex = currentStep - firstQuestionStep;
                    if (questionIndex >= 0 && questionIndex < allQuestions.length) {
                        const isHardwarePart = formData.serviceType === 'both' && questionIndex >= SOFTWARE_QUESTIONS.length;
                        const ansArray = isHardwarePart
                            ? formData.hardwareAnswers
                            : formData.serviceType === 'hardware' ? formData.hardwareAnswers : formData.softwareAnswers;
                        const answer = ansArray[questionIndex % (isHardwarePart ? HARDWARE_QUESTIONS.length : ansArray.length)];
                        if (!answer) return true;
                        return answer.selected !== '' && !(answer.selected === 'سایر' && answer.custom.trim() === '');
                    }
                }
                return true; // confirmation step (second last)
            }
        }
    };

    // Submit from receipt page
    const handleSubmit = async () => {
        if (loading || trackingCode) return;
        setLoading(true);
        setError('');

        const payload: CreateTicketPayload = {
            title: formData.title,
            customerId: formData.customerId,
            workerId: formData.workerId,
            serviceType: formData.serviceType === 'software' ? 'نرم‌افزار' : formData.serviceType === 'hardware' ? 'سخت‌افزار' : 'نرم‌افزار و سخت‌افزار',
            deviceType: formData.deviceType.selected === 'سایر موارد' ? formData.deviceType.custom : formData.deviceType.selected,
            brand: formData.deviceBrand.selected === 'سایر موارد' ? formData.deviceBrand.custom : formData.deviceBrand.selected,
            model: formData.model,
            serialNumber: formData.serialNumber,
            problemDescription: formData.extraNotes,
        };

        try {
            const result = await createTicket(payload);
            setTrackingCode(result.trackingCode);
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response) {
                setError(err.response.data?.message || 'خطا در ایجاد سرویس');
            } else {
                setError('خطا در ایجاد سرویس');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handlers for radio + other
    const handleRadioChange = (field: 'deviceType' | 'deviceBrand', value: string, customValue: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: { selected: value, custom: value.endsWith('موارد') ? customValue : '' },
        }));
    };

    const handleQuestionAnswer = (questionIndex: number, value: string, customValue: string, type: 'software' | 'hardware') => {
        setFormData(prev => {
            const newAnswers = type === 'software' ? [...prev.softwareAnswers] : [...prev.hardwareAnswers];
            newAnswers[questionIndex] = {
                ...newAnswers[questionIndex],
                selected: value,
                custom: value === 'سایر' ? customValue : '',
            };
            return type === 'software' ? { ...prev, softwareAnswers: newAnswers } : { ...prev, hardwareAnswers: newAnswers };
        });
    };

    // Render step content
    const renderStep = () => {
        // Receipt step (always last)
        if (isLast) {
            return (
                <div className="step-card receipt">
                    <h4 className="text-center mb-3">رسید سرویس</h4>
                    <table className="table table-bordered">
                        <tbody>
                        <tr><td>عنوان</td><td>{formData.title}</td></tr>
                        <tr><td>مشتری</td><td>{customers.find(c => c.id === formData.customerId)?.fullName}</td></tr>
                        <tr><td>تعمیرکار</td><td>{workers.find(w => w.id === formData.workerId)?.fullName}</td></tr>
                        <tr><td>نوع سرویس</td><td>{formData.serviceType === 'software' ? 'نرم‌افزار' : formData.serviceType === 'hardware' ? 'سخت‌افزار' : 'نرم‌افزار و سخت‌افزار'}</td></tr>
                        <tr><td>نوع دستگاه</td><td>{formData.deviceType.selected === 'سایر موارد' ? formData.deviceType.custom : formData.deviceType.selected}</td></tr>
                        <tr><td>برند</td><td>{formData.deviceBrand.selected === 'سایر موارد' ? formData.deviceBrand.custom : formData.deviceBrand.selected}</td></tr>
                        {trackingCode && (
                            <tr><td>کد رهگیری</td><td><strong>{trackingCode}</strong></td></tr>
                        )}
                        </tbody>
                    </table>

                    {!trackingCode ? (
                        <div className="text-center">
                            {error && <div className="alert alert-danger">{error}</div>}
                            <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'در حال ثبت...' : 'ثبت نهایی'}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <button className="btn btn-outline-primary" onClick={() => alert('دانلود PDF در آینده پیاده‌سازی خواهد شد.')}>
                                دانلود PDF
                            </button>
                            <button className="btn btn-primary ms-2" onClick={() => navigate('/app/PCServices')}>بازگشت به لیست</button>
                        </div>
                    )}
                </div>
            );
        }

        // Step 0: initial info
        if (currentStep === 0) {
            return (
                <div className="step-card">
                    <div className="mb-3">
                        <label className="form-label">عنوان *</label>
                        <input type="text" className="form-control" value={formData.title}
                               onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">مشتری *</label>
                        <select className="form-select" value={formData.customerId || ''}
                                onChange={e => setFormData(prev => ({ ...prev, customerId: +e.target.value }))}>
                            <option value="">انتخاب کنید</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">تعمیرکار *</label>
                        <select className="form-select" value={formData.workerId || ''}
                                onChange={e => setFormData(prev => ({ ...prev, workerId: +e.target.value }))}>
                            <option value="">انتخاب کنید</option>
                            {workers.map(w => (
                                <option key={w.id} value={w.id}>
                                    {w.fullName} {w.specialty ? `(${w.specialty})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">نوع سرویس *</label>
                        <div className="d-flex gap-3">
                            {[
                                { value: 'software', label: 'نرم‌افزار' },
                                { value: 'hardware', label: 'سخت‌افزار' },
                                { value: 'both', label: 'نرم‌افزار و سخت‌افزار' },
                            ].map(opt => (
                                <label key={opt.value} className="form-check form-check-inline">
                                    <input className="form-check-input" type="radio" name="serviceType"
                                           checked={formData.serviceType === opt.value}
                                           onChange={() => setFormData(prev => ({ ...prev, serviceType: opt.value as StepData['serviceType'] }))} />
                                    <span className="form-check-label">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // Step 1: device type
        if (currentStep === 1) {
            return (
                <RadioGroup
                    title="نوع دستگاه"
                    options={DEVICE_TYPES}
                    selected={formData.deviceType.selected}
                    custom={formData.deviceType.custom}
                    onChange={(val, cust) => handleRadioChange('deviceType', val, cust)}
                />
            );
        }

        // Step 2: device brand
        if (currentStep === 2) {
            return (
                <RadioGroup
                    title="برند دستگاه"
                    options={DEVICE_BRANDS}
                    selected={formData.deviceBrand.selected}
                    custom={formData.deviceBrand.custom}
                    onChange={(val, cust) => handleRadioChange('deviceBrand', val, cust)}
                />
            );
        }

        // Confirmation step (second last)
        const isConfirmationStep = currentStep === steps.length - 2;
        if (isConfirmationStep) {
            return (
                <div className="step-card">
                    <div className="mb-3">
                        <label className="form-label">مدل (اختیاری)</label>
                        <input type="text" className="form-control" value={formData.model}
                               onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">سریال (اختیاری)</label>
                        <input type="text" className="form-control" value={formData.serialNumber}
                               onChange={e => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">توضیحات تکمیلی</label>
                        <textarea className="form-control" rows={4} value={formData.extraNotes}
                                  onChange={e => setFormData(prev => ({ ...prev, extraNotes: e.target.value }))} />
                    </div>
                </div>
            );
        }

        // Service questions steps
        const firstQuestionStep = 3;
        const lastQuestionStep = steps.length - 2; // confirmation step index
        if (currentStep >= firstQuestionStep && currentStep < lastQuestionStep) {
            const allQuestions = formData.serviceType === 'software'
                ? SOFTWARE_QUESTIONS
                : formData.serviceType === 'hardware'
                    ? HARDWARE_QUESTIONS
                    : [...SOFTWARE_QUESTIONS, ...HARDWARE_QUESTIONS];
            const questionIndex = currentStep - firstQuestionStep;
            if (questionIndex >= 0 && questionIndex < allQuestions.length) {
                const isHardwarePart = formData.serviceType === 'both' && questionIndex >= SOFTWARE_QUESTIONS.length;
                const ansArray = isHardwarePart
                    ? formData.hardwareAnswers
                    : formData.serviceType === 'hardware' ? formData.hardwareAnswers : formData.softwareAnswers;
                const answer = ansArray[questionIndex % (isHardwarePart ? HARDWARE_QUESTIONS.length : ansArray.length)];
                const question = allQuestions[questionIndex];
                return (
                    <RadioGroup
                        title={question.question}
                        options={question.options}
                        selected={answer.selected}
                        custom={answer.custom}
                        onChange={(val, cust) => handleQuestionAnswer(
                            questionIndex % (isHardwarePart ? HARDWARE_QUESTIONS.length : ansArray.length),
                            val,
                            cust,
                            isHardwarePart ? 'hardware' : 'software'
                        )}
                    />
                );
            }
        }

        return null;
    };

    return (
        <div className="container-fluid add-service-wizard">
            <h2 className="mb-4">افزودن سرویس جدید</h2>

            {/* Progress bubbles */}
            <div className="progress-bar-bubbles mb-5">
                {steps.map((step, idx) => (
                    <div key={idx} className={`bubble ${idx <= currentStep ? 'filled' : ''} ${idx === currentStep ? 'current' : ''}`}>
                        <span>{idx + 1}</span>
                        <small>{step.label}</small>
                    </div>
                ))}
            </div>

            <div className="wizard-content">
                {renderStep()}
            </div>

            <div className="d-flex justify-content-between mt-4">
                {!isFirst && !trackingCode && (
                    <button className="btn btn-secondary" onClick={prevStep}>قبلی</button>
                )}
                <div className="ms-auto">
                    {!isLast && !trackingCode && (
                        <button className="btn btn-primary" disabled={!canProceed()} onClick={nextStep}>بعدی</button>
                    )}
                    {/* No separate submit button here – it's inside the receipt page */}
                </div>
            </div>
        </div>
    );
};

// Reusable radio group component
const RadioGroup = ({ title, options, selected, custom, onChange }: {
    title: string;
    options: string[];
    selected: string;
    custom: string;
    onChange: (value: string, customValue: string) => void;
}) => (
    <div className="step-card">
        <h5>{title}</h5>
        {options.map(opt => (
            <label key={opt} className="form-check">
                <input className="form-check-input" type="radio" name={title}
                       checked={selected === opt}
                       onChange={() => onChange(opt, custom)} />
                <span className="form-check-label">{opt}</span>
            </label>
        ))}
        {(selected === 'سایر' || selected === 'سایر موارد') && (
            <input type="text" className="form-control mt-2" placeholder="لطفاً توضیح دهید..."
                   value={custom}
                   onChange={e => onChange(selected, e.target.value)} />
        )}
    </div>
);

export default AddServiceWizard;