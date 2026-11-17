import React, { useState, useEffect } from 'react';
import {
  Plus,
  Sliders,
  ShieldCheck,
  Calendar,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Transaction, Expense, Property, Agent, FinancialSummary } from '../types/database';
import { repository } from '../services/agencyRepository';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency } from '../utils/units';
import { TransactionModal } from '../components/modals/TransactionModal';

type DateFilterPeriod = 'all' | 'this_month' | 'last_month' | 'this_quarter' | 'ytd';

export const FinancialsPage: React.FC = () => {
  const { organization } = useOrganization();
  const { showToast } = useToast();
  const [period, setPeriod] = useState<DateFilterPeriod>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    gross_sales: 0,
    gross_commission: 0,
    agency_retained: 0,
    agent_payouts: 0,
    operating_expenses: 0,
    net_operating_profit: 0,
    net_profit_margin_pct: 0,
  });

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Reverse Commission Goal Planner State
  const [targetRetained, setTargetRetained] = useState<number>(750000);
  const [calcRate, setCalcRate] = useState<number>(5.0);
  const [calcSplit, setCalcSplit] = useState<number>(50.0);
  const [avgPrice, setAvgPrice] = useState<number>(4500000);

  // Calculations
  const feeFactor = (calcRate / 100) * (calcSplit / 100);
  const requiredGrossVolume = feeFactor > 0 ? targetRetained / feeFactor : 0;
  const requiredDealsCount = avgPrice > 0 ? Math.ceil(requiredGrossVolume / avgPrice) : 0;
  const totalGrossGenerated = requiredGrossVolume * (calcRate / 100);
  const brokerPayoutPool = totalGrossGenerated * (1 - calcSplit / 100);

  useEffect(() => {
    loadFinancials();
  }, [period]);

  const loadFinancials = async () => {
    try {
      const [allTxs, allExps, allProps, allAgts, finSummary] = await Promise.all([
        repository.getTransactions(),
        repository.getExpenses(),
        repository.getProperties(),
        repository.getAgents(),
        repository.getFinancialSummary(period),
      ]);

      setSummary(finSummary);
      setProperties(allProps);
      setAgents(allAgts);

      // Filter transactions and expenses according to period
      const currentYear = '2026';
      const currentMonth = '2026-11';
      const lastMonth = '2026-10';

      let filteredTxs = allTxs;
      let filteredExps = allExps;

      if (period === 'this_month') {
        filteredTxs = allTxs.filter((t) => t.closing_date.startsWith(currentMonth));
        filteredExps = allExps.filter((e) => e.date.startsWith(currentMonth));
      } else if (period === 'last_month') {
        filteredTxs = allTxs.filter((t) => t.closing_date.startsWith(lastMonth));
        filteredExps = allExps.filter((e) => e.date.startsWith(lastMonth));
      } else if (period === 'this_quarter') {
        filteredTxs = allTxs.filter((t) => t.closing_date >= '2026-10-01' && t.closing_date <= '2026-12-31');
        filteredExps = allExps.filter((e) => e.date >= '2026-10-01' && e.date <= '2026-12-31');
      } else if (period === 'ytd') {
        filteredTxs = allTxs.filter((t) => t.closing_date.startsWith(currentYear));
        filteredExps = allExps.filter((e) => e.date.startsWith(currentYear));
      }

      setTransactions(filteredTxs);
      setExpenses(filteredExps);
    } catch (err) {
      console.error('Failed to load financial records', err);
    }
  };

  const handleSaveTransaction = async (data: any) => {
    try {
      await repository.saveTransaction(data);
      showToast('Settlement recorded successfully.', 'success');
      loadFinancials();
    } catch (err: any) {
      showToast(err.message || 'Failed to record settlement', 'error');
    }
  };

  const handleDeleteTransaction = async (id: string, ref: string) => {
    if (window.confirm(`Delete settlement "${ref}"? This will recalculate revenue summaries.`)) {
      try {
        await repository.deleteTransaction(id);
        showToast(`Settlement "${ref}" deleted.`, 'info');
        loadFinancials();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete settlement', 'error');
      }
    }
  };

  const handleDeleteExpense = async (id: string, desc: string) => {
    if (window.confirm(`Delete expense "${desc}"?`)) {
      try {
        await repository.deleteExpense(id);
        showToast(`Expense "${desc}" deleted.`, 'info');
        loadFinancials();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete expense', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Setting Links */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-brand-charcoal">
            Financial Performance & Commission Splits
          </h2>
          <p className="text-xs text-brand-slateText">
            Gross transaction settlements, 50/50 broker splits, overhead expense ledgers, and net operating profit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="badge-gold px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
            <span>Immutable Historical Settlements</span>
          </div>
        </div>
      </div>

      {/* Date Period Filtering Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-brand-charcoal mr-2 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-brand-gold" /> Period:
          </span>
          {(['all', 'this_month', 'last_month', 'this_quarter', 'ytd'] as DateFilterPeriod[]).map(
            (p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs rounded-lg transition capitalize ${
                  period === p
                    ? 'bg-brand-forest text-white font-semibold'
                    : 'text-brand-slateText hover:bg-brand-ivory font-medium'
                }`}
              >
                {p.replace('_', ' ')}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => {
            setSelectedTx(null);
            setIsTxModalOpen(true);
          }}
          className="px-3.5 py-2 bg-brand-forest hover:bg-brand-forestLight text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Settlement</span>
        </button>
      </div>

      {/* 6 Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Gross Volume */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-brand-slateText font-medium">Gross Volume</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-ivory text-brand-slateText font-mono">
                Σ(Sales)
              </span>
            </div>
            <p className="text-xl font-display font-bold text-brand-charcoal mt-1 tabular-nums">
              {formatCurrency(summary.gross_sales)}
            </p>
          </div>
          <p className="text-[10px] text-brand-slateText mt-2 border-t border-brand-ivoryDark pt-1.5">
            Total Closed Settlements
          </p>
        </div>

        {/* 2. Gross Brokerage Commission */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-brand-slateText font-medium">Gross Commission</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono">
                {organization?.default_commission_rate || 3.0}% Rate
              </span>
            </div>
            <p className="text-xl font-display font-bold text-brand-forest mt-1 tabular-nums">
              {formatCurrency(summary.gross_commission)}
            </p>
          </div>
          <p className="text-[10px] text-brand-slateText mt-2 border-t border-brand-ivoryDark pt-1.5">
            Total Commission Pool
          </p>
        </div>

        {/* 3. Agency Retained */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-brand-slateText font-medium">Agency Retained</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono">
                50% Share
              </span>
            </div>
            <p className="text-xl font-display font-bold text-brand-gold mt-1 tabular-nums">
              {formatCurrency(summary.agency_retained)}
            </p>
          </div>
          <p className="text-[10px] text-brand-slateText mt-2 border-t border-brand-ivoryDark pt-1.5">
            Brokerage Net Top-Line
          </p>
        </div>

        {/* 4. Agent Payouts */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-brand-slateText font-medium">Agent Disbursed</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                50% Split
              </span>
            </div>
            <p className="text-xl font-display font-bold text-brand-slateText mt-1 tabular-nums">
              {formatCurrency(summary.agent_payouts)}
            </p>
          </div>
          <p className="text-[10px] text-brand-slateText mt-2 border-t border-brand-ivoryDark pt-1.5">
            Disbursed to Brokers
          </p>
        </div>

        {/* 5. Operating Overhead */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-brand-slateText font-medium">Operating Overhead</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-mono">
                Σ(Expenses)
              </span>
            </div>
            <p className="text-xl font-display font-bold text-rose-600 mt-1 tabular-nums">
              {formatCurrency(summary.operating_expenses)}
            </p>
          </div>
          <p className="text-[10px] text-brand-slateText mt-2 border-t border-brand-ivoryDark pt-1.5">
            Facility, Media & Software
          </p>
        </div>

        {/* 6. Net Operating Profit */}
        <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-brand-slateText font-medium">Net Profit</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                Margin {summary.net_profit_margin_pct}%
              </span>
            </div>
            <p
              className={`text-xl font-display font-bold mt-1 tabular-nums ${
                summary.net_operating_profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {formatCurrency(summary.net_operating_profit)}
            </p>
          </div>
          <p className="text-[10px] text-brand-slateText mt-2 border-t border-brand-ivoryDark pt-1.5">
            Retained minus Overhead
          </p>
        </div>
      </div>

      {/* Reverse Commission Goal Planner */}
      <div className="bg-white rounded-2xl border border-[#c5a059]/30 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-serif font-bold text-base text-[#081c15] flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[#c5a059]" />
              <span>Reverse Commission Goal Planner</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Input your desired retained income to calculate required gross sales volume and deal frequency.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1b4332]/10 text-[#1b4332] uppercase">
            Goal Modeling Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Target Agency Net ($)
            </label>
            <input
              type="number"
              step="25000"
              value={targetRetained}
              onChange={(e) => setTargetRetained(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-[#1b4332]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Commission Rate (%)
            </label>
            <input
              type="number"
              step="0.25"
              value={calcRate}
              onChange={(e) => setCalcRate(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Agency Split Share (%)
            </label>
            <input
              type="number"
              step="1"
              value={calcSplit}
              onChange={(e) => setCalcSplit(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Avg Property Price ($)
            </label>
            <input
              type="number"
              step="100000"
              value={avgPrice}
              onChange={(e) => setAvgPrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold"
            />
          </div>
        </div>

        {/* Calculated Projection Output Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 bg-[#faf9f5] rounded-xl border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Required Gross Sales</span>
            <p className="text-base font-serif font-bold text-[#081c15] mt-1">
              ${(requiredGrossVolume / 1000000).toFixed(2)}M
            </p>
            <span className="text-[10px] text-gray-400">Transaction volume needed</span>
          </div>

          <div className="p-3.5 bg-[#faf9f5] rounded-xl border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Gross Commission Pool</span>
            <p className="text-base font-serif font-bold text-[#1b4332] mt-1">
              ${(totalGrossGenerated / 1000).toFixed(0)}k
            </p>
            <span className="text-[10px] text-[#c5a059]">At {calcRate}% standard</span>
          </div>

          <div className="p-3.5 bg-[#faf9f5] rounded-xl border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Broker Payout Pool</span>
            <p className="text-base font-serif font-bold text-gray-800 mt-1">
              ${(brokerPayoutPool / 1000).toFixed(0)}k
            </p>
            <span className="text-[10px] text-gray-400">{100 - calcSplit}% to broker roster</span>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[10px] text-emerald-800 uppercase font-semibold">Required Closings</span>
            <p className="text-base font-serif font-bold text-emerald-950 mt-1">
              {requiredDealsCount} Transactions
            </p>
            <span className="text-[10px] text-emerald-700 font-bold">~{(requiredDealsCount / 12).toFixed(1)} deals / month</span>
          </div>
        </div>
      </div>

      {/* Closed Settlements Ledger Table */}
      <div className="bg-white rounded-xl border border-brand-ivoryDark overflow-hidden card-shadow">
        <div className="px-5 py-3.5 bg-brand-ivory border-b border-brand-ivoryDark flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-display font-semibold text-sm text-brand-charcoal">
              Closed Transaction Settlements Ledger
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-brand-forest border border-brand-ivoryDark">
              {transactions.length} Settlements
            </span>
          </div>
          <span className="text-xs text-brand-slateText">
            Commission Distribution & Settlement Records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-brand-charcoal font-semibold uppercase tracking-wider text-[11px] border-b border-brand-ivoryDark">
              <tr>
                <th className="py-3 px-4">Ref</th>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Closing Broker</th>
                <th className="py-3 px-4">Closing Date</th>
                <th className="py-3 px-4">Sale Price</th>
                <th className="py-3 px-4">Gross Commission</th>
                <th className="py-3 px-4">Agency Share</th>
                <th className="py-3 px-4">Agent Share</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-ivoryDark">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-brand-ivory/50 transition">
                  <td className="py-3 px-4 font-bold text-brand-gold font-mono">{tx.id}</td>
                  <td className="py-3 px-4 font-semibold text-brand-charcoal">
                    {tx.property_title_snapshot}
                  </td>
                  <td className="py-3 px-4 text-brand-slateText">{tx.agent_name_snapshot}</td>
                  <td className="py-3 px-4 tabular-nums">{tx.closing_date}</td>
                  <td className="py-3 px-4 font-bold text-brand-forest tabular-nums">
                    {formatCurrency(tx.sale_price)}
                  </td>
                  <td className="py-3 px-4 tabular-nums font-medium text-brand-charcoal">
                    {formatCurrency(tx.gross_commission)}{' '}
                    <span className="text-[10px] text-brand-slateText">({tx.commission_rate}%)</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-brand-gold tabular-nums">
                    {formatCurrency(tx.agency_share)}
                  </td>
                  <td className="py-3 px-4 tabular-nums text-brand-slateText">
                    {formatCurrency(tx.agent_share)}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => {
                        setSelectedTx(tx);
                        setIsTxModalOpen(true);
                      }}
                      className="p-1 hover:text-brand-forest transition"
                      title="Edit Settlement"
                    >
                      <Edit3 className="w-3.5 h-3.5 inline" />
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(tx.id, tx.property_title_snapshot)}
                      className="p-1 text-rose-500 hover:text-rose-700 transition"
                      title="Delete Settlement"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operating Overhead Expenses Ledger */}
      <div className="bg-white rounded-xl border border-brand-ivoryDark overflow-hidden card-shadow">
        <div className="px-5 py-3.5 bg-brand-ivory border-b border-brand-ivoryDark flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-display font-semibold text-sm text-brand-charcoal">
              Operating Overhead & Expenses Ledger
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-rose-700 border border-brand-ivoryDark">
              {formatCurrency(summary.operating_expenses)} Total Overhead
            </span>
          </div>
          <span className="text-xs text-brand-slateText">
            Overhead Categories & Recurrence Schedule
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-brand-charcoal font-semibold uppercase tracking-wider text-[11px] border-b border-brand-ivoryDark">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description / Vendor</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Recurrence</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-ivoryDark">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-brand-ivory/50 transition">
                  <td className="py-3 px-4 font-bold text-brand-charcoal font-mono">{exp.id}</td>
                  <td className="py-3 px-4 tabular-nums text-brand-slateText">{exp.date}</td>
                  <td className="py-3 px-4 font-semibold text-brand-charcoal">
                    {exp.description}
                    {exp.vendor && (
                      <span className="text-[10px] text-brand-slateText block font-normal">
                        Vendor: {exp.vendor}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-ivory text-brand-charcoal border border-brand-ivoryDark">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-brand-slateText">{exp.recurrence}</td>
                  <td className="py-3 px-4 font-bold text-rose-600 tabular-nums">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleDeleteExpense(exp.id, exp.description)}
                      className="p-1 text-rose-500 hover:text-rose-700 transition"
                      title="Delete Expense"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        transactionToEdit={selectedTx}
        properties={properties}
        agents={agents}
        defaultCommRate={organization?.default_commission_rate}
        defaultAgencySplit={organization?.agency_split_pct}
      />
    </div>
  );
};
