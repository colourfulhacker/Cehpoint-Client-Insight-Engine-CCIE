"use client";

import { useState } from "react";
import Logo from "./Logo";
import { 
  HomeIcon, 
  CloudArrowUpIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  current: boolean;
}

export default function Sidebar() {
  const [navigation] = useState<NavItem[]>([
    { name: 'Dashboard', href: '#', icon: HomeIcon, current: true },
    { name: 'Upload Prospects', href: '#', icon: CloudArrowUpIcon, current: false },
    { name: 'Campaigns', href: '#', icon: ChartBarIcon, current: false },
    { name: 'Templates', href: '#', icon: DocumentTextIcon, current: false },
    { name: 'Learning Hub', href: '#', icon: AcademicCapIcon, current: false },
  ]);

  const [secondaryNavigation] = useState<NavItem[]>([
    { name: 'Settings', href: '#', icon: Cog6ToothIcon, current: false },
    { name: 'Help & Support', href: '#', icon: QuestionMarkCircleIcon, current: false },
  ]);

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                ${item.current
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 h-5 w-5 flex-shrink-0
                  ${item.current
                    ? 'text-blue-700'
                    : 'text-gray-400 group-hover:text-gray-500'
                  }
                `}
                aria-hidden="true"
              />
              {item.name}
            </a>
          ))}
        </div>

        <div className="pt-6 mt-6 border-t border-gray-200">
          <div className="space-y-1">
            {secondaryNavigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <item.icon
                  className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                  aria-hidden="true"
                />
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Status Indicator */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg">
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-emerald-700">
            System Operational
          </span>
        </div>
      </div>
    </div>
  );
}
