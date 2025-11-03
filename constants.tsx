import React from 'react';
import { NavigationItem } from './types';
import {
  DashboardIcon,
  DataEntryIcon,
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
];