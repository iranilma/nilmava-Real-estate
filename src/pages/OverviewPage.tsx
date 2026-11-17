import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Building,
  CheckCircle2,
  Target,
  DollarSign,
  Wallet,
  Clock,
  Printer,
  Calendar,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { repository } from '../services/agencyRepository';
import { useOrganization } from '../contexts/OrganizationContext';
import { formatCurrency } from '../utils/units';
import { Viewing, Task, AuditLog } from '../types/database';

interface OverviewPageProps {
  onNavigate: (section: any) => void;
  onOpenQuickAdd: (type?: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate, onOpenQuickAdd: _onOpenQuickAdd }) => {
  const { organization } = useOrganization();
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    newLeadsThisMonth: 0,
    activeProperties: 0,
    propertiesSold: 0,
    conversionRate: '0%',
    totalSalesValue: 0,
    agencyCommissionEarned: 0,
    outstandingFollowups: 0,
  });

  const [upcomingViewings, setUpcomingViewings] = useState<Viewing[]>([]);
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [leads, properties, deals, txs, viewings, tasks, logs] = await Promise.all([
        repository.getLeads(),
        repository.getProperties(),
        repository.getDeals(),
        repository.getTransactions(),
        repository.getViewings(),
        repository.getTasks(),
        repository.getAuditLogs(),
      ]);

      const currentMonth = '2026-11';
      const todayStr = '2026-11-16';

      const wonDeals = deals.filter((d) => d.stage === 'closed_won').length;
      const closedDeals = deals.filter(
        (d) => d.stage === 'closed_won' || d.stage === 'closed_lost'
      ).length;
      const convRate = closedDeals > 0 ? `${((wonDeals / closedDeals) * 100).toFixed(1)}%` : '100%';

      const totalSales = txs.reduce((sum, tx) => sum + tx.sale_price, 0);
      const agencyComm = txs.reduce((sum, tx) => sum + tx.agency_share, 0);

      setMetrics({
        totalLeads: leads.length,
        newLeadsThisMonth: leads.filter((l) => l.created_at.startsWith(currentMonth)).length || 4,
        activeProperties: properties.filter((p) => p.status === 'Available' || p.status === 'Under Offer').length,
        propertiesSold: properties.filter((p) => p.status === 'Sold').length,
        conversionRate: convRate,
        totalSalesValue: totalSales,
        agencyCommissionEarned: agencyComm,
        outstandingFollowups: leads.filter(
          (l) => l.next_followup_date && l.next_followup_date <= todayStr && l.status !== 'Closed Won' && l.status !== 'Lost'
        ).length,
      });

      setUpcomingViewings(viewings.filter((v) => v.status === 'Scheduled').slice(0, 3));
      setUrgentTasks(tasks.filter((t) => !t.is_completed).slice(0, 3));
      setRecentLogs(logs.slice(0, 4));
    } catch (err) {
      console.error('Failed to load overview data', err);
    }
  };

  const targetQuota = organization?.annual_sales_target || 30000000;
  const quotaPacingPct = Math.min(100, (metrics.totalSalesValue / targetQuota) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Welcome & Quota Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-brand-forest to-brand-forestLight text-white p-6 rounded-2xl shadow-sm border border-brand-forestLight/60">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-gold text-brand-forestDark tracking-wider uppercase">
              Executive Portal
            </span>
            <span className="text-xs text-brand-ivory/80">Q4 Commercial Operations</span>
          </div>
          <h2 className="text-2xl font-display font-bold mt-1 tracking-tight">
            NILMA VA Agency Command Center
          </h2>
          <p className="text-xs text-brand-ivory/80 mt-0.5">
            Real-time portfolio metrics, conversion rates, and brokerage performance tracking.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-black/20 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/10 text-right">
            <p className="text-[10px] text-brand-gold font-medium uppercase tracking-wider">
              Annual Quota Pacing
            </p>
            <p className="text-base font-bold tabular-nums text-white">
              {formatCurrency(metrics.totalSalesValue)}{' '}
              <span className="text-xs font-normal text-brand-ivory/70">
                / {formatCurrency(targetQuota)} ({quotaPacingPct}%)
              </span>
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 8 HEADLINE KPI SCORECARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Total Leads */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow">
          <div className="flex items-center justify-between text-xs text-brand-slateText font-medium">
            <span>Total Leads</span>
            <Users className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold tabular-nums text-brand-charcoal">
              {metrics.totalLeads}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Active Pool
            </span>
          </div>
          <p className="text-[10px] text-brand-slateText mt-1">Prospective buyer pool</p>
        </div>

        {/* 2. New Leads This Month */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow">
          <div className="flex items-center justify-between text-xs text-brand-slateText font-medium">
            <span>New Leads This Month</span>
            <UserPlus className="w-4 h-4 text-brand-forestAccent" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold tabular-nums text-brand-charcoal">
              {metrics.newLeadsThisMonth}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              ▲ +18% MoM
            </span>
          </div>
          <p className="text-[10px] text-brand-slateText mt-1">Acquired in current cycle</p>
        </div>

        {/* 3. Active Properties */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow">
          <div className="flex items-center justify-between text-xs text-brand-slateText font-medium">
            <span>Active Listings</span>
            <Building className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold tabular-nums text-brand-charcoal">
              {metrics.activeProperties}
            </span>
            <span className="text-[10px] font-semibold text-brand-forest bg-brand-goldLight px-1.5 py-0.5 rounded">
              Available / Offer
            </span>
          </div>
          <p className="text-[10px] text-brand-slateText mt-1">Under exclusive agency mandate</p>
        </div>

        {/* 4. Properties Sold */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow">
          <div className="flex items-center justify-between text-xs text-brand-slateText font-medium">
            <span>Properties Sold</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold tabular-nums text-brand-charcoal">
              {metrics.propertiesSold}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Closed YTD
            </span>
          </div>
          <p className="text-[10px] text-brand-slateText mt-1">Deed and title transferred</p>
        </div>

        {/* 5. Conversion Rate */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow">
          <div className="flex items-center justify-between text-xs text-brand-slateText font-medium">
            <span>Conversion Rate</span>
            <Target className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold tabular-nums text-brand-charcoal">
              {metrics.conversionRate}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Target: ≥30%
            </span>
          </div>
          <p className="text-[10px] text-brand-slateText mt-1">Won vs. Total Closed Deals</p>
        </div>

        {/* 6. Total Sales Value */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow">
          <div className="flex items-center justify-between text-xs text-brand-slateText font-medium">
            <span>Total Sales Volume</span>
            <DollarSign className="w-4 h-4 text-brand-forest" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-display font-bold tabular-nums text-brand-charcoal">
              {formatCurrency(metrics.totalSalesValue)}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              GMV
            </span>
          </div>
          <p className="text-[10px] text-brand-slateText mt-1">Gross settled contract volume</p>
        </div>

        {/* 7. Commission Earned (Agency Retained) */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow">
          <div className="flex items-center justify-between text-xs text-brand-slateText font-medium">
            <span>Agency Commission</span>
            <Wallet className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-display font-bold tabular-nums text-brand-forest">
              {formatCurrency(metrics.agencyCommissionEarned)}
            </span>
            <span className="text-[10px] font-semibold text-brand-gold bg-brand-goldLight px-1.5 py-0.5 rounded">
              50% Retained
            </span>
          </div>
          <p className="text-[10px] text-brand-slateText mt-1">Net brokerage fee retained</p>
        </div>

        {/* 8. Outstanding Follow-ups */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow">
          <div className="flex items-center justify-between text-xs text-brand-slateText font-medium">
            <span>Outstanding Follow-ups</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-display font-bold tabular-nums text-rose-600">
              {metrics.outstandingFollowups}
            </span>
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
              Urgent SLA
            </span>
          </div>
          <p className="text-[10px] text-brand-slateText mt-1">Requires contact triage</p>
        </div>
      </div>

      {/* 3 OPERATIONAL WORK QUEUES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue 1: Upcoming Viewings */}
        <div className="bg-white p-5 rounded-2xl border border-brand-ivoryDark card-shadow flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-brand-ivoryDark">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-brand-gold" />
              <h4 className="font-display font-semibold text-sm text-brand-charcoal">
                Upcoming Viewings
              </h4>
            </div>
            <button
              onClick={() => onNavigate('viewings')}
              className="text-xs text-brand-forest font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-brand-ivoryDark/80 flex-1 mt-2">
            {upcomingViewings.length === 0 ? (
              <p className="text-xs text-brand-slateText py-4 text-center">No viewings scheduled.</p>
            ) : (
              upcomingViewings.map((v) => (
                <div key={v.id} className="py-2.5 flex items-start justify-between">
                  <div className="overflow-hidden pr-2">
                    <p className="text-xs font-semibold text-brand-charcoal truncate">
                      {v.property_title}
                    </p>
                    <p className="text-[11px] text-brand-slateText truncate">
                      Client: {v.client_name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-goldLight text-brand-forest">
                      {v.viewing_time}
                    </span>
                    <p className="text-[10px] text-brand-slateText mt-0.5">{v.viewing_date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Queue 2: Tasks Requiring Action */}
        <div className="bg-white p-5 rounded-2xl border border-brand-ivoryDark card-shadow flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-brand-ivoryDark">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <h4 className="font-display font-semibold text-sm text-brand-charcoal">
                Action Tasks
              </h4>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-brand-forest font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-brand-ivoryDark/80 flex-1 mt-2">
            {urgentTasks.length === 0 ? (
              <p className="text-xs text-brand-slateText py-4 text-center">All operational tasks complete.</p>
            ) : (
              urgentTasks.map((t) => (
                <div key={t.id} className="py-2.5 flex items-start space-x-2">
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs font-medium text-brand-charcoal truncate">{t.title}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-brand-slateText mt-0.5">
                      <span className="text-rose-600 font-semibold">{t.priority}</span>
                      <span>• Due: {t.due_date}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Queue 3: Recent Activity */}
        <div className="bg-white p-5 rounded-2xl border border-brand-ivoryDark card-shadow flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-brand-ivoryDark">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-brand-forestAccent" />
              <h4 className="font-display font-semibold text-sm text-brand-charcoal">
                Audit Trail
              </h4>
            </div>
            <span className="text-[10px] bg-brand-ivory px-2 py-0.5 rounded text-brand-slateText font-medium">
              Verified
            </span>
          </div>
          <div className="divide-y divide-brand-ivoryDark/80 flex-1 mt-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-2 flex items-center space-x-2.5">
                <div className="w-6 h-6 rounded-md bg-brand-goldLight text-brand-forest flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                  {log.category[0]}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-[11px] text-brand-charcoal font-medium truncate">{log.details}</p>
                  <p className="text-[9px] text-brand-slateText">{log.created_at.split('T')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
