import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Ruler,
  Percent,
  Target,
  Database,
  Save,
  RotateCcw,
  Download,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../contexts/ToastContext';
import { MeasurementUnit } from '../types/database';

export const SettingsPage: React.FC = () => {
  const { organization, updateOrganization, resetToDefaultData, isDemoMode } =
    useOrganization();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [currency, setCurrency] = useState('USD ($)');
  const [defaultUnit, setDefaultUnit] = useState<MeasurementUnit>('sqm');
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number>(5.0);
  const [agencySplitPct, setAgencySplitPct] = useState<number>(50.0);
  const [agentSplitPct, setAgentSplitPct] = useState<number>(50.0);
  const [annualSalesTarget, setAnnualSalesTarget] = useState<number>(25000000);
  const [annualProfitTarget, setAnnualProfitTarget] = useState<number>(600000);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setLegalName(organization.legal_entity_name || '');
      setCurrency(organization.currency || 'USD ($)');
      setDefaultUnit(organization.default_measurement_unit || 'sqm');
      setDefaultCommissionRate(organization.default_commission_rate || 5.0);
      setAgencySplitPct(organization.agency_split_pct || 50.0);
      setAgentSplitPct(organization.agent_split_pct || 50.0);
      setAnnualSalesTarget(organization.annual_sales_target || 25000000);
      setAnnualProfitTarget(organization.annual_profit_target || 600000);
    }
  }, [organization]);

  const handleAgencySplitChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setAgencySplitPct(clamped);
    setAgentSplitPct(100 - clamped);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateOrganization({
        name: name.trim(),
        legal_entity_name: legalName.trim(),
        currency,
        default_measurement_unit: defaultUnit,
        default_commission_rate: Number(defaultCommissionRate),
        agency_split_pct: Number(agencySplitPct),
        agent_split_pct: Number(agentSplitPct),
        annual_sales_target: Number(annualSalesTarget),
        annual_profit_target: Number(annualProfitTarget),
      });
      showToast('Agency settings updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = () => {
    const raw = localStorage.getItem('nilma_real_estate_db_v2');
    if (!raw) {
      showToast('No local database records found to export.', 'error');
      return;
    }
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nilma-va-database-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Database backup downloaded successfully.', 'success');
  };

  const handleResetData = async () => {
    if (
      !window.confirm(
        'CAUTION: Resetting database will restore all original seed demonstration properties, agents, leads, and settlements. Are you sure?'
      )
    ) {
      return;
    }
    try {
      await resetToDefaultData();
      showToast('Database successfully restored to pristine seed data.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset data', 'error');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#c5a059]/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#1b4332]/10 text-[#1b4332] flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-[#081c15]">
              Agency Configuration & Global Preferences
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Multi-tenant agency identity, measurement standards, commission policy, and persistence.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-[#1b4332] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-all shadow-md flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
        </button>
      </div>

      {/* 1. Agency Identity */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1b4332] flex items-center space-x-2">
          <Building className="w-4 h-4 text-[#c5a059]" />
          <span>1. Agency Identity & Operating Currency</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              Public Agency Brand Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              Registered Legal Entity
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. NILMA VA Real Estate Ltd."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              Base Settlement Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            >
              <option value="USD ($)">USD — United States Dollar ($)</option>
              <option value="GBP (£)">GBP — British Pound Sterling (£)</option>
              <option value="EUR (€)">EUR — Euro (€)</option>
              <option value="AED (AED)">AED — UAE Dirham (AED)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              System Environment
            </label>
            <div className="px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs flex items-center justify-between">
              <span className="font-medium text-gray-700">
                {isDemoMode ? 'Local Isolated Sandbox (Demo Mode)' : 'Supabase Cloud PostgreSQL'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dual Measurement Standards */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1b4332] flex items-center space-x-2">
          <Ruler className="w-4 h-4 text-[#c5a059]" />
          <span>2. Property Measurement Standards & Precision Conversion</span>
        </h3>

        <div className="p-4 bg-[#faf9f5] rounded-xl border border-[#c5a059]/20 space-y-3">
          <p className="text-xs text-gray-700 leading-relaxed">
            The platform supports both metric <strong>Square Metres (m²)</strong> and imperial <strong>Square Feet (ft²)</strong>. All listings are stored canonically in square metres in the database to prevent conversion drift. Both units are automatically computed and displayed everywhere in the UI.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-2">
              Default Agency Unit Preference for Form Inputs
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="defaultUnit"
                  value="sqm"
                  checked={defaultUnit === 'sqm'}
                  onChange={() => setDefaultUnit('sqm')}
                  className="w-4 h-4 text-[#1b4332] focus:ring-[#1b4332]"
                />
                <span className="text-sm font-semibold text-gray-800">
                  Square Metres (m²) — International Metric
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="defaultUnit"
                  value="sqft"
                  checked={defaultUnit === 'sqft'}
                  onChange={() => setDefaultUnit('sqft')}
                  className="w-4 h-4 text-[#1b4332] focus:ring-[#1b4332]"
                />
                <span className="text-sm font-semibold text-gray-800">
                  Square Feet (ft² / sq ft) — Imperial Standard
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Commission Rules & Historical Snapshot Protection */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1b4332] flex items-center space-x-2">
            <Percent className="w-4 h-4 text-[#c5a059]" />
            <span>3. Default Commission Splits & Settlement Policy</span>
          </h3>
          <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
            <Lock className="w-3 h-3" />
            <span>Locked Historical Snapshots</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              Standard Gross Commission Rate (%)
            </label>
            <input
              type="number"
              step="0.25"
              min="0.5"
              max="20"
              value={defaultCommissionRate}
              onChange={(e) => setDefaultCommissionRate(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              Agency Retained Split (%)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={agencySplitPct}
              onChange={(e) => handleAgencySplitChange(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              Broker Payout Share (%)
            </label>
            <input
              type="number"
              readOnly
              value={agentSplitPct}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-600 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Audit Protection Notice:</strong> Updating agency default commission rules will only apply to future new transactions. All existing historical settlements maintain their locked mathematical snapshots permanently.
          </span>
        </div>
      </div>

      {/* 4. Targets */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1b4332] flex items-center space-x-2">
          <Target className="w-4 h-4 text-[#c5a059]" />
          <span>4. Annual Agency Commercial Targets (FY 2026)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              Annual Agency Gross Sales Volume Target ($)
            </label>
            <input
              type="number"
              step="500000"
              value={annualSalesTarget}
              onChange={(e) => setAnnualSalesTarget(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              Annual Net Operating Profit Target ($)
            </label>
            <input
              type="number"
              step="50000"
              value={annualProfitTarget}
              onChange={(e) => setAnnualProfitTarget(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            />
          </div>
        </div>
      </div>

      {/* 5. Data Management & Persistence */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1b4332] flex items-center space-x-2">
          <Database className="w-4 h-4 text-[#c5a059]" />
          <span>5. Multi-Tenant Data Backup & Maintenance</span>
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center space-x-2 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Full Database Backup (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center space-x-2 transition-colors shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Records to Pristine State</span>
          </button>
        </div>
      </div>
    </form>
  );
};
