import React from 'react';
import {
  DollarSign,
  Calendar,
  CheckSquare,
  ArrowRight,
  Flame,
  Target,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { NavigationSection } from '../types/database';

interface DashboardPageProps {
  onNavigate: (section: NavigationSection) => void;
  onOpenQuickAdd: (type?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenQuickAdd: _onOpenQuickAdd }) => {
  const {
    organization,
    properties,
    leads,
    deals,
    clients,
    transactions,
    viewings,
    tasks,
    offers,
    expenses,
    toggleTaskCompleted,
  } = useOrganization();

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Section A: Business KPIs
  const activeLeads = leads.filter((l) => l.status !== 'Closed Won' && l.status !== 'Lost').length;
  const activeBuyers = clients.filter((c) => c.client_type === 'Buyer').length;
  const activeSellers = clients.filter((c) => c.client_type === 'Seller').length;
  const activeListings = properties.filter((p) => p.status === 'Available').length;
  const showingsThisWeek = viewings.filter((v) => v.status === 'Scheduled').length;
  const activeOffers = offers.filter((o) => o.status === 'Submitted' || o.status === 'Countered').length;
  const underContractProps = properties.filter((p) => p.status === 'Under Offer').length;
  const closingsThisMonth = transactions.filter((t) => t.closing_date.startsWith('2026-11') || t.closing_date.startsWith('2026-10')).length;

  // Section B: Financial Performance
  const closedVolume = transactions.reduce((sum, t) => sum + t.sale_price, 0);
  const grossCommission = transactions.reduce((sum, t) => sum + t.gross_commission, 0);
  const agencyNet = transactions.reduce((sum, t) => sum + t.agency_share, 0);
  const agentPayouts = transactions.reduce((sum, t) => sum + t.agent_share, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netOperatingProfit = agencyNet - totalExpenses;
  const pendingCommission = deals
    .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + d.deal_value * 0.05 * 0.5, 0);

  const annualTarget = organization?.annual_sales_target || 30000000;
  const targetPct = Math.min(100, Math.round((closedVolume / annualTarget) * 100));
  const remainingTarget = Math.max(0, annualTarget - closedVolume);

  // Hot Leads
  const hotLeads = leads
    .filter((l) => l.heat_score >= 70 && l.status !== 'Closed Won' && l.status !== 'Lost')
    .sort((a, b) => b.heat_score - a.heat_score)
    .slice(0, 4);

  // Upcoming Closings
  const upcomingDeals = deals
    .filter((d) => d.stage === 'negotiation' || d.stage === 'offer_accepted')
    .slice(0, 4);

  // Urgent Tasks
  const urgentTasks = tasks.filter((t) => !t.is_completed).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* 1. Executive Greeting & Goal Progress Hero */}
      <div className="bg-gradient-to-r from-[#081c15] via-[#1b4332] to-[#2d6a4f] text-white p-6 md:p-8 rounded-3xl shadow-lg border border-[#c5a059]/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#c5a059] text-[#081c15] uppercase tracking-wider">
              Executive Cockpit
            </span>
            <span className="text-white/60 text-xs">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
            {greeting}, Marcus
          </h1>
          <p className="text-xs md:text-sm text-white/80 leading-relaxed">
            Welcome to the NILMA VA agency command center. You have <strong className="text-[#c5a059]">{showingsThisWeek} showings</strong> scheduled this week, <strong className="text-[#c5a059]">{activeOffers} active offers</strong> under negotiation, and <strong className="text-white">${(closedVolume / 1000000).toFixed(1)}M</strong> in closed volume year-to-date.
          </p>
        </div>

        {/* Annual Target Widget */}
        <div className="bg-black/30 backdrop-blur-xs p-5 rounded-2xl border border-white/10 flex items-center space-x-5 w-full lg:w-auto shrink-0">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/20"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#c5a059]"
                strokeDasharray={`${targetPct}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-serif font-bold text-sm text-[#c5a059]">
              {targetPct}%
            </span>
          </div>
          <div className="space-y-0.5 text-xs">
            <p className="text-white/60 font-medium uppercase tracking-wider text-[10px]">
              Annual Sales Goal
            </p>
            <p className="font-serif font-bold text-base text-white">
              ${(closedVolume / 1000000).toFixed(1)}M{' '}
              <span className="text-white/40 font-sans text-xs">/ ${(annualTarget / 1000000).toFixed(0)}M</span>
            </p>
            <p className="text-[11px] text-[#c5a059]">
              ${(remainingTarget / 1000000).toFixed(1)}M to target
            </p>
          </div>
        </div>
      </div>

      {/* 2. Section A: Business Performance KPIs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold tracking-widest text-[#c5a059] uppercase flex items-center space-x-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>Commercial Operations Scorecard</span>
          </h2>
          <button
            onClick={() => onNavigate('pipeline')}
            className="text-xs text-[#1b4332] font-semibold hover:underline flex items-center space-x-1"
          >
            <span>Open Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active Leads</span>
            <p className="text-xl font-serif font-bold text-[#081c15] mt-2">{activeLeads}</p>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1">Inbound funnel</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active Buyers</span>
            <p className="text-xl font-serif font-bold text-[#081c15] mt-2">{activeBuyers}</p>
            <span className="text-[10px] text-blue-700 font-semibold mt-1">Acquisitions</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active Sellers</span>
            <p className="text-xl font-serif font-bold text-[#081c15] mt-2">{activeSellers}</p>
            <span className="text-[10px] text-purple-700 font-semibold mt-1">Vendors</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Available Estates</span>
            <p className="text-xl font-serif font-bold text-[#081c15] mt-2">{activeListings}</p>
            <span className="text-[10px] text-gray-400 font-semibold mt-1">Portfolio</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Showings Week</span>
            <p className="text-xl font-serif font-bold text-[#1b4332] mt-2">{showingsThisWeek}</p>
            <span className="text-[10px] text-[#c5a059] font-semibold mt-1">Scheduled</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active Offers</span>
            <p className="text-xl font-serif font-bold text-amber-700 mt-2">{activeOffers}</p>
            <span className="text-[10px] text-amber-700 font-semibold mt-1">Negotiating</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Under Contract</span>
            <p className="text-xl font-serif font-bold text-indigo-700 mt-2">{underContractProps}</p>
            <span className="text-[10px] text-indigo-700 font-semibold mt-1">Escrow open</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Settled Deals</span>
            <p className="text-xl font-serif font-bold text-emerald-800 mt-2">{closingsThisMonth}</p>
            <span className="text-[10px] text-emerald-700 font-semibold mt-1">Closed Won</span>
          </div>
        </div>
      </div>

      {/* 3. Section B: Financial Performance Scorecard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold tracking-widest text-[#1b4332] uppercase flex items-center space-x-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Financial Settlements & Profit Statement</span>
          </h2>
          <button
            onClick={() => onNavigate('money')}
            className="text-xs text-[#1b4332] font-semibold hover:underline flex items-center space-x-1"
          >
            <span>Commission & P&L Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-[#faf9f5] p-4 rounded-2xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Gross Volume</span>
            <p className="text-lg font-serif font-bold text-[#081c15] mt-1">${(closedVolume / 1000000).toFixed(2)}M</p>
            <span className="text-[9px] text-gray-400">Total settled sales</span>
          </div>

          <div className="bg-[#faf9f5] p-4 rounded-2xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Gross Comm</span>
            <p className="text-lg font-serif font-bold text-[#1b4332] mt-1">${(grossCommission / 1000).toFixed(0)}k</p>
            <span className="text-[9px] text-[#c5a059]">5.0% Standard fee</span>
          </div>

          <div className="bg-[#faf9f5] p-4 rounded-2xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Agency Share</span>
            <p className="text-lg font-serif font-bold text-[#081c15] mt-1">${(agencyNet / 1000).toFixed(0)}k</p>
            <span className="text-[9px] text-gray-500">50% Retained</span>
          </div>

          <div className="bg-[#faf9f5] p-4 rounded-2xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Broker Payouts</span>
            <p className="text-lg font-serif font-bold text-emerald-700 mt-1">${(agentPayouts / 1000).toFixed(0)}k</p>
            <span className="text-[9px] text-gray-500">50% Disbursed</span>
          </div>

          <div className="bg-[#faf9f5] p-4 rounded-2xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Operating Overhead</span>
            <p className="text-lg font-serif font-bold text-rose-700 mt-1">${(totalExpenses / 1000).toFixed(1)}k</p>
            <span className="text-[9px] text-rose-600">Facility & Legal</span>
          </div>

          <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase">Net Profit</span>
            <p className="text-lg font-serif font-bold text-emerald-950 mt-1">${(netOperatingProfit / 1000).toFixed(0)}k</p>
            <span className="text-[9px] text-emerald-700 font-bold">P&L Operating Net</span>
          </div>

          <div className="bg-[#faf9f5] p-4 rounded-2xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Pending Comm</span>
            <p className="text-lg font-serif font-bold text-amber-700 mt-1">${(pendingCommission / 1000).toFixed(0)}k</p>
            <span className="text-[9px] text-amber-700">In Pipeline</span>
          </div>

          <div className="bg-[#faf9f5] p-4 rounded-2xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Goal Progress</span>
            <p className="text-lg font-serif font-bold text-[#1b4332] mt-1">{targetPct}%</p>
            <span className="text-[9px] text-[#c5a059] font-bold">On pace</span>
          </div>
        </div>
      </div>

      {/* 4. Triage Columns: Hot Leads, Upcoming Closings, Urgent Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Priority Hot Leads */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-[#081c15] flex items-center space-x-2">
              <Flame className="w-4 h-4 text-red-600" />
              <span>Priority High-Heat Leads</span>
            </h3>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs text-[#1b4332] font-semibold hover:underline"
            >
              View All ({leads.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {hotLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-3 bg-[#faf9f5] rounded-xl border border-gray-100 flex items-center justify-between text-xs hover:border-[#c5a059]/40 transition"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-[#081c15]">{lead.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-700">
                      🔥 {lead.heat_score}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    ${(lead.budget_max || 0).toLocaleString()} • {lead.source}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('leads')}
                  className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Triage
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Upcoming Deal Closings */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-[#081c15] flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#c5a059]" />
              <span>Upcoming Closings & Deals</span>
            </h3>
            <button
              onClick={() => onNavigate('deals')}
              className="text-xs text-[#1b4332] font-semibold hover:underline"
            >
              Pipeline
            </button>
          </div>

          <div className="space-y-2.5">
            {upcomingDeals.map((deal) => (
              <div
                key={deal.id}
                className="p-3 bg-[#faf9f5] rounded-xl border border-gray-100 flex items-center justify-between text-xs hover:border-[#c5a059]/40 transition"
              >
                <div>
                  <p className="font-bold text-[#081c15] line-clamp-1">{deal.title}</p>
                  <p className="text-[11px] text-[#1b4332] font-semibold mt-0.5">
                    ${deal.deal_value.toLocaleString()} • {deal.stage === 'offer_accepted' ? 'Offer Accepted' : 'In Negotiation'}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-gray-400">
                  {deal.probability_pct}% prob
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Daily Action Items & Escrow Deadlines */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-[#081c15] flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-[#1b4332]" />
              <span>Urgent Tasks & Deadlines</span>
            </h3>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-[#1b4332] font-semibold hover:underline"
            >
              View Queue
            </button>
          </div>

          <div className="space-y-2.5">
            {urgentTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 bg-[#faf9f5] rounded-xl border border-gray-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-start space-x-2.5">
                  <input
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={() => toggleTaskCompleted(task.id)}
                    className="mt-0.5 rounded text-[#1b4332] focus:ring-[#1b4332]"
                  />
                  <div>
                    <p className="font-semibold text-[#081c15] line-clamp-1">{task.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Due: {task.due_date} • {task.category}</p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
