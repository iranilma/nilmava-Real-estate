import React, { useState, useEffect } from 'react';
import { Sidebar, NavigationSection } from './Sidebar';
import { TopHeader } from './TopHeader';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../services/agencyRepository';

interface AppShellProps {
  currentSection: NavigationSection;
  onNavigate: (section: NavigationSection) => void;
  children: React.ReactNode;
  onOpenQuickAdd: (type?: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentSection,
  onNavigate,
  children,
  onOpenQuickAdd,
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [badgeCounts, setBadgeCounts] = useState({ leads: 0, properties: 0, tasks: 0 });
  const { showToast } = useToast();
  const { refreshOrganization } = useOrganization();

  const loadCounts = async () => {
    try {
      const [leads, properties, tasks] = await Promise.all([
        repository.getLeads(),
        repository.getProperties(),
        repository.getTasks(),
      ]);
      setBadgeCounts({
        leads: leads.filter((l) => l.status !== 'Closed Won' && l.status !== 'Lost').length,
        properties: properties.filter((p) => p.status !== 'Sold').length,
        tasks: tasks.filter((t) => !t.is_completed && t.priority === 'High').length,
      });
    } catch (err) {
      console.error('Failed to update badges', err);
    }
  };

  useEffect(() => {
    loadCounts();
  }, [currentSection]);

  const handleResetData = async () => {
    if (
      window.confirm(
        'Reset NILMA VA Real Estate database to original sample records? All custom properties, leads, and settlements will be reseeded.'
      )
    ) {
      repository.resetToDefaults();
      await refreshOrganization();
      await loadCounts();
      showToast('Database successfully restored to default sample records.', 'success');
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen bg-brand-ivory text-brand-charcoal overflow-hidden font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onNavigate={onNavigate}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        badgeCounts={badgeCounts}
      />

      {/* Main Body Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopHeader
          currentSection={currentSection}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          onOpenQuickAdd={onOpenQuickAdd}
          globalSearch={globalSearch}
          onGlobalSearchChange={setGlobalSearch}
          onResetData={handleResetData}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
