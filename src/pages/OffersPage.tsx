import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../contexts/ToastContext';
import { Offer, OfferStatus, FinancingType } from '../types/database';

export const OffersPage: React.FC = () => {
  const { offers, properties, agents, saveOffer, deleteOffer } =
    useOrganization();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [offerToEdit, setOfferToEdit] = useState<Offer | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form State
  const [propertyId, setPropertyId] = useState('');
  const [clientName, setClientName] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [offerAmount, setOfferAmount] = useState<number>(5500000);
  const [askingPrice, setAskingPrice] = useState<number>(5800000);
  const [earnestMoney, setEarnestMoney] = useState<number>(275000);
  const [financingType, setFinancingType] = useState<FinancingType>('Cash');
  const [expirationDate, setExpirationDate] = useState('');
  const [proposedCloseDate, setProposedCloseDate] = useState('');
  const [status, setStatus] = useState<OfferStatus>('Submitted');
  const [counterAmount, setCounterAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const filtered = offers.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    return true;
  });

  const totalOfferVolume = offers.reduce((sum, o) => sum + o.offer_amount, 0);
  const acceptedOffers = offers.filter((o) => o.status === 'Accepted').length;

  const openModal = (offer?: Offer) => {
    if (offer) {
      setOfferToEdit(offer);
      setPropertyId(offer.property_id);
      setClientName(offer.client_name);
      setAssignedAgentId(offer.assigned_agent_id);
      setOfferAmount(offer.offer_amount);
      setAskingPrice(offer.asking_price);
      setEarnestMoney(offer.earnest_money || 0);
      setFinancingType(offer.financing_type);
      setExpirationDate(offer.expiration_date);
      setProposedCloseDate(offer.proposed_closing_date);
      setStatus(offer.status);
      setCounterAmount(offer.counter_amount || 0);
      setNotes(offer.notes || '');
    } else {
      setOfferToEdit(null);
      const defaultProp = properties[0];
      setPropertyId(defaultProp?.id || '');
      setClientName('Lord Alistair Vance');
      setAssignedAgentId(agents[0]?.id || '');
      setOfferAmount(defaultProp ? Math.round(defaultProp.price * 0.95) : 5000000);
      setAskingPrice(defaultProp ? defaultProp.price : 5500000);
      setEarnestMoney(250000);
      setFinancingType('Cash');
      const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      setExpirationDate(in7Days);
      setProposedCloseDate(in30Days);
      setStatus('Submitted');
      setCounterAmount(0);
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handlePropertyChange = (pId: string) => {
    setPropertyId(pId);
    const p = properties.find((x) => x.id === pId);
    if (p) {
      setAskingPrice(p.price);
      setOfferAmount(Math.round(p.price * 0.95));
      setEarnestMoney(Math.round(p.price * 0.05));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !clientName.trim() || !assignedAgentId) return;

    const prop = properties.find((p) => p.id === propertyId);
    try {
      await saveOffer({
        id: offerToEdit?.id,
        property_id: propertyId,
        property_title: prop ? prop.title : 'Luxury Property Offer',
        client_name: clientName.trim(),
        assigned_agent_id: assignedAgentId,
        offer_amount: Number(offerAmount),
        asking_price: Number(askingPrice),
        earnest_money: Number(earnestMoney),
        financing_type: financingType,
        expiration_date: expirationDate,
        proposed_closing_date: proposedCloseDate,
        status,
        counter_amount: counterAmount ? Number(counterAmount) : undefined,
        notes: notes.trim(),
      });
      showToast('Offer saved successfully.', 'success');
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleQuickStatus = async (offer: Offer, newStatus: OfferStatus) => {
    try {
      await saveOffer({
        ...offer,
        status: newStatus,
      });
      showToast(`Offer updated to ${newStatus}.`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#c5a059]/20 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-serif font-bold text-[#081c15]">
              Formal Offers & Contract Negotiation Register
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1b4332]/10 text-[#1b4332]">
              {offers.length} Active Offers
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Track contractual purchase offers, asking price ratios, earnest deposits, financing contingencies, and counteroffers.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#faf9f5] border border-gray-200">
            <span className="text-gray-500">Offer Value: </span>
            <strong className="text-[#081c15]">${(totalOfferVolume / 1000000).toFixed(1)}M</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-800">Accepted: </span>
            <strong className="text-emerald-950">{acceptedOffers} In Escrow</strong>
          </div>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-[#1b4332] text-white font-semibold rounded-xl hover:bg-[#2d6a4f] shadow-xs transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Log Offer</span>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {['all', 'Submitted', 'Countered', 'Accepted', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition ${
                statusFilter === st ? 'bg-[#1b4332] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {st === 'all' ? 'All Offers' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#faf9f5] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-5">Property Estate</th>
                <th className="py-3.5 px-5">Buyer Client</th>
                <th className="py-3.5 px-5">Offer Amount</th>
                <th className="py-3.5 px-5">Asking vs Ratio</th>
                <th className="py-3.5 px-5">Deposit & Financing</th>
                <th className="py-3.5 px-5">Expiration</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((offer) => {
                const ratio = Math.round((offer.offer_amount / offer.asking_price) * 100);
                const agent = agents.find((a) => a.id === offer.assigned_agent_id);

                return (
                  <tr key={offer.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-5">
                      <p className="font-bold text-[#081c15]">{offer.property_title}</p>
                      <span className="text-[10px] text-[#c5a059] font-mono">{offer.id}</span>
                    </td>
                    <td className="py-3 px-5">
                      <p className="font-semibold text-gray-800">{offer.client_name}</p>
                      <p className="text-[10px] text-gray-400">Agent: {agent ? agent.name : 'Unassigned'}</p>
                    </td>
                    <td className="py-3 px-5">
                      <p className="font-bold text-sm text-[#1b4332]">${offer.offer_amount.toLocaleString()}</p>
                      {offer.counter_amount && (
                        <p className="text-[10px] text-amber-700 font-semibold">Counter: ${offer.counter_amount.toLocaleString()}</p>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <p className="text-gray-600">${offer.asking_price.toLocaleString()}</p>
                      <span className={`text-[10px] font-bold ${ratio >= 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {ratio}% of asking
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <p className="font-medium text-gray-700">{offer.financing_type}</p>
                      <p className="text-[10px] text-gray-400">EMD: ${(offer.earnest_money || 0).toLocaleString()}</p>
                    </td>
                    <td className="py-3 px-5 text-gray-600">
                      {offer.expiration_date}
                    </td>
                    <td className="py-3 px-5">
                      <select
                        value={offer.status}
                        onChange={(e) => handleQuickStatus(offer, e.target.value as OfferStatus)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border-0 cursor-pointer ${
                          offer.status === 'Accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : offer.status === 'Countered'
                            ? 'bg-amber-100 text-amber-800'
                            : offer.status === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Countered">Countered</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Withdrawn">Withdrawn</option>
                      </select>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => openModal(offer)}
                        className="p-1.5 text-gray-400 hover:text-[#1b4332]"
                        title="Edit Offer"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete offer record?')) {
                            await deleteOffer(offer.id);
                            showToast('Offer removed.', 'success');
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600"
                        title="Delete Offer"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#faf9f5] rounded-3xl w-full max-w-lg shadow-2xl border border-[#c5a059]/30 p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-base text-[#081c15]">
              {offerToEdit ? 'Edit Formal Offer' : 'Log Contract Purchase Offer'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold uppercase mb-1">Target Property *</label>
                <select
                  required
                  value={propertyId}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (${p.price.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase mb-1">Buyer / Client Name *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Lord Alistair Vance"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase mb-1">Assigned Advisory Broker *</label>
                  <select
                    required
                    value={assignedAgentId}
                    onChange={(e) => setAssignedAgentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  >
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase mb-1">Offer Amount ($) *</label>
                  <input
                    type="number"
                    required
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase mb-1">Asking Price ($) *</label>
                  <input
                    type="number"
                    required
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase mb-1">Earnest Deposit ($)</label>
                  <input
                    type="number"
                    value={earnestMoney}
                    onChange={(e) => setEarnestMoney(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase mb-1">Financing</label>
                  <select
                    value={financingType}
                    onChange={(e) => setFinancingType(e.target.value as FinancingType)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="Cash">Cash (Verified Funds)</option>
                    <option value="Conventional">Conventional Mortgage</option>
                    <option value="Jumbo">Jumbo Loan</option>
                    <option value="Private Equity">Private Equity / Family Office</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase mb-1">Offer Expiration Date</label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OfferStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Countered">Countered</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase mb-1">Contingencies & Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escrow deposit timeline, structural survey conditions, appraisal contingency..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1b4332] text-white font-semibold rounded-xl hover:bg-[#2d6a4f] transition"
                >
                  Save Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
