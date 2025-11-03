import React, { useState, useMemo, useEffect } from 'react';
import { ResolutionType, Address, Director, EmployerType, Employer } from '../types';
import { TrashIcon, Spinner } from './Icons';
import { fetchEmployers, saveEmployers } from '../services/apiService';


const initialAddress: Address = { houseNo: '', moo: '', soi: '', road: '', subdistrict: '', district: '', province: '', postalCode: '' };

const initialEmployerState: Omit<Employer, 'id' | 'workers' | 'documents'> = {
    employerType: EmployerType.Individual,
    taxId: '',
    email: '',
    password: '',
    referenceCode: '',
    phone: '',
    prefixTh: 'นาย',
    nameTh: '',
    prefixEn: 'Mr.',
    nameEn: '',
    businessTypeTh: '',
    businessTypeEn: '',
    jobDescriptionTh: '',
    jobDescriptionEn: '',
    addressTh: initialAddress,
    addressEn: initialAddress,
    wage: 0,
    employmentArea: '',
    branchType: 'สำนักงานใหญ่',
    branchName: '',
    registrationDate: '',
    registeredCapital: 0,
    directors: [{ nameTh: '', nameEn: '' }],
};


export const DataEntry: React.FC = () => {
    const [activeTab, setActiveTab] = useState('employer');
    const [dob, setDob] = useState('');
    const [formData, setFormData] = useState(initialEmployerState);
    const [allEmployers, setAllEmployers] = useState<Employer[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            const employers = await fetchEmployers();
            setAllEmployers(employers);
        };
        loadInitialData();
    }, []);

    const suggestions = useMemo(() => {
        const allWorkers = allEmployers.flatMap(e => e.workers);

        return {
            businessTypesTh: [...new Set(allEmployers.map(e => e.businessTypeTh).filter(Boolean))],
            businessTypesEn: [...new Set(allEmployers.map(e => e.businessTypeEn).filter(Boolean))],
            jobDescriptionsTh: [...new Set(allEmployers.map(e => e.jobDescriptionTh).filter(Boolean))],
            jobDescriptionsEn: [...new Set(allEmployers.map(e => e.jobDescriptionEn).filter(Boolean))],
            employmentAreas: [...new Set(allEmployers.map(e => e.employmentArea).filter(Boolean))],
            nationalities: [...new Set(allWorkers.map(w => w.nationality).filter(Boolean))],
            visaIssuePlaces: [...new Set(allWorkers.map(w => w.visaIssuePlace).filter(Boolean))],
        };
    }, [allEmployers]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleEmployerTypeChange = (type: EmployerType) => {
        setFormData(prev => ({ ...prev, employerType: type }));
    };

    const calculateAge = (birthDate: string): number | null => {
        if (!birthDate) return null;
        try {
            const today = new Date();
            const birthDateObj = new Date(birthDate);
            let age = today.getFullYear() - birthDateObj.getFullYear();
            const m = today.getMonth() - birthDateObj.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
                age--;
            }
            return age;
        } catch (e) {
            return null;
        }
    };
    
    const age = useMemo(() => calculateAge(dob), [dob]);

    const formatAddress = (addr: Address) => {
        return [
            addr.houseNo,
            addr.moo ? `หมู่ ${addr.moo}` : '',
            addr.soi ? `ซอย ${addr.soi}` : '',
            addr.road ? `ถนน ${addr.road}` : '',
            addr.subdistrict,
            addr.district,
            addr.province,
            addr.postalCode,
        ].filter(Boolean).join(' ');
    };

    const combinedAddressTh = useMemo(() => formatAddress(formData.addressTh), [formData.addressTh]);
    const combinedAddressEn = useMemo(() => formatAddress(formData.addressEn), [formData.addressEn]);

    const handleAddressChange = (lang: 'th' | 'en', field: keyof Address, value: string) => {
        const addressKey = lang === 'th' ? 'addressTh' : 'addressEn';
        setFormData(prev => ({
            ...prev,
            [addressKey]: {
                ...prev[addressKey],
                [field]: value,
            }
        }));
    };
    
    const handleAddDirector = () => {
        setFormData(prev => ({
            ...prev,
            directors: [...(prev.directors || []), { nameTh: '', nameEn: '' }]
        }));
    };

    const handleRemoveDirector = (index: number) => {
        if (formData.directors && formData.directors.length > 1) {
            setFormData(prev => ({
                ...prev,
                directors: prev.directors?.filter((_, i) => i !== index)
            }));
        }
    };

    const handleDirectorChange = (index: number, field: keyof Director, value: string) => {
        const newDirectors = [...(formData.directors || [])];
        newDirectors[index] = { ...newDirectors[index], [field]: value };
        setFormData(prev => ({ ...prev, directors: newDirectors }));
    };

    const handleEmployerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const newEmployer: Employer = {
                ...formData,
                id: Date.now(),
                workers: [],
                documents: [], // Start with no documents
            };

            const currentEmployers = await fetchEmployers();
            const updatedEmployers = [...currentEmployers, newEmployer];
            await saveEmployers(updatedEmployers);

            alert('บันทึกข้อมูลนายจ้างสำเร็จ!');
            setAllEmployers(updatedEmployers); // Update local state for suggestions
            setFormData(initialEmployerState); // Reset form
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setIsSubmitting(false);
        }
    };

    const WorkerForm = () => (
        <form className="space-y-6">
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">การบันทึกข้อมูลแรงงานจะพร้อมใช้งานในเร็วๆ นี้</p>
                 <p className="text-sm text-gray-500">กรุณาบันทึกข้อมูลนายจ้างก่อน</p>
            </div>
        </form>
    );

    const EmployerForm = () => (
        <form className="space-y-8" onSubmit={handleEmployerSubmit}>
            {/* Employer Type Selection */}
            <fieldset>
                <legend className="text-base font-medium text-gray-900 dark:text-white">ประเภทนายจ้าง</legend>
                <div className="mt-4 flex gap-x-8">
                    <div className="flex items-center">
                        <input id="individual" name="employer-type" type="radio" checked={formData.employerType === EmployerType.Individual} onChange={() => handleEmployerTypeChange(EmployerType.Individual)} className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                        <label htmlFor="individual" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">{EmployerType.Individual}</label>
                    </div>
                    <div className="flex items-center">
                        <input id="juristic" name="employer-type" type="radio" checked={formData.employerType === EmployerType.Juristic} onChange={() => handleEmployerTypeChange(EmployerType.Juristic)} className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                        <label htmlFor="juristic" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">{EmployerType.Juristic}</label>
                    </div>
                </div>
            </fieldset>

            {/* Basic Information */}
            <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-6">
                 <legend className="text-lg font-medium text-gray-900 dark:text-white">ข้อมูลพื้นฐาน</legend>
                 <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="เลขประจำตัวผู้เสียภาษี" id="taxId" value={formData.taxId} onChange={handleInputChange} />
                    <InputField label="E-mail" id="email" type="email" value={formData.email} onChange={handleInputChange} />
                    <InputField label="Password" id="password" type="password" value={formData.password} onChange={handleInputChange} />
                    <InputField label="รหัสอ้างอิงนายจ้าง" id="referenceCode" value={formData.referenceCode} onChange={handleInputChange} />
                    <InputField label="เบอร์โทรศัพท์" id="phone" value={formData.phone} onChange={handleInputChange} />
                 </div>
                 <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                     {formData.employerType === EmployerType.Individual ? (
                         <div className="grid grid-cols-4 gap-2">
                            <div className="col-span-1"><SelectField label="คำนำหน้า (ไทย)" id="prefixTh" options={['นาย', 'นาง', 'นางสาว']} value={formData.prefixTh} onChange={handleInputChange}/></div>
                            <div className="col-span-3"><InputField label="ชื่อ-นามสกุล (ไทย)" id="nameTh" value={formData.nameTh} onChange={handleInputChange} /></div>
                         </div>
                     ) : (
                        <InputField label="ชื่อนิติบุคคล (ไทย)" id="nameTh" value={formData.nameTh} onChange={handleInputChange} />
                     )}
                     {formData.employerType === EmployerType.Individual ? (
                         <div className="grid grid-cols-4 gap-2">
                            <div className="col-span-1"><SelectField label="คำนำหน้า (อังกฤษ)" id="prefixEn" options={['Mr.', 'Mrs.', 'Miss']} value={formData.prefixEn} onChange={handleInputChange} /></div>
                            <div className="col-span-3"><InputField label="ชื่อ-นามสกุล (อังกฤษ)" id="nameEn" value={formData.nameEn} onChange={handleInputChange} /></div>
                         </div>
                     ) : (
                        <InputField label="ชื่อนิติบุคคล (อังกฤษ)" id="nameEn" value={formData.nameEn} onChange={handleInputChange} />
                     )}
                 </div>
            </fieldset>
            
             {/* Business Information */}
            <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <legend className="text-lg font-medium text-gray-900 dark:text-white">ข้อมูลกิจการ</legend>
                 <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AutocompleteInputField label="ประเภทกิจการ (ไทย)" id="businessTypeTh" suggestions={suggestions.businessTypesTh} value={formData.businessTypeTh} onChange={handleInputChange} />
                    <AutocompleteInputField label="ประเภทกิจการ (อังกฤษ)" id="businessTypeEn" suggestions={suggestions.businessTypesEn} value={formData.businessTypeEn} onChange={handleInputChange} />
                    <AutocompleteInputField label="ลักษณะงานที่ให้ทำ (ไทย)" id="jobDescriptionTh" suggestions={suggestions.jobDescriptionsTh} value={formData.jobDescriptionTh} onChange={handleInputChange} />
                    <AutocompleteInputField label="ลักษณะงานที่ให้ทำ (อังกฤษ)" id="jobDescriptionEn" suggestions={suggestions.jobDescriptionsEn} value={formData.jobDescriptionEn} onChange={handleInputChange} />
                 </div>
            </fieldset>

            {/* Juristic Person Information */}
            {formData.employerType === EmployerType.Juristic && (
                <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <legend className="text-lg font-medium text-gray-900 dark:text-white">ข้อมูลนิติบุคคล</legend>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">สาขา</label>
                            <div className="flex gap-x-4 mt-2">
                                <RadioOption id="hq" name="branchType" label="สำนักงานใหญ่" value="สำนักงานใหญ่" checked={formData.branchType === 'สำนักงานใหญ่'} onChange={e => setFormData(p => ({...p, branchType: 'สำนักงานใหญ่'}))} />
                                <RadioOption id="branch" name="branchType" label="สาขา" value="สาขา" checked={formData.branchType === 'สาขา'} onChange={e => setFormData(p => ({...p, branchType: 'สาขา'}))} />
                                <RadioOption id="other" name="branchType" label="อื่นๆ" value="อื่นๆ" checked={formData.branchType === 'อื่นๆ'} onChange={e => setFormData(p => ({...p, branchType: 'อื่นๆ'}))} />
                            </div>
                        </div>
                        <InputField label="วันที่จดทะเบียนนิติบุคคล" id="registrationDate" type="date" value={formData.registrationDate} onChange={handleInputChange} />
                        <InputField label="ทุนจดทะเบียนนิติบุคคล" id="registeredCapital" type="number" value={formData.registeredCapital?.toString()} onChange={e => setFormData(p => ({...p, registeredCapital: Number(e.target.value)}))} />
                    </div>
                     <div className="mt-6">
                        <label className="block text-base font-medium text-gray-900 dark:text-white">กรรมการผู้มีอำนาจลงนาม</label>
                        {formData.directors?.map((director, index) => (
                             <div key={index} className="mt-2 grid grid-cols-1 sm:grid-cols-10 gap-2 items-end">
                                <div className="sm:col-span-4"><InputField label={`ชื่อ-สกุล กรรมการ ${index + 1} (ไทย)`} value={director.nameTh} onChange={(e) => handleDirectorChange(index, 'nameTh', e.target.value)} /></div>
                                <div className="sm:col-span-4"><InputField label={`ชื่อ-สกุล กรรมการ ${index + 1} (อังกฤษ)`} value={director.nameEn} onChange={(e) => handleDirectorChange(index, 'nameEn', e.target.value)} /></div>
                                <div className="sm:col-span-2">
                                     <button type="button" onClick={() => handleRemoveDirector(index)} disabled={formData.directors!.length === 1} className="w-full h-10 px-3 py-2 bg-red-500 text-white rounded-md flex items-center justify-center gap-1 hover:bg-red-600 disabled:bg-gray-400">
                                        <TrashIcon className="h-4 w-4" /> ลบ
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddDirector} className="mt-3 px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600">+ เพิ่มกรรมการ</button>
                     </div>
                </fieldset>
            )}

            {/* Address Information */}
            <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <legend className="text-lg font-medium text-gray-900 dark:text-white">ที่อยู่ (ไทย)</legend>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InputField label="บ้านเลขที่" value={formData.addressTh.houseNo} onChange={e => handleAddressChange('th', 'houseNo', e.target.value)} />
                    <InputField label="หมู่" value={formData.addressTh.moo} onChange={e => handleAddressChange('th', 'moo', e.target.value)} />
                    <InputField label="ซอย" value={formData.addressTh.soi} onChange={e => handleAddressChange('th', 'soi', e.target.value)} />
                    <InputField label="ถนน" value={formData.addressTh.road} onChange={e => handleAddressChange('th', 'road', e.target.value)} />
                    <InputField label="ตำบล/แขวง" value={formData.addressTh.subdistrict} onChange={e => handleAddressChange('th', 'subdistrict', e.target.value)} />
                    <InputField label="อำเภอ/เขต" value={formData.addressTh.district} onChange={e => handleAddressChange('th', 'district', e.target.value)} />
                    <InputField label="จังหวัด" value={formData.addressTh.province} onChange={e => handleAddressChange('th', 'province', e.target.value)} />
                    <InputField label="รหัสไปรษณีย์" value={formData.addressTh.postalCode} onChange={e => handleAddressChange('th', 'postalCode', e.target.value)} />
                </div>
                <div className="mt-4">
                    <InputField label="ที่อยู่ (รวม)" id="combined-address-th" value={combinedAddressTh} disabled />
                </div>
            </fieldset>
            
            <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <legend className="text-lg font-medium text-gray-900 dark:text-white">ที่อยู่ (อังกฤษ)</legend>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                     <InputField label="House No." value={formData.addressEn.houseNo} onChange={e => handleAddressChange('en', 'houseNo', e.target.value)} />
                    <InputField label="Moo/Building" value={formData.addressEn.moo} onChange={e => handleAddressChange('en', 'moo', e.target.value)} />
                    <InputField label="Soi" value={formData.addressEn.soi} onChange={e => handleAddressChange('en', 'soi', e.target.value)} />
                    <InputField label="Road" value={formData.addressEn.road} onChange={e => handleAddressChange('en', 'road', e.target.value)} />
                    <InputField label="Sub-district" value={formData.addressEn.subdistrict} onChange={e => handleAddressChange('en', 'subdistrict', e.target.value)} />
                    <InputField label="District" value={formData.addressEn.district} onChange={e => handleAddressChange('en', 'district', e.target.value)} />
                    <InputField label="Province" value={formData.addressEn.province} onChange={e => handleAddressChange('en', 'province', e.target.value)} />
                    <InputField label="Postal Code" value={formData.addressEn.postalCode} onChange={e => handleAddressChange('en', 'postalCode', e.target.value)} />
                </div>
                <div className="mt-4">
                     <InputField label="Address (Full)" id="combined-address-en" value={combinedAddressEn} disabled />
                </div>
            </fieldset>

            {/* Other Info */}
            <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <legend className="text-lg font-medium text-gray-900 dark:text-white">ข้อมูลอื่นๆ</legend>
                 <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="ค่าแรง" id="wage" type="number" value={formData.wage.toString()} onChange={e => setFormData(p => ({...p, wage: Number(e.target.value)}))} />
                    <AutocompleteInputField label="เขตพื้นที่จัดหางาน" id="employmentArea" suggestions={suggestions.employmentAreas} value={formData.employmentArea} onChange={handleInputChange} />
                 </div>
            </fieldset>

            <div>
                 <button 
                    type="submit" 
                    className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:bg-primary-300"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Spinner className="h-5 w-5 mr-2" />
                            กำลังบันทึก...
                        </>
                    ) : (
                        'บันทึกข้อมูลนายจ้าง'
                    )}
                </button>
            </div>
        </form>
    );

    const InputField = ({ label, id, type = 'text', value, onChange, disabled = false }: { label: string, id?: string, type?: string, value?: string, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled?: boolean }) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <input type={type} id={id} value={value} onChange={onChange} disabled={disabled} className="mt-1 block w-full input-style disabled:bg-gray-200 dark:disabled:bg-gray-800" />
        </div>
    );
    
    const AutocompleteInputField = ({ label, id, value, onChange, suggestions = [] }: { label: string, id: string, value?: string, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void, suggestions?: string[] }) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <input
                type="text"
                id={id}
                value={value}
                onChange={onChange}
                list={`${id}-suggestions`}
                autoComplete="off"
                className="mt-1 block w-full input-style"
            />
            <datalist id={`${id}-suggestions`}>
                {suggestions.map((item, index) => (
                    <option key={index} value={item} />
                ))}
            </datalist>
        </div>
    );

    const SelectField = ({ label, id, options, value, onChange }: { label: string, id: string, options: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <select id={id} value={value} onChange={onChange} className="mt-1 block w-full input-style">
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );
    
    const RadioOption = ({ id, name, label, value, checked, onChange }: { id: string, name: string, label: string, value: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
        <div className="flex items-center">
            <input id={id} name={name} type="radio" value={value} checked={checked} onChange={onChange} className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
            <label htmlFor={id} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">{label}</label>
        </div>
    );


    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">บันทึกข้อมูลใหม่</h2>
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                     <button onClick={() => setActiveTab('employer')} className={`${activeTab === 'employer' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        ข้อมูลนายจ้าง
                    </button>
                    <button onClick={() => setActiveTab('worker')} className={`${activeTab === 'worker' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        ข้อมูลแรงงาน
                    </button>
                </nav>
            </div>
            <div className="pt-6">
                {activeTab === 'worker' ? <WorkerForm /> : <EmployerForm />}
            </div>
            {/* FIX: Removed invalid 'jsx' prop from style tag. */}
             <style>{`
                .input-style {
                    background-color: #F9FAFB;
                    border: 1px solid #D1D5DB;
                    border-radius: 0.375rem;
                    padding: 0.5rem;
                    color: black;
                    height: 2.5rem; /* 40px */
                    width: 100%;
                }
                .dark .input-style {
                    background-color: #374151;
                    border-color: #4B5563;
                    color: #F3F4F6;
                }
                label {
                    white-space: nowrap;
                }
            `}</style>
        </div>
    );
};