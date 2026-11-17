import React, { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Transaction, Property, Agent } from '../../types/database';
import { formatCurrency } from '../../utils/units';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    tx: Partial<Transaction> & {
      property_title_snapshot: string;
      agent_id: string;
      closing_date: string;
      sale_price: number;
    }
  ) => Promise<void>;
  transactionToEdit?: Transaction | null;
  properties: Property[];
  agents: Agent[];
  defaultCommRate?: number;
  defaultAgencySplit?: number;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  properties,
  agents,
  defaultCommRate = 3.0,
  defaultAgencySplit = 50.0,
}) => {
  const [propertyId, setPropertyId] = useState('');
  const [propertyTitle, setPropertyTitle] = useState('');
  const [agentId, setAgentId] = useState('');
  const [clientName, setClientName] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [salePrice, setSalePrice] = useState<number>(3500000);
  const [commRate, setCommRate] = useState<number>(defaultCommRate);
  const [agencySplitPct, setAgencySplitPct] = useState<number>(defaultAgencySplit);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (transactionToEdit) {
      setPropertyId(transactionToEdit.property_id || '');
      setPropertyTitle(transactionToEdit.property_title_snapshot);
      setAgentId(transactionToEdit.agent_id);
      setClientName(transactionToEdit.client_name_snapshot || '');
      setClosingDate(transactionToEdit.closing_date);
      setSalePrice(transactionToEdit.sale_price);
      setCommRate(transactionToEdit.commission_rate);
      setAgencySplitPct(transactionToEdit.agency_split_pct);
      setNotes(transactionToEdit.notes || '');
    } else {
      const defaultProp = properties[0];
      setPropertyId(defaultProp?.id || '');
      setPropertyTitle(defaultProp?.title || 'Property Settlement');
      setSalePrice(defaultProp?.price || 3500000);
      setAgentId(defaultProp?.assigned_agent_id || agents[0]?.id || '');
      setClientName('');
      setClosingDate(new Date().toISOString().split('T')[0]);
      setCommRate(defaultCommRate);
      setAgencySplitPct(defaultAgencySplit);
      setNotes('');
    }
  }, [transactionToEdit, isOpen, properties, agents, defaultCommRate, defaultAgencySplit]);

  const handlePropertySelect = (selectedId: string) => {
    setPropertyId(selectedId);
    const found = properties.find((p) => p.id === selectedId);
    if (found) {
      setPropertyTitle(found.title);
      setSalePrice(found.price);
      if (found.assigned_agent_id) setAgentId(found.assigned_agent_id);
    }
  };

  // Calculations
  const grossComm = salePrice * (commRate / 100);
  const agencyShare = grossComm * (agencySplitPct / 100);
  const agentShare = grossComm * ((100 - agencySplitPct) / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      id: transactionToEdit?.id,
      property_id: propertyId,
      property_title_snapshot: propertyTitle,
      client_name_snapshot: clientName,
      agent_id: agentId,
      closing_date: closingDate,
      sale_price: salePrice,
      commission_rate: commRate,
      agency_split_pct: agencySplitPct,
      agent_split_pct: 100 - agencySplitPct,
      notes,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 card-shadow border border-brand-ivoryDark space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-brand-ivoryDark">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
            <h3 className="font-display font-bold text-base text-brand-charcoal">
              {transactionToEdit ? `Edit Settlement (${transactionToEdit.id})` : 'Record Closed Settlement'}
            </h3>
          </div>
          <button onClick={onClose} className="text-brand-slateText hover:text-brand-charcoal p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-brand-charcoal mb-1">Property Sold *</label>
            <select
              required
              value={propertyId}
              onChange={(e) => handlePropertySelect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.ref_code}) — {formatCurrency(p.price)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Closing Broker *</label>
              <select
                required
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Closing Settlement Date *</label>
              <input
                type="date"
                required
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Final Sale Price ($) *</label>
              <input
                type="number"
                required
                value={salePrice}
                onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Commission Rate (%) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={commRate}
                onChange={(e) => setCommRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>

          {/* Live Calculation Preview */}
          <div className="p-3.5 bg-brand-ivory rounded-xl border border-brand-ivoryDark space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-brand-charcoal uppercase">
              <span>Commission Distribution</span>
              <span className="text-brand-gold font-normal lowercase">split: {agencySplitPct}% / {100 - agencySplitPct}%</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-brand-ivoryDark">
                <p className="text-[10px] text-brand-slateText">Gross Commission</p>
                <p className="text-xs font-bold text-brand-forest tabular-nums mt-0.5">{formatCurrency(grossComm)}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-brand-ivoryDark">
                <p className="text-[10px] text-brand-slateText">Agency Retained</p>
                <p className="text-xs font-bold text-brand-gold tabular-nums mt-0.5">{formatCurrency(agencyShare)}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-brand-ivoryDark">
                <p className="text-[10px] text-brand-slateText">Agent Payout</p>
                <p className="text-xs font-bold text-brand-charcoal tabular-nums mt-0.5">{formatCurrency(agentShare)}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-brand-charcoal mb-1">Client Name / Notes</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Lord Alistair Sterling"
              className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
          </div>

          <div className="pt-3 border-t border-brand-ivoryDark flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-brand-ivoryDark hover:bg-brand-ivory text-brand-slateText font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-forest hover:bg-brand-forestLight text-white rounded-lg font-semibold shadow-xs"
            >
              Record Settlement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
