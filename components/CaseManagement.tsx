import React, { useState, useEffect, useMemo } from 'react';
import { Case, Task, CaseStatus, Employer, Worker, CaseDocument } from '../types';
import { fetchEmployers, fetchCases, saveCases } from '../services/apiService';
import { Spinner, TrashIcon, PencilIcon, DocumentIcon, UploadIcon, AlertTriangleIcon, GlobeIcon, BuildingOfficeIcon } from './Icons';

interface CaseTemplate {
    key: string;
    title: string;
    channel: 'Online' | 'In-person';
    defaultNote: string;
}

const CASE_TEMPLATES: CaseTemplate[] = [
    { key: 'renew_wp', title: 'ต่ออายุใบอนุญาตการทำงาน', channel: 'Online', defaultNote: 'ดำเนินการผ่านระบบ e-Work Permit: http://eworkpermit.doe.go.th/' },
    { key: 'renew_visa', title: 'ต่ออายุ VISA', channel: 'In-person', defaultNote: 'เตรียมเอกสารฉบับจริงทั้งหมดเพื่อยื่นที่สำนักงานตรวจคนเข้าเมือง' },
    { key: 'report_90', title: 'รายงานตัว 90 วัน', channel: 'In-person', defaultNote: 'สามารถรายงานตัวก่อนวันนัดได้ 15 วัน และหลังวันนัดได้ 7 วัน' },
    { key: 'new_wp', title: 'ทำใบอนุญาตทำงานใหม่', channel: 'Online', defaultNote: 'ดำเนินการผ่านระบบ e-Work Permit: http://eworkpermit.doe.go.th/' },
    { key: 'notify_in', title: 'แจ้งเข้าทำงาน', channel: 'Online', defaultNote: 'แจ้งเข้าภายใน 15 วันนับจากวันที่เริ่มจ้าง' },
    { key: 'notify_out', title: 'แจ้งออกจากงาน', channel: 'Online', defaultNote: 'แจ้งออกภายใน 15 วันนับจากวันที่สิ้นสุดการจ้าง' },
];

const STATUS_CONFIG = {
    [CaseStatus.Pending]: { title: 'รอดำเนินการ', color: 'bg-blue-500', accentBorder: 'border-blue-500' },
    [CaseStatus.InProgress]: { title: 'กำลังดำเนินการ', color: 'bg-yellow-500', accentBorder: 'border-yellow-500' },
    [CaseStatus.Completed]: { title: 'เสร็จสิ้น', color: 'bg-green-500', accentBorder: 'border-green-500' },
}

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

const isOverdue = (dueDate: string): boolean => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ignore time part
    return new Date(dueDate) < today;
};


