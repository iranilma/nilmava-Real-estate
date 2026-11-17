import React, { useState } from 'react';
import {
  Printer,
  DollarSign,
  Award,
  PieChart,
  BarChart2,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';

export const ReportsPage: React.FC = () => {
  const { organization, agents, leads, deals, transactions, expenses } =
    useOrganization();
  const [selectedPeriod, setSelectedPeriod] = useState<'ytd' | 'q1' | 'all'>('ytd');

  // Sales Volume & Revenue
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.sale_price, 0);
  const totalGrossCommission = transactions.reduce((sum, tx) => sum + tx.gross_commission, 0);
  const totalAgencyRetained = transactions.reduce((sum, tx) => sum + tx.agency_share, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netOperatingProfit = totalAgencyRetained - totalExpenses;
  const netMarginPct =
    totalAgencyRetained > 0
      ? ((netOperatingProfit / totalAgencyRetained) * 100).toFixed(1)
      : '0.0';

  // Lead Conversion Stats
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === 'Closed Won').length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0';

  // Lead Sources breakdown
  const sourcesCount: Record<string, number> = {};
  leads.forEach((l) => {
    sourcesCount[l.source] = (sourcesCount[l.source] || 0) + 1;
  });

  // Broker Leaderboard
  const brokerStats = agents.map((agent) => {
    const closedTxs = transactions.filter(
      (tx) => tx.agent_id === agent.id || tx.agent_name_snapshot === agent.name
    );
    const volume = closedTxs.reduce((sum, tx) => sum + tx.sale_price, 0);
    const comm = closedTxs.reduce((sum, tx) => sum + tx.agent_share, 0);
    const quotaPct = Math.round((volume / (agent.annual_quota || 3000000)) * 100);

    return {
      agent,
      dealsCount: closedTxs.length,
      volume,
      comm,
      quotaPct,
    };
  });

  brokerStats.sort((a, b) => b.volume - a.volume);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Print Actions */}
      <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold font-serif text-[#081c15]">
              Executive Business Intelligence & Performance Report
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1b4332]/10 text-[#1b4332] uppercase">
              Confidential
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Agency P&L statement, broker quota attainment rankings, inventory turnover, and conversion telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
          >
            <option value="ytd">Year-to-Date (FY 2026)</option>
            <option value="q1">Q1 Performance</option>
            <option value="all">Lifetime History</option>
          </select>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#2d6a4f] transition-all shadow-sm flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Document Header (Visible in print) */}
        <div className="border-b border-gray-200 pb-6 flex items-start justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#c5a059] font-bold">
              Agency Performance Statement
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#081c15] mt-1">
              {organization?.name || 'NILMA VA Real Estate'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })} • Base Currency: {organization?.currency || 'USD ($)'}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-[#081c15] text-[#c5a059] rounded-lg text-xs font-mono font-bold">
              FY-2026-REPORT
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Audited Financial Snapshot</p>
          </div>
        </div>

        {/* 1. Executive Financial Summary */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#1b4332] flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-[#c5a059]" />
            <span>1. Executive Financial Summary & P&L Analysis</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#faf9f5] border border-gray-200">
              <p className="text-[11px] font-semibold text-gray-500 uppercase">Gross Transaction Volume</p>
              <p className="text-xl font-bold font-serif text-[#081c15] mt-1">
                ${totalVolume.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{transactions.length} Closed Settlements</p>
            </div>

            <div className="p-4 rounded-xl bg-[#faf9f5] border border-gray-200">
              <p className="text-[11px] font-semibold text-gray-500 uppercase">Gross Commission Total</p>
              <p className="text-xl font-bold font-serif text-[#1b4332] mt-1">
                ${totalGrossCommission.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Avg Rate: {organization?.default_commission_rate || 5.0}%</p>
            </div>

            <div className="p-4 rounded-xl bg-[#faf9f5] border border-gray-200">
              <p className="text-[11px] font-semibold text-gray-500 uppercase">Agency Retained Share</p>
              <p className="text-xl font-bold font-serif text-[#081c15] mt-1">
                ${totalAgencyRetained.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{organization?.agency_split_pct || 50}% Contractual Split</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <p className="text-[11px] font-semibold text-emerald-800 uppercase">Net Operating Profit</p>
              <p className="text-xl font-bold font-serif text-emerald-900 mt-1">
                ${netOperatingProfit.toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Margin: {netMarginPct}%</p>
            </div>
          </div>
        </div>

        {/* 2. Broker Attainment Rankings */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#1b4332] flex items-center space-x-2">
            <Award className="w-4 h-4 text-[#c5a059]" />
            <span>2. Advisory Broker Production & Quota Attainment</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b">
                  <th className="py-2.5 px-4">Rank / Broker</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4 text-center">Settlements</th>
                  <th className="py-2.5 px-4">Closed Sales Volume</th>
                  <th className="py-2.5 px-4">Broker Commissions</th>
                  <th className="py-2.5 px-4 text-right">Quota Attainment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {brokerStats.map((item, idx) => (
                  <tr key={item.agent.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900 flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#081c15]">{item.agent.name}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.agent.role}</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-800">
                      {item.dealsCount}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#081c15]">
                      ${item.volume.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-emerald-700">
                      ${item.comm.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#1b4332]">
                      {item.quotaPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Lead Conversion & Channel Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl border border-gray-200 bg-[#faf9f5] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#081c15] flex items-center space-x-1.5">
              <PieChart className="w-4 h-4 text-[#c5a059]" />
              <span>Inbound Acquisition Channels</span>
            </h4>
            <div className="space-y-2 text-xs">
              {Object.entries(sourcesCount).map(([src, count]) => {
                const pct = Math.round((count / totalLeads) * 100);
                return (
                  <div key={src}>
                    <div className="flex justify-between font-medium text-gray-700 mb-1">
                      <span>{src}</span>
                      <span>{count} leads ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-[#1b4332] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-gray-200 bg-[#faf9f5] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#081c15] flex items-center space-x-1.5">
              <BarChart2 className="w-4 h-4 text-[#c5a059]" />
              <span>Conversion Funnel Health</span>
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-gray-100">
                <span className="text-gray-600">Total Leads Registered</span>
                <span className="font-bold text-gray-900">{totalLeads}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-gray-100">
                <span className="text-gray-600">Active Deals in Negotiation</span>
                <span className="font-bold text-[#1b4332]">
                  {deals.filter((d) => d.stage === 'negotiation' || d.stage === 'offer_accepted').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-gray-100">
                <span className="text-gray-600">Won Client Conversions</span>
                <span className="font-bold text-emerald-700">{wonLeads} ({conversionRate}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Audit Sign-Off */}
        <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-400">
          <p>© 2026 NILMA VA Real Estate • Multi-Tenant SaaS Platform • Certified Real Estate ERP</p>
          <p>CONFIDENTIAL & PROPRIETARY • FOR INTERNAL GOVERNANCE ONLY</p>
        </div>
      </div>
    </div>
  );
};
