import React, { useState } from 'react';
import { Home, FolderOpen, Settings, ChevronDown, LogOut, Building2, User, Star, Users, Archive, Trash2, Inbox, Search, BarChart3, FileText, Scan } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface SidebarProps {
  currentView: 'dashboard' | 'files' | 'settings' | 'starred' | 'shared' | 'archived' | 'trash' | 'correspondences' | 'retention' | 'audit-log' | 'batch-scan';
  onViewChange: (view: 'dashboard' | 'files' | 'settings' | 'starred' | 'shared' | 'archived' | 'trash' | 'correspondences' | 'retention' | 'audit-log' | 'batch-scan') => void;
  onSearchClick: () => void;
}

export function Sidebar({ currentView, onViewChange, onSearchClick }: SidebarProps) {
  const { t } = useTranslation();
  const { user, company, departments, currentDepartment, setCurrentDepartment } = useApp();
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const menuItems = [
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: Home },
    { id: 'files', labelKey: 'nav.myFiles', icon: FolderOpen },
    { id: 'batch-scan', labelKey: 'nav.batchScan', icon: Scan },
    { id: 'starred', labelKey: 'nav.starred', icon: Star },
    { id: 'shared', labelKey: 'nav.sharedFiles', icon: Users },
    { id: 'archived', labelKey: 'nav.archived', icon: Archive },
    { id: 'trash', labelKey: 'nav.trash', icon: Trash2 },
  ] as const;

  const taskItems = [
    { id: 'correspondences', labelKey: 'nav.correspondences', icon: Inbox },
  ] as const;

  const complianceItems = [
    { id: 'retention', labelKey: 'nav.retention', icon: BarChart3 },
    { id: 'audit-log', labelKey: 'nav.auditLog', icon: FileText },
  ] as const;

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">{company?.name}</h1>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
            className="w-full px-3 py-2 bg-gray-800 rounded-lg flex items-center justify-between hover:bg-gray-750 transition-colors"
          >
            <span className="text-sm text-gray-300">{currentDepartment?.name || 'Select Department'}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showDepartmentDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden z-50">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => {
                    setCurrentDepartment(dept);
                    setShowDepartmentDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors"
                >
                  {dept.name}
                </button>
              ))}
              <div className="border-t border-gray-700">
                <button
                  onClick={() => {
                    onViewChange('settings');
                    setShowDepartmentDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 rtl:text-right"
                >
                  <Settings className="w-4 h-4" />
                  {t('common.settings')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <button
          onClick={onSearchClick}
          className="w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-colors text-gray-300 hover:bg-gray-800 mb-2"
        >
          <Search className="w-5 h-5" />
          <span className="text-sm font-medium">{t('common.search')}</span>
        </button>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                isActive
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{t(item.labelKey)}</span>
            </button>
          );
        })}

        <div className="pt-6">
          <h2 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {t('nav.tasks')}
          </h2>
          {taskItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-6">
          <h2 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {t('nav.compliance')}
          </h2>
          {complianceItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="mb-3">
          <LanguageSwitcher />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
              <button
                onClick={() => {
                  onViewChange('settings');
                  setShowUserDropdown(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 rtl:text-right"
              >
                <Settings className="w-4 h-4" />
                {t('common.settings')}
              </button>

              {user?.role === 'admin' && (
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Sites
                </button>
              )}

              <div className="border-t border-gray-700">
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center gap-2 text-red-400 rtl:text-right"
                >
                  <LogOut className="w-4 h-4" />
                  {t('common.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
