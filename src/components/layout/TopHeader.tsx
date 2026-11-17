import React from 'react';
import { Menu, Search, Plus, ShieldCheck, Building } from 'lucide-react';
import { NavigationSection } from '../../types/database';

interface TopHeaderProps {
  currentSection: NavigationSection;
  onOpenMobileMenu: () => void;
  onOpenQuickAdd: (type?: string) => void;
  globalSearch: string;
  onGlobalSearchChange: (query: string) => void;
  onResetData: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentSection,
  onOpenMobileMenu,
  onOpenQuickAdd,
  globalSearch,
  onGlobalSearchChange,
  onResetData,
}) => {
  const sectionTitles: Record<NavigationSection, { group: string; title: string; subtitle: string }> = {
    // Overview
    dashboard: { group: 'Overview', title: 'Executive Dashboard', subtitle: 'Command Cockpit & High-Level KPIs' },
    today: { group: 'Overview', title: 'Today Command Center', subtitle: "Daily Showings, Milestones & Action Queue" },
    calendar: { group: 'Overview', title: 'Operational Calendar', subtitle: 'Interactive Month & Week Schedule' },
    tasks: { group: 'Overview', title: 'Tasks & Compliance', subtitle: 'Escrow Contingencies & Action Items' },

    // Clients
    leads: { group: 'Clients', title: 'Leads & Enquiries', subtitle: 'Inbound Triage & Algorithmic Heat Scores' },
    pipeline: { group: 'Clients', title: 'Lead Pipeline', subtitle: '8-Stage Opportunity Progression Kanban' },
    contacts: { group: 'Clients', title: 'Accredited Contacts', subtitle: 'Unified Multi-Role Client Database' },
    buyers: { group: 'Clients', title: 'Active Buyers', subtitle: 'Purchasing Mandates & Capital Capacity' },
    sellers: { group: 'Clients', title: 'Property Sellers', subtitle: 'Listing Clients & Vendor Portfolios' },
    renters: { group: 'Clients', title: 'Luxury Renters', subtitle: 'Lease Terms & Relocation Profiles' },
    pastclients: { group: 'Clients', title: 'Past Clients', subtitle: 'Lifetime Transaction Value & Referrals' },

    // Properties
    properties: { group: 'Properties', title: 'Master Properties', subtitle: 'Dual Dimensions (m² ↔ ft²) & Drive Folders' },
    listings: { group: 'Properties', title: 'Public Listings', subtitle: 'Active Marketing Portfolio & Price Ratios' },
    listingpipe: { group: 'Properties', title: 'Listing Pipeline', subtitle: 'Seller Progression from Valuation to Sold' },

    // Sales
    showings: { group: 'Sales', title: 'Property Showings', subtitle: 'Appointments, Client Ratings & Feedback' },
    openhouses: { group: 'Sales', title: 'Open Houses', subtitle: 'Event Coordination & Visitor Lead Capture' },
    offers: { group: 'Sales', title: 'Offer Negotiations', subtitle: 'Contractual Offers, Earnest Money & Counteroffers' },
    deals: { group: 'Sales', title: 'Deals & Closings', subtitle: 'Escrow Milestones, Document Audits & Payouts' },

    // Business
    money: { group: 'Business', title: 'Commission & Expenses', subtitle: 'Splits, P&L & Reverse Goal Planner' },
    analytics: { group: 'Business', title: 'Business Intelligence', subtitle: '8 Interactive Analytics Charts & Filters' },
    settings: { group: 'Business', title: 'Brokerage Settings', subtitle: 'Multi-Tenant Preferences & Policy' },
  };

  const current = sectionTitles[currentSection] || {
    group: 'NILMA VA',
    title: 'Real Estate OS',
    subtitle: 'Commercial Operating System',
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-xs flex flex-col shrink-0 select-none">
      {/* Top Demo Notification Strip */}
      <div className="bg-[#081c15] text-[#faf9f5] text-[11px] px-4 py-1.5 flex items-center justify-between border-b border-[#c5a059]/30">
        <div className="flex items-center space-x-2">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#c5a059] text-[#081c15] uppercase tracking-wider">
            SaaS Commercial Demo
          </span>
          <span className="hidden sm:inline text-white/80 truncate">
            NILMA VA Real Estate Business Operating System — Tenant isolation active.
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[#c5a059] flex items-center gap-1 font-semibold text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5" /> Local Persistence Active
          </span>
          <button
            onClick={onResetData}
            className="underline hover:text-[#c5a059] transition text-[10px] text-white/70"
          >
            Reset Default Data
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden text-[#1a1f1d] hover:text-[#1b4332] p-1 rounded-md"
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#c5a059]">
                {current.group}
              </span>
              <span>/</span>
              <span className="font-serif font-bold text-sm text-[#081c15]">
                {current.title}
              </span>
              <span className="hidden md:inline text-gray-300">•</span>
              <span className="hidden md:inline text-xs text-gray-500 font-medium">
                {current.subtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Search & Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Global Search */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => onGlobalSearchChange(e.target.value)}
              placeholder="Search leads, properties, deals..."
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 bg-[#faf9f5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1b4332] w-56 transition"
            />
          </div>

          {/* Quick Action: Add Lead */}
          <button
            onClick={() => onOpenQuickAdd('lead')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>

          {/* Quick Action: Add Listing */}
          <button
            onClick={() => onOpenQuickAdd('property')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#c5a059] hover:bg-[#b38f49] text-[#081c15] text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Add Listing</span>
          </button>
        </div>
      </div>
    </header>
  );
};
