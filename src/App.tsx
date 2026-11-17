import React, { useState, Suspense, lazy } from 'react';
import { OrganizationProvider, useOrganization } from './contexts/OrganizationContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { NavigationSection } from './types/database';

// Code-split pages via dynamic imports
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const TodayPage = lazy(() => import('./pages/TodayPage').then(m => ({ default: m.TodayPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })));

const LeadsPage = lazy(() => import('./pages/LeadsPage').then(m => ({ default: m.LeadsPage })));
const PipelinePage = lazy(() => import('./pages/PipelinePage').then(m => ({ default: m.PipelinePage })));
const ClientsPage = lazy(() => import('./pages/ClientsPage').then(m => ({ default: m.ClientsPage })));

const PropertiesPage = lazy(() => import('./pages/PropertiesPage').then(m => ({ default: m.PropertiesPage })));
const ListingPipelinePage = lazy(() => import('./pages/ListingPipelinePage').then(m => ({ default: m.ListingPipelinePage })));

const ViewingsPage = lazy(() => import('./pages/ViewingsPage').then(m => ({ default: m.ViewingsPage })));
const OpenHousesPage = lazy(() => import('./pages/OpenHousesPage').then(m => ({ default: m.OpenHousesPage })));
const OffersPage = lazy(() => import('./pages/OffersPage').then(m => ({ default: m.OffersPage })));

const FinancialsPage = lazy(() => import('./pages/FinancialsPage').then(m => ({ default: m.FinancialsPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const AgentsPage = lazy(() => import('./pages/AgentsPage').then(m => ({ default: m.AgentsPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

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
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="w-8 h-8 border-3 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          {renderCurrentSection()}
        </Suspense>
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
