import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppContextType, User, Company, Department } from '../types';
import { supabase } from '../lib/supabase';

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = async () => {
    const mockUser: User = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'john.doe@acme.com',
      full_name: 'John Doe',
      avatar_url: undefined,
      role: 'admin',
      company_id: '11111111-1111-1111-1111-111111111111',
      created_at: new Date().toISOString(),
      site_department_manager: true,
      can_manage_dept_tasks: true,
      security_clearance: 'secret',
    };

    const mockCompany: Company = {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Acme Corporation',
      logo_url: undefined,
      created_at: new Date().toISOString(),
    };

    const { data: depts } = await supabase
      .from('departments')
      .select('*')
      .eq('company_id', mockCompany.id);

    const mockDepartments = depts || [];

    setUser(mockUser);
    setCompany(mockCompany);
    setDepartments(mockDepartments);
    if (mockDepartments.length > 0) {
      setCurrentDepartment(mockDepartments[0]);
    }
    setIsLoading(false);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        company,
        departments,
        currentDepartment,
        setCurrentDepartment,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
