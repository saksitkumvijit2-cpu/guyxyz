
import React from 'react';

export enum DocumentStatus {
  Active = 'Active',
  ExpiringSoon = 'Expiring Soon',
  Expired = 'Expired',
}

export interface WorkerDocument {
  type: 'หนังสือเดินทาง' | 'วีซ่า' | 'ใบอนุญาตทำงาน';
  expiryDate: string;
  status: DocumentStatus;
}

// Enum for the new resolution types
export enum ResolutionType {
  C1_Register_2569 = 'มติ ครม. 24 ก.ย. 67 (ขึ้นทะเบียน) - สิ้นสุด 31 มี.ค. 69',
  C2_Renew_2570 = 'มติ ครม. 24 ก.ย. 67 (ต่ออายุ) - สิ้นสุด 13 ก.พ. 70',
  MOU_First_2_Years = 'MOU นำเข้า 2 ปีแรก',
  MOU_Year_3_4 = 'MOU นำเข้า ปี 3-4',
}


export interface Worker {
  id: number;
  prefix: 'นาย' | 'นาง' | 'นางสาว';
  prefixEn: 'Mr.' | 'Mrs.' | 'Miss';
  name: string;
  nameEn: string;
  nationality: string;
  photoUrl: string;
  dob: string; // Date of Birth
  passportNo: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  visaNo: string;
  visaIssuePlace: string;
  visaIssueDate: string;
  visaExpiryDate: string;
  workPermitIssueDate: string;
  workPermitExpiryDate: string;
  resolutionType: ResolutionType;
  documents: WorkerDocument[];
}

// New detailed types for Employer
export enum EmployerType {
  Individual = 'บุคคลธรรมดา',
  Juristic = 'นิติบุคคล',
}

export interface Address {
  houseNo: string;
  moo: string;
  soi: string;
  road: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
}

export interface Director {
  nameTh: string;
  nameEn: string;
}

export interface Employer {
  id: number;
  employerType: EmployerType;
  taxId: string;
  email: string;
  password?: string; // Optional as we might not store it directly
  referenceCode: string;
  phone: string;

  // Common fields, interpreted as personal name for Individual, company name for Juristic
  prefixTh: string;
  nameTh: string;
  prefixEn: string;
  nameEn: string;

  businessTypeTh: string;
  businessTypeEn: string;
  jobDescriptionTh: string;
  jobDescriptionEn: string;

  addressTh: Address;
  addressEn: Address;

  wage: number;
  employmentArea: string;
  
  // Juristic-specific fields (optional)
  branchType?: 'สำนักงานใหญ่' | 'สาขา' | 'อื่นๆ';
  branchName?: string;
  registrationDate?: string;
  registeredCapital?: number;
  directors?: Director[];

  // List of workers associated with this employer
  workers: Worker[];
  // FIX: Add optional 'documents' property to align with its usage in Dashboard.tsx.
  documents?: EmployerDocument[];
}

export interface EmployerDocument {
  type: 'หนังสือรับรองบริษัท' | 'ภ.พ.20';
  expiryDate: string;
  status: DocumentStatus;
}

// FIX: Add GroundingChunk to resolve import error in ResearchAssistant.tsx
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}


export interface NavigationItem {
  id: string;
  name: string;
  icon: React.ReactNode;
}

// New Types for Case Management Feature
export enum CaseStatus {
  Pending = 'รอดำเนินการ',
  InProgress = 'กำลังดำเนินการ',
  Completed = 'เสร็จสิ้น',
}

export interface Task {
  id: number;
  description: string;
  completed: boolean;
}

export interface CaseDocument {
  id: number;
  name: string;
  url: string; // Local object URL for preview
}

export interface Case {
  id: number;
  title: string;
  workerId: number; // Link to the worker
  employerId: number; // Link to the employer
  status: CaseStatus;
  tasks: Task[];
  assignee: string;
  dueDate: string;
  documents: CaseDocument[];
  channel: 'Online' | 'In-person';
  notes: string;
}