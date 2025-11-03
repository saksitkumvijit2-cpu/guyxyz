import React from 'react';
import { NavigationItem } from './types';
import {
  DashboardIcon,
  DataEntryIcon,
  ResearchIcon,
  ImageEditIcon,
  ImageGenIcon,
  ClipboardListIcon, // Import the new icon
} from './components/Icons';

export const NAV_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    name: 'แดชบอร์ด',
    icon: <DashboardIcon />,
  },
  {
    id: 'data_entry',
    name: 'บันทึกข้อมูล',
    icon: <DataEntryIcon />,
  },
  {
    id: 'case_management', // Add new navigation item
    name: 'จัดการเคส',
    icon: <ClipboardListIcon />,
  },
  {
    id: 'research_assistant',
    name: 'ผู้ช่วยค้นคว้า',
    icon: <ResearchIcon />,
  },
  {
    id: 'image_editor',
    name: 'แก้ไขรูปภาพ',
    icon: <ImageEditIcon />,
  },
  {
    id: 'image_generator',
    name: 'สร้างรูปภาพ',
    icon: <ImageGenIcon />,
  },
];
