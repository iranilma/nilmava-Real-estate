import React, { useState } from 'react';
import {
  Plus,
  User,
  ChevronRight,
  ChevronLeft,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../contexts/ToastContext';
import { ListingOpportunity, ListingStage } from '../types/database';

interface ListingStageConfig {
  key: ListingStage;
  label: string;
  color: string;
}

const LISTING_STAGES: ListingStageConfig[] = [
  { key: 'new_opportunity', label: '1. New Lead', color: 'border-blue-400 bg-blue-50/50' },
  { key: 'valuation_pitch', label: '2. Valuation Pitch', color: 'border-cyan-400 bg-cyan-50/50' },
  { key: 'agreement_signed', label: '3. Mandate Signed', color: 'border-indigo-400 bg-indigo-50/50' },
  { key: 'staging_media', label: '4. Staging & 4K Media', color: 'border-amber-400 bg-amber-50/50' },
  { key: 'active_listing', label: '5. Active Marketing', color: 'border-emerald-500 bg-emerald-50/50' },
  { key: 'under_contract', label: '6. Under Contract', color: 'border-purple-400 bg-purple-50/50' },
  { key: 'closed_sold', label: '7. Closed / Sold', color: 'border-emerald-700 bg-emerald-100/50' },
  { key: 'withdrawn', label: '8. Withdrawn', color: 'border-gray-400 bg-gray-50/50' },
];

export const ListingPipelinePage: React.FC = () => {
  const {
    listingOpportunities,
    agents,
    clients,
    saveListingOpportunity,
    changeListingStage,
    deleteListingOpportunity,
  } = useOrganization();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [oppToEdit, setOppToEdit] = useState<ListingOpportunity | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerClientId, setSellerClientId] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [targetPrice, setTargetPrice] = useState<number>(5000000);
  const [valuationEstimate, setValuationEstimate] = useState<number>(4850000);
  const [commissionRate, setCommissionRate] = useState<number>(5.0);
  const [stage, setStage] = useState<ListingStage>('new_opportunity');
  const [notes, setNotes] = useState('');

  const totalListingValue = listingOpportunities
    .filter((o) => o.stage !== 'closed_sold' && o.stage !== 'withdrawn')
    .reduce((sum, o) => sum + o.target_price, 0);

  const openModal = (opp?: ListingOpportunity) => {
    if (opp) {
      setOppToEdit(opp);
      setTitle(opp.title);
      setSellerName(opp.seller_name);
      setSellerClientId(opp.seller_client_id);
      setAssignedAgentId(opp.assigned_agent_id);
      setTargetPrice(opp.target_price);
      setValuationEstimate(opp.valuation_estimate);
      setCommissionRate(opp.commission_rate);
      setStage(opp.stage);
      setNotes(opp.notes || '');
    } else {
      setOppToEdit(null);
      setTitle('');
      setSellerName('');
      setSellerClientId(clients.find((c) => c.client_type === 'Seller')?.id || '');
      setAssignedAgentId(agents[0]?.id || '');
      setTargetPrice(5000000);
      setValuationEstimate(4850000);
      setCommissionRate(5.0);
      setStage('new_opportunity');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !sellerName.trim()) return;

    try {
      await saveListingOpportunity({
        id: oppToEdit?.id,
        title: title.trim(),
        seller_name: sellerName.trim(),
        seller_client_id: sellerClientId || undefined,
        assigned_agent_id: assignedAgentId || agents[0]?.id,
        target_price: Number(targetPrice),
        valuation_estimate: Number(valuationEstimate),
        commission_rate: Number(commissionRate),
        stage,
        notes: notes.trim(),
      });
      showToast('Listing opportunity saved successfully.', 'success');
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const advanceStage = async (opp: ListingOpportunity, direction: 'forward' | 'backward') => {
    const stageKeys: ListingStage[] = [
      'new_opportunity',
      'valuation_pitch',
      'agreement_signed',
      'staging_media',
      'active_listing',
      'under_contract',
      'closed_sold',
    ];
    const currentIndex = stageKeys.indexOf(opp.stage);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= stageKeys.length) return;

    try {
      await changeListingStage(opp.id, stageKeys[nextIndex]);
      showToast(`Listing moved to ${stageKeys[nextIndex].replace('_', ' ')}.`, 'success');
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
              Seller Listing Pipeline & Mandate Progression
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1b4332]/10 text-[#1b4332]">
              {listingOpportunities.length} Tracked Mandates
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Track vendor acquisition from initial valuation and presentation to photography staging, active market launch, and closing.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#faf9f5] border border-gray-200">
            <span className="text-gray-500">Active Mandates: </span>
            <strong className="text-[#081c15]">${(totalListingValue / 1000000).toFixed(1)}M</strong>
          </div>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-[#1b4332] text-white font-semibold rounded-xl hover:bg-[#2d6a4f] shadow-xs transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Listing Opportunity</span>
          </button>
        </div>
      </div>

      {/* 8-Stage Listing Pipeline Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3 overflow-x-auto pb-4">
        {LISTING_STAGES.map((st) => {
          const stageOpps = listingOpportunities.filter((o) => o.stage === st.key);
          const stageVol = stageOpps.reduce((sum, o) => sum + o.target_price, 0);

          return (
            <div
              key={st.key}
              className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[480px] ${st.color}`}
            >
              <div>
                <div className="border-b border-gray-200 pb-2 mb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-[#081c15] leading-tight">{st.label}</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white font-bold text-gray-600 shadow-2xs">
                      {stageOpps.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-semibold mt-1">
                    ${(stageVol / 1000).toFixed(0)}k volume
                  </p>
                </div>

                <div className="space-y-2.5">
                  {stageOpps.map((opp) => {
                    const agent = agents.find((a) => a.id === opp.assigned_agent_id);

                    return (
                      <div
                        key={opp.id}
                        className="p-3 bg-white rounded-xl shadow-xs border border-gray-200 hover:border-[#c5a059] transition space-y-2 text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#081c15] line-clamp-1">{opp.title}</p>
                          <p className="text-sm font-bold font-serif text-[#1b4332] mt-0.5">
                            ${opp.target_price.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center space-x-1 text-[11px] text-gray-600">
                          <User className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">Seller: <strong>{opp.seller_name}</strong></span>
                        </div>

                        {agent && (
                          <div className="flex items-center space-x-1.5 text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                            <img
                              src={agent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop'}
                              alt={agent.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="truncate">{agent.name}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-gray-400">
                          <button
                            type="button"
                            onClick={() => advanceStage(opp, 'backward')}
                            className="p-1 hover:text-[#1b4332] hover:bg-gray-100 rounded"
                            title="Previous Stage"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => openModal(opp)}
                              className="p-1 hover:text-[#1b4332] hover:bg-gray-100 rounded"
                              title="Edit Opportunity"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Remove listing opportunity "${opp.title}"?`)) {
                                  await deleteListingOpportunity(opp.id);
                                  showToast('Listing opportunity removed.', 'success');
                                }
                              }}
                              className="p-1 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete Opportunity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => advanceStage(opp, 'forward')}
                            className="p-1 hover:text-[#1b4332] hover:bg-gray-100 rounded"
                            title="Advance Stage"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-gray-400 border-t border-gray-200/50 mt-2">
                Mandate Progression
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#faf9f5] rounded-3xl w-full max-w-lg shadow-2xl border border-[#c5a059]/30 p-6 space-y-4 text-xs">
            <h3 className="font-serif font-bold text-base text-[#081c15]">
              {oppToEdit ? 'Edit Listing Opportunity' : 'New Seller Listing Mandate'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold uppercase mb-1">Estate / Listing Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Holmby Hills Classic Manor"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase mb-1">Seller / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="e.g. Lord Alistair Vance"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase mb-1">Assigned Listing Specialist</label>
                  <select
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
                  <label className="block font-semibold uppercase mb-1">Target Asking Price ($) *</label>
                  <input
                    type="number"
                    required
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase mb-1">CMA Valuation Estimate ($)</label>
                  <input
                    type="number"
                    value={valuationEstimate}
                    onChange={(e) => setValuationEstimate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase mb-1">Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as ListingStage)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  >
                    {LISTING_STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase mb-1">Notes / Exclusive Period</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key terms, photographer schedule, exclusive period details..."
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
                  Save Listing Mandate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
