import React, { useState, useEffect, useMemo } from 'react';
import { Worker, Employer, DocumentStatus, WorkerDocument, EmployerType } from '../types';
import { PassportIcon, VisaIcon, WorkPermitIcon, BellIcon, Spinner } from './Icons';
import { fetchEmployers } from '../services/apiService';

const getStatusColor = (status: DocumentStatus) => {
  switch (status) {
    case DocumentStatus.Active:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case DocumentStatus.ExpiringSoon:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case DocumentStatus.Expired:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getDaysRemaining = (expiryDate: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const Notifications: React.FC<{ employers: Employer[] }> = ({ employers }) => {
    const expiringDocuments = useMemo(() => {
        const alerts: { worker: Worker; employer: Employer; doc: WorkerDocument }[] = [];
        employers.forEach(employer => {
            employer.workers.forEach(worker => {
                worker.documents.forEach(doc => {
                    if (doc.status === DocumentStatus.ExpiringSoon || doc.status === DocumentStatus.Expired) {
                        alerts.push({ worker, employer, doc });
                    }
                });
            });
        });
        return alerts.sort((a, b) => getDaysRemaining(a.doc.expiryDate) - getDaysRemaining(b.doc.expiryDate));
    }, [employers]);

    if (expiringDocuments.length === 0) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow space-y-4">
            <div className="flex items-center gap-3">
                <BellIcon className="h-6 w-6 text-primary-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">แจ้งเตือนเอกสารใกล้หมดอายุ</h2>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {expiringDocuments.map(({ worker, employer, doc }) => {
                    const daysRemaining = getDaysRemaining(doc.expiryDate);
                    const isExpired = daysRemaining < 0;
                    const notificationKey = `${worker.id}-${doc.type}`;

                    return (
                        <div key={notificationKey} className={`p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4 ${doc.status === DocumentStatus.Expired ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                            <img className="h-12 w-12 rounded-full object-cover flex-shrink-0" src={worker.photoUrl} alt={worker.name} />
                            <div className="flex-grow">
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{worker.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{employer.nameTh}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                    <strong>{doc.type}:</strong>
                                    <span className={`ml-2 font-bold ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                                        {isExpired ? `หมดอายุแล้ว (${doc.expiryDate})` : `เหลือ ${daysRemaining} วัน (หมดอายุ ${doc.expiryDate})`}
                                    </span>
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export const Dashboard: React.FC = () => {
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortOrders, setSortOrders] = useState<{ [key: number]: 'name' | 'expiryDate' }>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchEmployers();
                setEmployers(data);
            } catch (error) {
                console.error("Failed to fetch employers:", error);
                // Optionally show an error message to the user
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const getSoonestExpiry = (worker: Worker): Date | null => {
        if (!worker.documents || worker.documents.length === 0) {
            return null;
        }
        const dates = worker.documents.map(doc => new Date(doc.expiryDate));
        return new Date(Math.min.apply(null, dates as any));
    };

    const renderDocumentStatus = (worker: Worker, docType: WorkerDocument['type'], icon: React.ReactNode) => {
        const doc = worker.documents.find(d => d.type === docType);
    
        if (!doc) {
            return (
                <div className="flex items-center justify-between text-sm opacity-50">
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <span className="w-5 h-5 mr-2">{icon}</span>
                        <span>{docType}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>
                        ไม่มีข้อมูล
                    </span>
                </div>
            );
        }
        
        return (
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <span className="w-5 h-5 mr-2">{icon}</span>
                    <span>{docType}</span>
                </div>
                <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                        {doc.status}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">หมดอายุ: {doc.expiryDate}</p>
                </div>
            </div>
        );
    };

  return (
    <div className="space-y-6">
       <Notifications employers={employers} />
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">แดชบอร์ดข้อมูลนายจ้างและแรงงาน</h2>
        {isLoading ? (
             <div className="flex justify-center items-center py-20">
                <Spinner className="h-8 w-8 text-primary-500" />
                <p className="ml-3 text-gray-500 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
            </div>
        ) : (
            <div className="space-y-8">
                {employers.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500 dark:text-gray-400">ยังไม่มีข้อมูลนายจ้าง</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">กรุณาเพิ่มข้อมูลที่หน้า "บันทึกข้อมูล"</p>
                    </div>
                ) : (
                    employers.map(employer => {
                        const sortKey = sortOrders[employer.id] || 'name';
                        const sortedWorkers = [...employer.workers].sort((a, b) => {
                            if (sortKey === 'expiryDate') {
                                const expiryA = getSoonestExpiry(a);
                                const expiryB = getSoonestExpiry(b);
                                if (expiryA === null) return 1;
                                if (expiryB === null) return -1;
                                return expiryA.getTime() - expiryB.getTime();
                            }
                            // default sort by name
                            return a.name.localeCompare(b.name);
                        });
                        
                        const contactPerson = employer.employerType === EmployerType.Juristic ? employer.directors?.[0]?.nameTh : employer.nameTh;
                        
                        return (
                        <div key={employer.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg shadow-md p-4 sm:p-6 transition-shadow hover:shadow-lg">
                            {/* Employer Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-primary-600 dark:text-primary-400">{employer.nameTh}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <span className="font-semibold">ผู้ติดต่อ:</span> {contactPerson}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">โทร:</span> {employer.phone}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">สถานะเอกสารบริษัท:</h4>
                                <ul className="space-y-2">
                                {employer.documents?.map(doc => (
                                    <li key={doc.type} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">{doc.type} (หมดอายุ: {doc.expiryDate})</span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                                        {doc.status}
                                    </span>
                                    </li>
                                ))}
                                </ul>
                            </div>
                            </div>

                            {/* Worker List */}
                            <div>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-t border-gray-200 dark:border-gray-700 pt-4 mb-4 gap-4">
                                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                    รายชื่อแรงงาน ({employer.workers.length} คน)
                                </h4>
                                {employer.workers.length > 0 && (
                                    <div className="flex items-center">
                                        <label htmlFor={`sort-${employer.id}`} className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2 whitespace-nowrap">
                                            จัดเรียงตาม:
                                        </label>
                                        <select
                                            id={`sort-${employer.id}`}
                                            value={sortKey}
                                            onChange={(e) => setSortOrders({ ...sortOrders, [employer.id]: e.target.value as 'name' | 'expiryDate' })}
                                            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm p-1.5 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="name">ชื่อ</option>
                                            <option value="expiryDate">วันหมดอายุ</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            {employer.workers.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {sortedWorkers.map(worker => (
                                    <div key={worker.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4 flex flex-col">
                                    <div className="flex items-center space-x-4">
                                        <img className="h-16 w-16 rounded-full object-cover" src={worker.photoUrl} alt={worker.name} />
                                        <div>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{worker.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{worker.nationality}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3 flex-grow">
                                        {renderDocumentStatus(worker, 'หนังสือเดินทาง', <PassportIcon />)}
                                        {renderDocumentStatus(worker, 'วีซ่า', <VisaIcon />)}
                                        {renderDocumentStatus(worker, 'ใบอนุญาตทำงาน', <WorkPermitIcon />)}
                                    </div>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-4">ไม่มีข้อมูลแรงงานสำหรับนายจ้างรายนี้</p>
                            )}
                            </div>
                        </div>
                        )
                    })
                )}
            </div>
        )}
      </div>
    </div>
  );
};
