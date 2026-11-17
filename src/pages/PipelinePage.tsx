import React, { useState } from 'react';
import {
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Building,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../contexts/ToastContext';
import { Deal, PipelineStage } from '../types/database';

interface PipelineStageConfig {
  key: PipelineStage;
  label: string;
  prob: number;
  color: string;
}

const STAGES: PipelineStageConfig[] = [
  { key: 'new_enquiry', label: '1. New Enquiry', prob: 10, color: 'border-blue-400 bg-blue-50/50' },
  { key: 'contacted', label: '2. Contacted', prob: 20, color: 'border-cyan-400 bg-cyan-50/50' },
  { key: 'qualified', label: '3. Qualified', prob: 40, color: 'border-indigo-400 bg-indigo-50/50' },
  { key: 'viewing_scheduled', label: '4. Viewing Sched', prob: 50, color: 'border-amber-400 bg-amber-50/50' },
  { key: 'negotiation', label: '5. Negotiation', prob: 70, color: 'border-orange-400 bg-orange-50/50' },
  { key: 'offer_accepted', label: '6. Offer Accepted', prob: 90, color: 'border-emerald-400 bg-emerald-50/50' },
  { key: 'closed_won', label: '7. Closed Won', prob: 100, color: 'border-emerald-600 bg-emerald-100/50' },
  { key: 'closed_lost', label: '8. Closed Lost', prob: 0, color: 'border-red-400 bg-red-50/50' },
];

export const PipelinePage: React.FC = () => {
  const {
    deals,
    properties,
    clients,
    agents,
    saveDeal,
    changeDealStage,
    deleteDeal,
    saveTransaction,
  } = useOrganization();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);

  // Modals
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealToEdit, setDealToEdit] = useState<Deal | null>(null);
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [pendingLossDeal, setPendingLossDeal] = useState<Deal | null>(null);
  const [lossReason, setLossReason] = useState('Price Objection');
  const [isWonModalOpen, setIsWonModalOpen] = useState(false);
  const [pendingWonDeal, setPendingWonDeal] = useState<Deal | null>(null);

  // Form State for Deal
  const [formTitle, setFormTitle] = useState('');
  const [formValue, setFormValue] = useState<number>(3500000);
  const [formPropertyId, setFormPropertyId] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formAgentId, setFormAgentId] = useState('');
  const [formStage, setFormStage] = useState<PipelineStage>('new_enquiry');
  const [formCloseDate, setFormCloseDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Calculations
  const filteredDeals = deals.filter((d) => {
    if (selectedAgentFilter !== 'all' && d.assigned_agent_id !== selectedAgentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return d.title.toLowerCase().includes(q) || (d.notes && d.notes.toLowerCase().includes(q));
    }
    return true;
  });

  const totalPipelineValue = deals
    .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + d.deal_value, 0);

  const weightedPipelineValue = deals
    .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + d.deal_value * (d.probability_pct / 100), 0);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggingDealId(dealId);
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggingDealId;
    if (!dealId) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === targetStage) return;

    if (targetStage === 'closed_lost') {
      setPendingLossDeal(deal);
      setIsLossModalOpen(true);
      return;
    }

    if (targetStage === 'closed_won') {
      setPendingWonDeal(deal);
      setIsWonModalOpen(true);
      return;
    }

    try {
      await changeDealStage(dealId, targetStage);
      showToast(`Deal "${deal.title}" moved to ${targetStage.replace('_', ' ')}.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to change stage', 'error');
    } finally {
      setDraggingDealId(null);
    }
  };

  // Step movement
  const moveDealStep = async (deal: Deal, direction: 'forward' | 'backward') => {
    const stageOrder: PipelineStage[] = [
      'new_enquiry',
      'contacted',
      'qualified',
      'viewing_scheduled',
      'negotiation',
      'offer_accepted',
      'closed_won',
    ];
    const currentIndex = stageOrder.indexOf(deal.stage);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= stageOrder.length) return;

    const targetStage = stageOrder[nextIndex];
    if (targetStage === 'closed_won') {
      setPendingWonDeal(deal);
      setIsWonModalOpen(true);
      return;
    }

    try {
      await changeDealStage(deal.id, targetStage);
      showToast(`Deal moved to ${targetStage.replace('_', ' ')}.`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Confirm Loss
  const handleConfirmLoss = async () => {
    if (!pendingLossDeal) return;
    try {
      await saveDeal({
        ...pendingLossDeal,
        stage: 'closed_lost',
        probability_pct: 0,
        notes: `${pendingLossDeal.notes || ''}\n[Closed Lost Reason]: ${lossReason}`,
      });
      showToast(`Deal "${pendingLossDeal.title}" marked as Lost. Reason: ${lossReason}`, 'info');
      setIsLossModalOpen(false);
      setPendingLossDeal(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Confirm Win and Record Closing Settlement
  const handleConfirmWin = async () => {
    if (!pendingWonDeal) return;
    try {
      // 1. Mark deal Closed Won
      await changeDealStage(pendingWonDeal.id, 'closed_won');

      // 2. Automatically record closed settlement transaction
      const prop = properties.find((p) => p.id === pendingWonDeal.property_id);
      const agent = agents.find((a) => a.id === pendingWonDeal.assigned_agent_id);

      await saveTransaction({
        property_id: pendingWonDeal.property_id,
        property_title_snapshot: prop ? prop.title : pendingWonDeal.title,
        client_id: pendingWonDeal.client_id,
        agent_id: pendingWonDeal.assigned_agent_id,
        agent_name_snapshot: agent ? agent.name : 'Broker',
        closing_date: new Date().toISOString().split('T')[0],
        sale_price: pendingWonDeal.deal_value,
        notes: `Automated closing from pipeline deal ${pendingWonDeal.id}`,
      });

      showToast(`Congratulations! Deal closed won and financial settlement recorded with 50/50 split.`, 'success');
      setIsWonModalOpen(false);
      setPendingWonDeal(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openEditModal = (deal?: Deal) => {
    if (deal) {
      setDealToEdit(deal);
      setFormTitle(deal.title);
      setFormValue(deal.deal_value);
      setFormPropertyId(deal.property_id || '');
      setFormClientId(deal.client_id || '');
      setFormAgentId(deal.assigned_agent_id);
      setFormStage(deal.stage);
      setFormCloseDate(deal.expected_close_date || '');
      setFormNotes(deal.notes || '');
    } else {
      setDealToEdit(null);
      setFormTitle('');
      setFormValue(3500000);
      setFormPropertyId(properties[0]?.id || '');
      setFormClientId(clients[0]?.id || '');
      setFormAgentId(agents[0]?.id || '');
      setFormStage('new_enquiry');
      setFormCloseDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setFormNotes('');
    }
    setIsDealModalOpen(true);
  };

  const handleSaveDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAgentId) return;

    try {
      const stageConfig = STAGES.find((s) => s.key === formStage);
      await saveDeal({
        id: dealToEdit?.id,
        title: formTitle.trim(),
        property_id: formPropertyId || undefined,
        client_id: formClientId || undefined,
        assigned_agent_id: formAgentId,
        stage: formStage,
        deal_value: Number(formValue),
        probability_pct: stageConfig ? stageConfig.prob : 50,
        expected_close_date: formCloseDate || undefined,
        notes: formNotes.trim(),
      });
      showToast('Opportunity saved successfully.', 'success');
      setIsDealModalOpen(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Strip */}
      <div className="bg-white p-6 rounded-3xl border border-[#c5a059]/20 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-serif font-bold text-[#081c15]">
              8-Stage Interactive Sales Kanban Pipeline
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1b4332]/10 text-[#1b4332]">
              HTML5 Drag & Drop Active
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Drag cards between columns or use quick stage navigation. Closed Won automatically records financial settlement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#faf9f5] border border-gray-200 text-xs">
            <span className="text-gray-500">Gross Pipeline: </span>
            <strong className="text-[#081c15]">${(totalPipelineValue / 1000000).toFixed(2)}M</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <span className="text-emerald-800">Weighted Value: </span>
            <strong className="text-emerald-950">${(weightedPipelineValue / 1000000).toFixed(2)}M</strong>
          </div>
          <button
            onClick={() => openEditModal()}
            className="px-4 py-2 bg-[#1b4332] text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-[#2d6a4f] transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Opportunity</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Agent Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search opportunity title or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 w-full focus:outline-none focus:ring-1 focus:ring-[#1b4332]"
            />
          </div>

          <select
            value={selectedAgentFilter}
            onChange={(e) => setSelectedAgentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 bg-white"
          >
            <option value="all">All Brokers ({deals.length})</option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-gray-400 italic">
          Tip: Drag cards across columns or click arrows to advance stages
        </span>
      </div>

      {/* 8-Stage Kanban Columns Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = filteredDeals.filter((d) => d.stage === stage.key);
          const stageVolume = stageDeals.reduce((sum, d) => sum + d.deal_value, 0);

          return (
            <div
              key={stage.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
              className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[500px] transition-colors ${stage.color}`}
            >
              <div>
                {/* Column Header */}
                <div className="border-b border-gray-200 pb-2 mb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-[#081c15] leading-tight">
                      {stage.label}
                    </h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white font-bold text-gray-600 shadow-2xs">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                    <span className="font-semibold text-[#1b4332]">${(stageVolume / 1000).toFixed(0)}k</span>
                    <span className="text-gray-400 font-mono">{stage.prob}% prob</span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5">
                  {stageDeals.map((deal) => {
                    const agent = agents.find((a) => a.id === deal.assigned_agent_id);
                    const prop = properties.find((p) => p.id === deal.property_id);

                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        className="p-3 bg-white rounded-xl shadow-xs border border-gray-200 hover:border-[#c5a059] transition-all cursor-grab active:cursor-grabbing space-y-2 text-xs"
                      >
                        {/* Title & Price */}
                        <div>
                          <p className="font-bold text-[#081c15] line-clamp-1">{deal.title}</p>
                          <p className="text-sm font-bold font-serif text-[#1b4332] mt-0.5">
                            ${deal.deal_value.toLocaleString()}
                          </p>
                        </div>

                        {/* Linked Property or Client */}
                        {prop && (
                          <div className="flex items-center space-x-1 text-[11px] text-gray-500">
                            <Building className="w-3 h-3 text-[#c5a059] shrink-0" />
                            <span className="truncate">{prop.title}</span>
                          </div>
                        )}

                        {/* Broker Avatar */}
                        {agent && (
                          <div className="flex items-center space-x-1.5 text-[10px] text-gray-600 pt-1 border-t border-gray-100">
                            <img
                              src={agent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop'}
                              alt={agent.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="truncate">{agent.name}</span>
                          </div>
                        )}

                        {/* Card Controls & Navigation chevrons */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-gray-400">
                          <button
                            type="button"
                            onClick={() => moveDealStep(deal, 'backward')}
                            className="p-1 hover:text-[#1b4332] hover:bg-gray-100 rounded transition"
                            title="Move backwards"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(deal)}
                              className="p-1 hover:text-[#1b4332] hover:bg-gray-100 rounded transition"
                              title="Edit Opportunity"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Remove deal "${deal.title}"?`)) {
                                  await deleteDeal(deal.id);
                                  showToast('Deal removed.', 'success');
                                }
                              }}
                              className="p-1 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete Deal"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => moveDealStep(deal, 'forward')}
                            className="p-1 hover:text-[#1b4332] hover:bg-gray-100 rounded transition"
                            title="Advance forward"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column Footer */}
              <div className="pt-2 text-center text-[10px] text-gray-400 border-t border-gray-200/50 mt-2">
                Drop here to update stage
              </div>
            </div>
          );
        })}
      </div>

      {/* Closed Lost Reason Modal */}
      {isLossModalOpen && pendingLossDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#faf9f5] rounded-3xl w-full max-w-md shadow-2xl border border-red-200 p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-red-600 font-serif font-bold text-base">
              <XCircle className="w-5 h-5" />
              <span>Record Deal Loss Reason</span>
            </div>
            <p className="text-gray-600">
              Moving <strong>{pendingLossDeal.title}</strong> (${pendingLossDeal.deal_value.toLocaleString()}) to Closed Lost requires capturing business intelligence.
            </p>
            <div>
              <label className="block font-semibold uppercase mb-1">Primary Reason for Lost Opportunity *</label>
              <select
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
              >
                <option value="Price Objection / Overpriced">Price Objection / Overpriced</option>
                <option value="Lost to Competitor Agency">Lost to Competitor Agency</option>
                <option value="Buyer Financing Fell Through">Buyer Financing Fell Through</option>
                <option value="Inspection Issues / Title Cloud">Inspection Issues / Title Cloud</option>
                <option value="Buyer Decided Not to Relocate">Buyer Decided Not to Relocate</option>
                <option value="Vendor Withdrew Property">Vendor Withdrew Property</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLossModalOpen(false);
                  setPendingLossDeal(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLoss}
                className="px-5 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition"
              >
                Confirm Lost Deal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Closed Won Settlement Confirmation Modal */}
      {isWonModalOpen && pendingWonDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#faf9f5] rounded-3xl w-full max-w-md shadow-2xl border border-emerald-300 p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-emerald-800 font-serif font-bold text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Execute Deal Closing & Settlement</span>
            </div>
            <p className="text-gray-600">
              Closing <strong>{pendingWonDeal.title}</strong> will mark the opportunity as <strong>Closed Won</strong>, toggle the linked property to <strong>Sold</strong>, and log a permanent audited financial settlement.
            </p>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
              <div className="flex justify-between font-bold text-emerald-900">
                <span>Sale Settlement Value:</span>
                <span>${pendingWonDeal.deal_value.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Gross Commission (5.0%):</span>
                <span>${(pendingWonDeal.deal_value * 0.05).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-semibold pt-1 border-t border-emerald-200">
                <span>Agency Retained (50%):</span>
                <span>${(pendingWonDeal.deal_value * 0.05 * 0.5).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsWonModalOpen(false);
                  setPendingWonDeal(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWin}
                className="px-5 py-2 bg-[#1b4332] text-white font-semibold rounded-xl hover:bg-[#2d6a4f] transition"
              >
                Confirm & Record Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Deal Modal */}
      {isDealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#faf9f5] rounded-3xl w-full max-w-lg shadow-2xl border border-[#c5a059]/30 p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-base text-[#081c15]">
              {dealToEdit ? 'Edit Opportunity' : 'Add Opportunity to Pipeline'}
            </h3>
            <form onSubmit={handleSaveDealSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold uppercase mb-1">Opportunity Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Penthouse Acquisition"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase mb-1">Deal Value ($) *</label>
                  <input
                    type="number"
                    required
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase mb-1">Pipeline Stage *</label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value as PipelineStage)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label} ({s.prob}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase mb-1">Linked Property</label>
                  <select
                    value={formPropertyId}
                    onChange={(e) => setFormPropertyId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="">-- None --</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold uppercase mb-1">Linked Client</label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  >
                    <option value="">-- None --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase mb-1">Assigned Broker *</label>
                  <select
                    required
                    value={formAgentId}
                    onChange={(e) => setFormAgentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  >
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold uppercase mb-1">Expected Closing Date</label>
                  <input
                    type="date"
                    value={formCloseDate}
                    onChange={(e) => setFormCloseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Financing pre-approval details, survey contingencies, escrow notes..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsDealModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1b4332] text-white font-semibold rounded-xl hover:bg-[#2d6a4f] transition"
                >
                  Save Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
