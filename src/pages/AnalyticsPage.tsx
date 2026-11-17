import React, { useState } from 'react';
import {
  PieChart,
  Target,
  DollarSign,
  Printer,
  Eye,
  Building,
  Award,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';

type DateFilter = 'this_month' | 'last_month' | 'last_3m' | 'last_6m' | 'ytd' | 'all';

export const AnalyticsPage: React.FC = () => {
  const {
    organization,
    transactions,
    leads,
    deals,
    properties,
    agents,
    viewings,
    offers,
  } = useOrganization();

  const [dateFilter, setDateFilter] = useState<DateFilter>('ytd');

  // Filter transactions based on date
  const filteredTxs = transactions.filter((tx) => {
    if (dateFilter === 'this_month') return tx.closing_date.startsWith('2026-11');
    if (dateFilter === 'last_month') return tx.closing_date.startsWith('2026-10');
    if (dateFilter === 'last_3m') return tx.closing_date >= '2026-08-01';
    if (dateFilter === 'last_6m') return tx.closing_date >= '2026-05-01';
    if (dateFilter === 'ytd') return tx.closing_date.startsWith('2026');
    return true;
  });

  // 1. Monthly Sales Performance (12 months data)
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = monthLabels.map((lbl, idx) => {
    const monthStr = `2026-${String(idx + 1).padStart(2, '0')}`;
    const txsInMonth = transactions.filter((t) => t.closing_date.startsWith(monthStr));
    const vol = txsInMonth.reduce((sum, t) => sum + t.sale_price, 0);
    const comm = txsInMonth.reduce((sum, t) => sum + t.gross_commission, 0);
    const agency = txsInMonth.reduce((sum, t) => sum + t.agency_share, 0);
    return { label: lbl, volume: vol, grossComm: comm, agencyComm: agency };
  });

  const maxMonthlyVol = Math.max(1, ...monthlyData.map((d) => d.volume));

  // 2. Lead Pipeline Funnel
  const stagesList = [
    { key: 'New', count: leads.filter((l) => l.status === 'New').length },
    { key: 'Contacted', count: leads.filter((l) => l.status === 'Contacted').length },
    { key: 'Qualified', count: leads.filter((l) => l.status === 'Qualified').length },
    { key: 'Viewing Scheduled', count: leads.filter((l) => l.status === 'Viewing Scheduled').length },
    { key: 'Negotiation', count: leads.filter((l) => l.status === 'Negotiation').length },
    { key: 'Closed Won', count: leads.filter((l) => l.status === 'Closed Won').length },
  ];
  const maxStageCount = Math.max(1, ...stagesList.map((s) => s.count));

  // 3. Lead Sources Distribution
  const sourcesMap: Record<string, number> = {};
  leads.forEach((l) => {
    sourcesMap[l.source] = (sourcesMap[l.source] || 0) + 1;
  });

  // 4. Property Portfolio Distribution
  const propStatusMap: Record<string, number> = {
    Available: properties.filter((p) => p.status === 'Available').length,
    'Under Offer': properties.filter((p) => p.status === 'Under Offer').length,
    Sold: properties.filter((p) => p.status === 'Sold').length,
    'Off Market': properties.filter((p) => p.status === 'Off Market').length,
  };

  // 5. Agent Leaderboard
  const agentLeaderboard = agents.map((agent) => {
    const agentTxs = transactions.filter((t) => t.agent_id === agent.id || t.agent_name_snapshot === agent.name);
    const vol = agentTxs.reduce((sum, t) => sum + t.sale_price, 0);
    const comm = agentTxs.reduce((sum, t) => sum + t.agent_share, 0);
    const oppsCount = deals.filter((d) => d.assigned_agent_id === agent.id).length;
    const attainment = Math.round((vol / (agent.annual_quota || 3000000)) * 100);
    return { agent, vol, comm, oppsCount, attainment };
  }).sort((a, b) => b.vol - a.vol);

  // 6. Commission Performance Totals
  const totalGrossCommission = filteredTxs.reduce((sum, t) => sum + t.gross_commission, 0);
  const totalAgencyRetained = filteredTxs.reduce((sum, t) => sum + t.agency_share, 0);
  const totalAgentPayouts = filteredTxs.reduce((sum, t) => sum + t.agent_share, 0);

  // 7. Showings and Conversion
  const totalShowings = viewings.length;
  const completedShowings = viewings.filter((v) => v.status === 'Completed').length;
  const offersGenerated = offers.length;
  const dealsClosed = transactions.length;
  const showingToOfferRatio = totalShowings > 0 ? ((offersGenerated / totalShowings) * 100).toFixed(1) : '0';

  // 8. Revenue & Goal Tracking
  const annualTarget = organization?.annual_sales_target || 30000000;
  const currentSales = transactions.reduce((sum, t) => sum + t.sale_price, 0);
  const remainingTarget = Math.max(0, annualTarget - currentSales);
  const targetPct = Math.min(100, Math.round((currentSales / annualTarget) * 100));

  const pipelineWeightedVal = deals
    .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + d.deal_value * (d.probability_pct / 100), 0);
  const projectedRevenue = currentSales + pipelineWeightedVal;

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter Bar */}
      <div className="bg-white p-6 rounded-3xl border border-[#c5a059]/20 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-serif font-bold text-[#081c15]">
              Business Intelligence & Analytics Cockpit
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1b4332]/10 text-[#1b4332]">
              Live Database Telemetry
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time interactive multi-metric charts for sales velocity, conversion funnels, broker attainment, and revenue projections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['this_month', 'last_month', 'last_3m', 'last_6m', 'ytd', 'all'] as DateFilter[]).map((period) => (
            <button
              key={period}
              onClick={() => setDateFilter(period)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                dateFilter === period
                  ? 'bg-[#1b4332] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period === 'this_month'
                ? 'This Month'
                : period === 'last_month'
                ? 'Last Month'
                : period === 'last_3m'
                ? 'Last 3M'
                : period === 'last_6m'
                ? 'Last 6M'
                : period === 'ytd'
                ? 'Year to Date'
                : 'All History'}
            </button>
          ))}
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 ml-1"
            title="Print Analytics Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: 8 Core Required Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Monthly Sales & Commission Performance */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#081c15]">
                1. Monthly Sales Volume & Commission Trend
              </h3>
              <p className="text-[11px] text-gray-400">Closed sales volume vs. retained agency share (FY 2026)</p>
            </div>
            <span className="text-xs font-bold text-[#1b4332]">
              ${(currentSales / 1000000).toFixed(1)}M Total
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div className="pt-4">
            <div className="flex items-end space-x-2 h-48 border-b border-gray-200 pb-2">
              {monthlyData.map((m) => {
                const heightPct = maxMonthlyVol > 0 ? Math.round((m.volume / maxMonthlyVol) * 100) : 0;
                return (
                  <div key={m.label} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-12 bg-[#081c15] text-white text-[10px] p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-20 whitespace-nowrap shadow-md">
                      <p className="font-bold">{m.label} 2026</p>
                      <p>Vol: ${(m.volume / 1000000).toFixed(2)}M</p>
                      <p className="text-[#c5a059]">Agency: ${(m.agencyComm / 1000).toFixed(0)}k</p>
                    </div>

                    <div className="w-full flex items-end justify-center space-x-0.5 h-full">
                      <div
                        className="w-full bg-gradient-to-t from-[#1b4332] to-[#2d6a4f] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                        style={{ height: `${Math.max(4, heightPct)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 mt-2">{m.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 pt-2 font-mono">
              <span>$0</span>
              <span>Max: ${(maxMonthlyVol / 1000000).toFixed(1)}M</span>
            </div>
          </div>
        </div>

        {/* CHART 2: Lead Pipeline Funnel */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#081c15]">
                2. Lead Conversion Pipeline Funnel
              </h3>
              <p className="text-[11px] text-gray-400">Progression and attrition from initial enquiry to closed won</p>
            </div>
            <span className="text-xs font-bold text-emerald-700">
              {leads.length} Total Inbound
            </span>
          </div>

          <div className="space-y-2.5 pt-2">
            {stagesList.map((st) => {
              const widthPct = Math.round((st.count / maxStageCount) * 100);
              return (
                <div key={st.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>{st.key}</span>
                    <span>{st.count} leads</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-[#1b4332] to-[#c5a059] rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(6, widthPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 3: Inbound Lead Sources */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#081c15]">
                3. Lead Acquisition Sources Breakdown
              </h3>
              <p className="text-[11px] text-gray-400">Channel ROI and client origin telemetry</p>
            </div>
            <PieChart className="w-4 h-4 text-[#c5a059]" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {Object.entries(sourcesMap).map(([src, count]) => {
              const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
              return (
                <div key={src} className="p-3 bg-[#faf9f5] rounded-xl border border-gray-200 text-xs">
                  <div className="flex justify-between font-bold text-[#081c15]">
                    <span>{src}</span>
                    <span className="text-[#1b4332]">{pct}%</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">{count} verified leads</p>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#1b4332] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 4: Property Portfolio Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#081c15]">
                4. Property Portfolio Status Distribution
              </h3>
              <p className="text-[11px] text-gray-400">Inventory allocation across luxury estate portfolio</p>
            </div>
            <Building className="w-4 h-4 text-[#1b4332]" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {Object.entries(propStatusMap).map(([status, count]) => {
              const pct = properties.length > 0 ? Math.round((count / properties.length) * 100) : 0;
              return (
                <div key={status} className="p-3 bg-[#faf9f5] rounded-xl border border-gray-200 text-xs">
                  <div className="flex justify-between font-bold text-[#081c15]">
                    <span>{status}</span>
                    <span className="text-[#c5a059]">{pct}%</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">{count} properties</p>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        status === 'Available' ? 'bg-[#1b4332]' : status === 'Sold' ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 5: Agent Leaderboard & Attainment */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#081c15]">
                5. Broker Sales Volume Leaderboard
              </h3>
              <p className="text-[11px] text-gray-400">Closed sales volume and annual quota attainment</p>
            </div>
            <Award className="w-4 h-4 text-[#c5a059]" />
          </div>

          <div className="space-y-3 pt-1">
            {agentLeaderboard.slice(0, 4).map((item, idx) => (
              <div key={item.agent.id} className="p-3 bg-[#faf9f5] rounded-xl border border-gray-100 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full bg-gray-200 font-bold text-[9px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[#081c15]">{item.agent.name}</span>
                  </div>
                  <span className="font-bold text-[#1b4332]">${(item.vol / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Quota: {item.attainment}%</span>
                  <span className="text-emerald-700 font-semibold">${item.comm.toLocaleString()} earned</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1b4332] rounded-full" style={{ width: `${Math.min(100, item.attainment)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 6: Commission Performance & Splits */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#081c15]">
                6. Commission Performance & 50/50 Splits
              </h3>
              <p className="text-[11px] text-gray-400">Gross revenue vs retained agency share vs broker payouts</p>
            </div>
            <DollarSign className="w-4 h-4 text-[#1b4332]" />
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-emerald-800 uppercase font-semibold">Total Gross Commission</p>
                <p className="text-xl font-serif font-bold text-emerald-950 mt-1">
                  ${totalGrossCommission.toLocaleString()}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg">
                5.0% Standard
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#faf9f5] rounded-xl border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Agency Share (50%)</p>
                <p className="text-base font-bold text-[#081c15] mt-1">${totalAgencyRetained.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-[#faf9f5] rounded-xl border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Broker Payouts (50%)</p>
                <p className="text-base font-bold text-[#081c15] mt-1">${totalAgentPayouts.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 7: Showings & Conversion */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#081c15]">
                7. Showings to Offer Conversion Velocity
              </h3>
              <p className="text-[11px] text-gray-400">Funnel conversion from private showings to formal contracts</p>
            </div>
            <Eye className="w-4 h-4 text-[#c5a059]" />
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
            <div className="p-3 bg-[#faf9f5] rounded-xl border border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Showings</p>
              <p className="text-lg font-bold text-[#081c15] mt-1">{totalShowings}</p>
            </div>
            <div className="p-3 bg-[#faf9f5] rounded-xl border border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Completed</p>
              <p className="text-lg font-bold text-emerald-700 mt-1">{completedShowings}</p>
            </div>
            <div className="p-3 bg-[#faf9f5] rounded-xl border border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Offers</p>
              <p className="text-lg font-bold text-[#1b4332] mt-1">{offersGenerated}</p>
            </div>
            <div className="p-3 bg-[#faf9f5] rounded-xl border border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Deals Closed</p>
              <p className="text-lg font-bold text-purple-700 mt-1">{dealsClosed}</p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex justify-between items-center">
            <span>Showing-to-Offer Conversion Rate:</span>
            <strong className="text-sm font-serif">{showingToOfferRatio}%</strong>
          </div>
        </div>

        {/* CHART 8: Revenue and Goal Tracking */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#081c15]">
                8. Revenue Target & Pipeline Projections
              </h3>
              <p className="text-[11px] text-gray-400">Annual target achievement and weighted forecast</p>
            </div>
            <Target className="w-4 h-4 text-[#1b4332]" />
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Annual Commercial Target (${(annualTarget / 1000000).toFixed(0)}M)</span>
                <span className="text-[#1b4332] font-bold">{targetPct}% Achieved</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#1b4332] to-[#c5a059] rounded-full" style={{ width: `${targetPct}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-[#faf9f5] rounded-xl border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Target Remaining Gap</p>
                <p className="text-base font-bold text-amber-800 mt-1">${(remainingTarget / 1000000).toFixed(2)}M</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-[10px] text-emerald-800 uppercase font-semibold">Weighted Forecast Total</p>
                <p className="text-base font-bold text-emerald-950 mt-1">${(projectedRevenue / 1000000).toFixed(2)}M</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
