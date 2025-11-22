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
  AcademicCapIcon,
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/outline";

interface NavItem {
  name: string;
  id: string;
  icon: any;
}

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

export default function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigation: NavItem[] = [
    { name: 'Dashboard', id: 'dashboard', icon: HomeIcon },
    { name: 'Upload Prospects', id: 'upload', icon: CloudArrowUpIcon },
    { name: 'Campaigns', id: 'campaigns', icon: ChartBarIcon },
    { name: 'Templates', id: 'templates', icon: DocumentTextIcon },
    { name: 'Learning Hub', id: 'learning', icon: AcademicCapIcon },
  ];

  const secondaryNavigation: NavItem[] = [
    { name: 'Settings', id: 'settings', icon: Cog6ToothIcon },
    { name: 'Help & Support', id: 'help', icon: QuestionMarkCircleIcon },
  ];

  const handleNavigation = (section: string) => {
    onNavigate(section);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6 text-gray-600" />
        ) : (
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        flex h-full w-64 flex-col bg-white border-r border-gray-200
        fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <Logo />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.id)}
              className={`
                w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                ${activeSection === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <item.icon
                className={`
                  mr-3 h-5 w-5 flex-shrink-0
                  ${activeSection === item.id
                    ? 'text-blue-700'
                    : 'text-gray-400 group-hover:text-gray-500'
                  }
                `}
                aria-hidden="true"
              />
              {item.name}
            </button>
          ))}
        </div>

        <div className="pt-6 mt-6 border-t border-gray-200">
          <div className="space-y-1">
            {secondaryNavigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.id)}
                className={`
                  w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                  ${activeSection === item.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${activeSection === item.id
                      ? 'text-gray-700'
                      : 'text-gray-400 group-hover:text-gray-500'
                    }
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </button>
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
    </>
  );
}
