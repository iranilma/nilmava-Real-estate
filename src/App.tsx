import React, { useState } from 'react';
import { OrganizationProvider, useOrganization } from './contexts/OrganizationContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { NavigationSection } from './types/database';

// Phase 3 Overview & Operational Pages
import { DashboardPage } from './pages/DashboardPage';
import { TodayPage } from './pages/TodayPage';
import { CalendarPage } from './pages/CalendarPage';
import { TasksPage } from './pages/TasksPage';

// Phase 3 Clients & Pipeline Pages
import { LeadsPage } from './pages/LeadsPage';
import { PipelinePage } from './pages/PipelinePage';
import { ClientsPage } from './pages/ClientsPage';

// Phase 3 Properties & Seller Pipeline Pages
import { PropertiesPage } from './pages/PropertiesPage';
import { ListingPipelinePage } from './pages/ListingPipelinePage';

// Phase 3 Sales & Transactions Pages
import { ViewingsPage } from './pages/ViewingsPage';
import { OpenHousesPage } from './pages/OpenHousesPage';
import { OffersPage } from './pages/OffersPage';

// Phase 3 Business Intelligence & Brokerage Administration Pages
import { FinancialsPage } from './pages/FinancialsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AgentsPage } from './pages/AgentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

// Global Quick Modals
import { LeadModal } from './components/modals/LeadModal';
import { PropertyModal } from './components/modals/PropertyModal';

const AppContent: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<NavigationSection>('dashboard');
  const [isQuickLeadOpen, setIsQuickLeadOpen] = useState(false);
  const [isQuickPropertyOpen, setIsQuickPropertyOpen] = useState(false);

  const { agents, organization, saveLead, saveProperty } = useOrganization();
  const { showToast } = useToast();

  const handleOpenQuickAdd = (type?: string) => {
    if (type === 'lead') {
      setIsQuickLeadOpen(true);
    } else if (type === 'property') {
      setIsQuickPropertyOpen(true);
    } else {
      setIsQuickLeadOpen(true);
    }
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      // 1. OVERVIEW GROUP
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={setCurrentSection}
            onOpenQuickAdd={handleOpenQuickAdd}
          />
        );
      case 'today':
        return (
          <TodayPage
            onNavigate={setCurrentSection}
            onOpenQuickAdd={handleOpenQuickAdd}
          />
        );
      case 'calendar':
        return <CalendarPage />;
      case 'tasks':
        return <TasksPage />;

      // 2. CLIENTS GROUP
      case 'leads':
        return <LeadsPage />;
      case 'pipeline':
        return <PipelinePage />;
      case 'contacts':
        return (
          <ClientsPage
            pageTitle="Accredited Client Registry"
            pageSubtitle="Unified database of prospective buyers, verified sellers, and luxury investors."
          />
        );
      case 'buyers':
        return (
          <ClientsPage
            initialType="Buyer"
            pageTitle="Active Buyers & Acquisition Mandates"
            pageSubtitle="Verified buyers actively searching for luxury residential and investment assets."
          />
        );
      case 'sellers':
        return (
          <ClientsPage
            initialType="Seller"
            pageTitle="Property Owners & Representation"
            pageSubtitle="Mandated property owners, developers, and asset holders."
          />
        );
      case 'renters':
        return (
          <ClientsPage
            initialType="Tenant"
            pageTitle="Luxury Renters & Corporate Leases"
            pageSubtitle="Executive tenants seeking high-end furnished long-term tenancies."
          />
        );
      case 'pastclients':
        return (
          <ClientsPage
            initialStatus="Past Client"
            pageTitle="Past Clients & Referral Network"
            pageSubtitle="Alumni of successfully settled transactions and active referral advocates."
          />
        );

      // 3. PROPERTIES GROUP
      case 'properties':
        return (
          <PropertiesPage
            pageTitle="Complete Portfolio Inventory"
            pageSubtitle="All agency mandates, available listings, pending offers, and archived records."
          />
        );
      case 'listings':
        return (
          <PropertiesPage
            defaultStatus="Available"
            pageTitle="Active Market Listings"
            pageSubtitle="Exclusively marketed luxury listings available for private viewing."
          />
        );
      case 'listingpipe':
        return <ListingPipelinePage />;

      // 4. SALES GROUP
      case 'showings':
        return <ViewingsPage />;
      case 'openhouses':
        return <OpenHousesPage />;
      case 'offers':
        return <OffersPage />;
      case 'deals':
        return <PipelinePage />;

      // 5. BUSINESS GROUP
      case 'money':
        return <FinancialsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;

      // LEGACY ALIASES & DEFAULTS
      case ('overview' as any):
        return (
          <DashboardPage
            onNavigate={setCurrentSection}
            onOpenQuickAdd={handleOpenQuickAdd}
          />
        );
      case ('clients' as any):
        return <ClientsPage />;
      case ('viewings' as any):
        return <ViewingsPage />;
      case ('financials' as any):
        return <FinancialsPage />;
      case ('reports' as any):
        return <ReportsPage />;
      case ('agents' as any):
        return <AgentsPage />;

      default:
        return (
          <DashboardPage
            onNavigate={setCurrentSection}
            onOpenQuickAdd={handleOpenQuickAdd}
          />
        );
    }
  };

  return (
    <>
      <AppShell
        currentSection={currentSection}
        onNavigate={setCurrentSection}
        onOpenQuickAdd={handleOpenQuickAdd}
      >
        {renderCurrentSection()}
      </AppShell>

      {/* Global Quick Add Modals */}
      <LeadModal
        isOpen={isQuickLeadOpen}
        onClose={() => setIsQuickLeadOpen(false)}
        onSave={async (leadData) => {
          await saveLead(leadData);
          showToast(`Lead for ${leadData.name} registered successfully.`, 'success');
        }}
        agents={agents}
      />

      <PropertyModal
        isOpen={isQuickPropertyOpen}
        onClose={() => setIsQuickPropertyOpen(false)}
        onSave={async (propData) => {
          await saveProperty(propData);
          showToast(`Listing ${propData.title} added to portfolio.`, 'success');
        }}
        agents={agents}
        defaultUnit={organization?.default_measurement_unit || 'sqm'}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <OrganizationProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </OrganizationProvider>
  );
};

export default App;