export const CaseManagement: React.FC = () => {
    const [cases, setCases] = useState<Case[]>([]);
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newCaseData, setNewCaseData] = useState({
        templateKey: '',
        employerId: '',
        workerId: '',
        assignee: '',
        dueDate: ''
    });
    const [customTitle, setCustomTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editingCaseData, setEditingCaseData] = useState<Partial<Case> | null>(null);

    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [casesData, employersData] = await Promise.all([fetchCases(), fetchEmployers()]);
                setCases(casesData);
                setEmployers(employersData);
            } catch (error) {
                console.error("Failed to load initial data for Case Management:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const allWorkers = useMemo(() => employers.flatMap(e => e.workers), [employers]);
    const workerMap = useMemo(() => new Map(allWorkers.map(w => [w.id, w])), [allWorkers]);
    const employerMap = useMemo(() => new Map(employers.map(e => [e.id, e])), [employers]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewCaseData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenCreateModal = () => {
        setIsCreating(true);
        setSelectedCase(null);
        setIsModalOpen(true);
        setNewCaseData({ templateKey: '', employerId: '', workerId: '', assignee: '', dueDate: '' });
        setCustomTitle('');
    };

    const handleOpenDetailsModal = (caseData: Case) => {
        setIsCreating(false);
        setSelectedCase(caseData);
        setIsModalOpen(true);
        setNewTaskDescription('');
        setIsEditing(false);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsCreating(false);
        setSelectedCase(null);
        setIsEditing(false);
        setEditingCaseData(null);
    };

    const handleCreateCase = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedTemplate = CASE_TEMPLATES.find(t => t.key === newCaseData.templateKey);
        const selectedWorker = workerMap.get(Number(newCaseData.workerId));

        if (!selectedTemplate || !selectedWorker || !newCaseData.employerId) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const finalTitle = `${selectedTemplate.title} - ${selectedWorker.name}`;

        const newCase: Case = {
            id: Date.now(),
            title: finalTitle,
            workerId: Number(newCaseData.workerId),
            employerId: Number(newCaseData.employerId),
            status: CaseStatus.Pending,
            tasks: [], // Start with an empty task list
            assignee: newCaseData.assignee,
            dueDate: newCaseData.dueDate,
            documents: [],
            channel: selectedTemplate.channel,
            notes: selectedTemplate.defaultNote,
        };
        const updatedCases = [...cases, newCase];
        setCases(updatedCases);
        handleCloseModal();
        await saveCases(updatedCases);
    };
    
    const updateCaseAndPersist = async (caseId: number, updatedCase: Case) => {
        const updatedCases = cases.map(c => (c.id === caseId ? updatedCase : c));
        setCases(updatedCases);
        if (selectedCase?.id === caseId) {
            setSelectedCase(updatedCase);
        }
        await saveCases(updatedCases);
    };


    const handleTaskToggle = (caseId: number, taskId: number) => {
        const targetCase = cases.find(c => c.id === caseId);
        if (!targetCase) return;
        const updatedTasks = targetCase.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        updateCaseAndPersist(caseId, { ...targetCase, tasks: updatedTasks });
    };

    const handleTaskDescriptionChange = (caseId: number, taskId: number, newDescription: string) => {
        const targetCase = cases.find(c => c.id === caseId);
        if (!targetCase) return;
        const updatedTasks = targetCase.tasks.map(t => t.id === taskId ? { ...t, description: newDescription } : t);
        updateCaseAndPersist(caseId, { ...targetCase, tasks: updatedTasks });
    };

    const confirmDeleteTask = (caseId: number, taskId: number) => {
        const targetCase = cases.find(c => c.id === caseId);
        if (!targetCase) return;
        const updatedTasks = targetCase.tasks.filter(t => t.id !== taskId);
        updateCaseAndPersist(caseId, { ...targetCase, tasks: updatedTasks });
        setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    };

    const handleDeleteTask = (caseId: number, taskId: number) => {
        const taskToDelete = cases.find(c => c.id === caseId)?.tasks.find(t => t.id === taskId);
        if (!taskToDelete) return;

        setConfirmation({
            isOpen: true,
            title: 'ยืนยันการลบ Task',
            message: `คุณแน่ใจหรือไม่ว่าต้องการลบ Task: "${taskToDelete.description}"? การกระทำนี้ไม่สามารถย้อนกลับได้`,
            onConfirm: () => confirmDeleteTask(caseId, taskId),
        });
    };

    const handleAddTask = (caseId: number) => {
        if (!newTaskDescription.trim()) return;
        const targetCase = cases.find(c => c.id === caseId);
        if (!targetCase) return;
        const newTask: Task = {
            id: Date.now(),
            description: newTaskDescription,
            completed: false,
        };
        const updatedTasks = [...targetCase.tasks, newTask];
        updateCaseAndPersist(caseId, { ...targetCase, tasks: updatedTasks });
        setNewTaskDescription('');
    };

    const handleStartEditing = () => {
        if (!selectedCase) return;
        setIsEditing(true);
        setEditingCaseData({
            ...selectedCase,
        });
    };

    const handleCancelEditing = () => {
        setIsEditing(false);
        setEditingCaseData(null);
    };
    
    const handleEditingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditingCaseData(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleUpdateCase = () => {
        if (!editingCaseData || !editingCaseData.id) return;
        const updatedCase = { ...cases.find(c => c.id === editingCaseData.id), ...editingCaseData } as Case;
        updateCaseAndPersist(editingCaseData.id, updatedCase);
        setIsEditing(false);
        setEditingCaseData(null);
    };

    const handleFileUpload = (caseId: number, file: File | null | undefined) => {
        if (!file) return;
        const targetCase = cases.find(c => c.id === caseId);
        if (!targetCase) return;

        const newDocument: CaseDocument = {
            id: Date.now(),
            name: file.name,
            url: URL.createObjectURL(file), // This is temporary and local
        };
        const existingDocs = targetCase.documents || [];
        const updatedDocuments = [...existingDocs, newDocument];
        updateCaseAndPersist(caseId, { ...targetCase, documents: updatedDocuments });
    };

    const confirmDeleteDocument = (caseId: number, documentId: number) => {
       const targetCase = cases.find(c => c.id === caseId);
       if (!targetCase) return;
       const updatedDocuments = targetCase.documents.filter(d => d.id !== documentId);
       updateCaseAndPersist(caseId, { ...targetCase, documents: updatedDocuments });
       setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
   };

    const handleDeleteDocument = (caseId: number, documentId: number) => {
        const docToDelete = cases.find(c => c.id === caseId)?.documents.find(d => d.id === documentId);
        if (!docToDelete) return;

        setConfirmation({
            isOpen: true,
            title: 'ยืนยันการลบเอกสาร',
            message: `คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร: "${docToDelete.name}"? การกระทำนี้ไม่สามารถย้อนกลับได้`,
            onConfirm: () => confirmDeleteDocument(caseId, documentId),
        });
    };

    const renderDetailItem = (label: string, value: string | undefined | null) => (
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-sm text-gray-900 dark:text-white">{value || '-'}</p>
        </div>
    );
    
    const CaseCard: React.FC<{ caseItem: Case }> = ({ caseItem }) => {
        const worker = workerMap.get(caseItem.workerId);
        const employer = employerMap.get(caseItem.employerId);
        const completedTasks = caseItem.tasks.filter(t => t.completed).length;
        const progress = caseItem.tasks.length > 0 ? (completedTasks / caseItem.tasks.length) * 100 : 0;
        const overdue = isOverdue(caseItem.dueDate);

        return (
             <div onClick={() => handleOpenDetailsModal(caseItem)} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3 cursor-pointer hover:shadow-xl transition-shadow border-l-4" style={{borderColor: STATUS_CONFIG[caseItem.status].color.replace('bg-', '')}}>
                <h4 className="font-bold text-md text-gray-900 dark:text-white truncate">{caseItem.title}</h4>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p><span className="font-semibold">ลูกจ้าง:</span> {worker?.name || 'N/A'}</p>
                    <p><span className="font-semibold">นายจ้าง:</span> {employer?.nameTh || 'N/A'}</p>
                    <p><span className="font-semibold">ผู้รับผิดชอบ:</span> {caseItem.assignee}</p>
                </div>
                
                <div className={`flex items-center text-sm ${overdue && caseItem.status !== CaseStatus.Completed ? 'text-red-500 font-semibold' : 'text-gray-500 dark:text-gray-300'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{overdue && caseItem.status !== CaseStatus.Completed ? 'เลยกำหนด!' : 'กำหนดส่ง'}: {caseItem.dueDate}</span>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ความคืบหน้า</span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{completedTasks}/{caseItem.tasks.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div className={`h-2 rounded-full ${STATUS_CONFIG[caseItem.status].color}`} style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>
        )
    };

    const renderModalContent = () => {
        if (isCreating) {
            const selectedEmployer = employers.find(e => e.id === Number(newCaseData.employerId));
            return (
                <form onSubmit={handleCreateCase} className="space-y-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">สร้างเคสใหม่</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ประเภทเคส</label>
                        <select name="templateKey" value={newCaseData.templateKey} onChange={handleInputChange} required className="mt-1 w-full input-style">
                            <option value="">เลือกประเภทงาน</option>
                            {CASE_TEMPLATES.map(template => <option key={template.key} value={template.key}>{template.title}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">นายจ้าง</label>
                            <select name="employerId" value={newCaseData.employerId} onChange={handleInputChange} required className="mt-1 w-full input-style">
                                <option value="">เลือกนายจ้าง</option>
                                {employers.map(e => <option key={e.id} value={e.id}>{e.nameTh}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ลูกจ้าง</label>
                            <select name="workerId" value={newCaseData.workerId} onChange={handleInputChange} required disabled={!newCaseData.employerId} className="mt-1 w-full input-style disabled:opacity-50">
                                <option value="">เลือกลูกจ้าง</option>
                                {selectedEmployer?.workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ผู้รับผิดชอบ</label>
                            <input type="text" name="assignee" value={newCaseData.assignee} onChange={handleInputChange} required className="mt-1 w-full input-style"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">วันที่กำหนดส่ง</label>
                            <input type="date" name="dueDate" value={newCaseData.dueDate} onChange={handleInputChange} required className="mt-1 w-full input-style"/>
                        </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-2">
                         <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">ยกเลิก</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">สร้างเคส</button>
                    </div>
                </form>
            );
        }
        if (selectedCase) {
            const worker = workerMap.get(selectedCase.workerId);
            return (
                 <div className="space-y-6">
                    {isEditing && editingCaseData ? (
                        <div className="space-y-4 p-4 bg-primary-50 dark:bg-gray-900/50 rounded-lg">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">หัวข้อเคส</label>
                                <input type="text" name="title" value={editingCaseData.title || ''} onChange={handleEditingInputChange} className="mt-1 w-full input-style" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ผู้รับผิดชอบ</label>
                                    <input type="text" name="assignee" value={editingCaseData.assignee || ''} onChange={handleEditingInputChange} className="mt-1 w-full input-style"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">กำหนดส่ง</label>
                                    <input type="date" name="dueDate" value={editingCaseData.dueDate || ''} onChange={handleEditingInputChange} className="mt-1 w-full input-style"/>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">สถานะเคส</label>
                                <select name="status" value={editingCaseData.status} onChange={handleEditingInputChange} className="mt-1 w-full input-style">
                                    {Object.values(CaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">บันทึก/ข้อมูลสำคัญ</label>
                                <textarea name="notes" value={editingCaseData.notes || ''} onChange={handleEditingInputChange} rows={3} className="mt-1 w-full input-style" />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{selectedCase.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    {selectedCase.channel === 'Online' ? <GlobeIcon /> : <BuildingOfficeIcon />}
                                    <span>{selectedCase.channel === 'Online' ? 'ออนไลน์' : 'ติดต่อด้วยตนเอง'}</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400"><strong>ผู้รับผิดชอบ:</strong> {selectedCase.assignee} | <strong>กำหนดส่ง:</strong> {selectedCase.dueDate}</p>
                        </div>
                    )}
                     
                     {!isEditing && worker && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                             <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">รายละเอียดผู้ปฏิบัติงาน</h4>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                 {renderDetailItem("ชื่อ-นามสกุล", `${worker.prefix}${worker.name} (${worker.prefixEn} ${worker.nameEn})`)}
                                 {renderDetailItem("สัญชาติ", worker.nationality)}
                                 {renderDetailItem("วันเกิด", `${worker.dob} (อายุ ${calculateAge(worker.dob)} ปี)`)}
                                 {renderDetailItem("เลขที่ Passport", worker.passportNo)}
                                 {renderDetailItem("วันที่ออก Passport", worker.passportIssueDate)}
                                 {renderDetailItem("วันที่เล่มหมดอายุ Passport", worker.passportExpiryDate)}
                                 {renderDetailItem("เลขที่ VISA", worker.visaNo)}
                                 {renderDetailItem("สถานที่ออก VISA", worker.visaIssuePlace)}
                                 {renderDetailItem("วันหมดอายุ VISA", worker.visaExpiryDate)}
                                 {renderDetailItem("วันหมดอายุ Work Permit", worker.workPermitExpiryDate)}
                                 <div className="col-span-2 md:col-span-3">
                                    {renderDetailItem("ประเภทมติ", worker.resolutionType)}
                                 </div>
                             </div>
                        </div>
                     )}

                     <div>
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">รายการสิ่งที่ต้องทำ</h4>
                        <ul className="space-y-2">
                           {selectedCase.tasks.map(task => (
                               <li key={task.id} className="flex items-center gap-2">
                                   <input
                                       type="checkbox"
                                       id={`task-${task.id}`}
                                       checked={task.completed}
                                       onChange={() => handleTaskToggle(selectedCase.id, task.id)}
                                       className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                                   />
                                    <input
                                        type="text"
                                        value={task.description}
                                        onChange={(e) => handleTaskDescriptionChange(selectedCase.id, task.id, e.target.value)}
                                        className={`flex-grow text-sm p-1 rounded-md bg-transparent border border-transparent focus:bg-gray-100 dark:focus:bg-gray-700 focus:border-gray-300 dark:focus:border-gray-500 transition-all ${task.completed ? 'line-through text-gray-500' : 'text-black dark:text-gray-300'}`}
                                    />
                                    <button onClick={() => handleDeleteTask(selectedCase.id, task.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                               </li>
                           ))}
                        </ul>
                        <div className="mt-4 flex items-center gap-2">
                            <input
                                type="text"
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                placeholder="เพิ่ม Task ใหม่..."
                                className="flex-grow text-sm p-2 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 text-black dark:text-gray-100"
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask(selectedCase.id); } }}
                            />
                            <button
                                type="button"
                                onClick={() => handleAddTask(selectedCase.id)}
                                className="px-4 py-2 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600"
                            >
                                เพิ่ม
                            </button>
                        </div>
                    </div>
                    
                    {!isEditing && selectedCase.notes && (
                         <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                             <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">บันทึก/ข้อมูลสำคัญ</h4>
                             <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">{selectedCase.notes}</p>
                         </div>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">เอกสารแนบ</h4>
                        <div className="space-y-2">
                            {selectedCase.documents?.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <DocumentIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                                            {doc.name}
                                        </a>
                                    </div>
                                    <button onClick={() => handleDeleteDocument(selectedCase.id, doc.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <label htmlFor={`file-upload-${selectedCase.id}`} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 cursor-pointer">
                                <UploadIcon className="h-4 w-4"/>
                                เพิ่มเอกสาร
                            </label>
                            <input
                                type="file"
                                id={`file-upload-${selectedCase.id}`}
                                className="sr-only"
                                onChange={(e) => handleFileUpload(selectedCase.id, e.target.files?.[0])}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        {isEditing ? (
                            <>
                                <button type="button" onClick={handleCancelEditing} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">ยกเลิก</button>
                                <button type="button" onClick={handleUpdateCase} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">บันทึก</button>
                            </>
                        ) : (
                            <>
                                <button type="button" onClick={handleStartEditing} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                                    <PencilIcon className="h-4 w-4"/>
                                    แก้ไขเคส
                                </button>
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">ปิด</button>
                            </>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">จัดการเคส</h2>
                <button onClick={handleOpenCreateModal} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 w-full sm:w-auto">
                    + สร้างเคสใหม่
                </button>
            </div>
            
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner className="h-8 w-8 text-primary-500" />
                    <p className="ml-3 text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูลเคส...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {(Object.keys(STATUS_CONFIG) as CaseStatus[]).map(status => {
                        const filteredCases = cases.filter(c => c.status === status);
                        const config = STATUS_CONFIG[status];
                        return (
                            <div key={status} className="bg-gray-100 dark:bg-gray-900 rounded-lg h-full">
                                <div className={`p-4 border-b-4 ${config.accentBorder} sticky top-0 bg-gray-100 dark:bg-gray-900 rounded-t-lg z-10`}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{config.title}</h3>
                                        <span className={`text-sm font-bold text-white ${config.color} rounded-full h-6 w-6 flex items-center justify-center`}>
                                            {filteredCases.length}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-4">
                                    {filteredCases.length > 0 ? (
                                        filteredCases.map(caseItem => <CaseCard key={caseItem.id} caseItem={caseItem} />)
                                    ) : (
                                        <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">ไม่มีเคสในสถานะนี้</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start py-10 overflow-y-auto" onClick={handleCloseModal}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl my-auto" onClick={(e) => e.stopPropagation()}>
                        {renderModalContent()}
                    </div>
                </div>
            )}
            
            {confirmation.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                <AlertTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                    {confirmation.title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {confirmation.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                            <button
                                type="button"
                                onClick={confirmation.onConfirm}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm"
                            >
                                ยืนยัน
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmation({ ...confirmation, isOpen: false })}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FIX: Removed invalid 'jsx' prop from style tag. */}
            <style>{`
                .input-style {
                    background-color: #F9FAFB;
                    border: 1px solid #D1D5DB;
                    border-radius: 0.375rem;
                    padding: 0.5rem;
                    color: black;
                }
                .dark .input-style {
                    background-color: #374151;
                    border-color: #4B5563;
                    color: #F3F4F6;
                }
            `}</style>

        </div>
    );
};