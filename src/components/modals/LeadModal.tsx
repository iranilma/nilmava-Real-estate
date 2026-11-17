import React, { useState, useEffect } from 'react';
import { X, UserPlus, Flame } from 'lucide-react';
import { Lead, Agent, LeadSource, LeadStatus } from '../../types/database';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Partial<Lead> & { name: string; email: string }) => Promise<void>;
  leadToEdit?: Lead | null;
  agents: Agent[];
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  leadToEdit,
  agents,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<LeadSource>('Website');
  const [leadType, setLeadType] = useState('Buyer');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [budgetMin, setBudgetMin] = useState<number | undefined>(undefined);
  const [budgetMax, setBudgetMax] = useState<number | undefined>(undefined);
  const [propertyInterest, setPropertyInterest] = useState('');
  const [timeline, setTimeline] = useState('0-3 mo');
  const [isPreapproved, setIsPreapproved] = useState(false);
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (leadToEdit) {
      setName(leadToEdit.name);
      setEmail(leadToEdit.email);
      setPhone(leadToEdit.phone || '');
      setSource(leadToEdit.source);
      setLeadType(leadToEdit.lead_type || 'Buyer');
      setStatus(leadToEdit.status);
      setAssignedAgentId(leadToEdit.assigned_agent_id || '');
      setBudgetMin(leadToEdit.budget_min);
      setBudgetMax(leadToEdit.budget_max);
      setPropertyInterest(leadToEdit.property_interest || '');
      setTimeline(leadToEdit.timeline || '3-6 mo');
      setIsPreapproved(leadToEdit.is_preapproved);
      setNextFollowupDate(leadToEdit.next_followup_date || '');
      setNotes(leadToEdit.notes || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setSource('Website');
      setLeadType('Buyer');
      setStatus('New');
      setAssignedAgentId(agents[0]?.id || '');
      setBudgetMin(1000000);
      setBudgetMax(2500000);
      setPropertyInterest('');
      setTimeline('0-3 mo');
      setIsPreapproved(true);
      setNextFollowupDate(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
      setNotes('');
    }
  }, [leadToEdit, isOpen, agents]);

  // Compute live heat score preview
  const calculateHeatScore = (): number => {
    let score = 20; // base score
    if (timeline === '0-3 mo') score += 30;
    else if (timeline === '3-6 mo') score += 20;
    else if (timeline === '6-12 mo') score += 10;
    if (isPreapproved) score += 20;
    if (status === 'Viewing Scheduled' || status === 'Negotiation') score += 15;
    else if (status === 'Qualified') score += 10;
    if (budgetMax && budgetMax >= 2000000) score += 10;
    return Math.min(100, Math.max(0, score));
  };

  const heatScore = calculateHeatScore();
  const heatLabel = heatScore >= 70 ? 'Hot' : heatScore >= 45 ? 'Warm' : 'Cool';
  const heatColor =
    heatScore >= 70
      ? 'text-rose-600 bg-rose-50 border-rose-200'
      : heatScore >= 45
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-slate-600 bg-slate-50 border-slate-200';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      id: leadToEdit?.id,
      name,
      email,
      phone,
      source,
      lead_type: leadType,
      status,
      assigned_agent_id: assignedAgentId,
      budget_min: budgetMin,
      budget_max: budgetMax,
      property_interest: propertyInterest,
      timeline,
      is_preapproved: isPreapproved,
      heat_score: heatScore,
      next_followup_date: nextFollowupDate,
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
            <span className="w-8 h-8 rounded-lg bg-brand-goldLight text-brand-forest flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </span>
            <h3 className="font-display font-bold text-base text-brand-charcoal">
              {leadToEdit ? `Edit Lead (${leadToEdit.name})` : 'Register Inbound Lead'}
            </h3>
          </div>
          <button onClick={onClose} className="text-brand-slateText hover:text-brand-charcoal p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-brand-charcoal mb-1">Lead Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jonathan Wright"
              className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@domain.com"
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 234-5678"
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
              >
                <option value="Website">Website</option>
                <option value="Portal">Portal (Zillow/Realtor)</option>
                <option value="Referral">Referral</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Social">Social</option>
                <option value="Sign Call">Sign Call</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Viewing Scheduled">Viewing Scheduled</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Assigned Broker</label>
              <select
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
              >
                <option value="">Unassigned</option>
                {agents.map((agt) => (
                  <option key={agt.id} value={agt.id}>
                    {agt.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Next Follow-up</label>
              <input
                type="date"
                value={nextFollowupDate}
                onChange={(e) => setNextFollowupDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Budget Max ($)</label>
              <input
                type="number"
                value={budgetMax || ''}
                onChange={(e) => setBudgetMax(parseFloat(e.target.value) || undefined)}
                placeholder="2500000"
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Property Interest</label>
              <input
                type="text"
                value={propertyInterest}
                onChange={(e) => setPropertyInterest(e.target.value)}
                placeholder="e.g. Bel-Air Estate"
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>

          {/* Heat Score Preview Card */}
          <div className="p-3 bg-brand-ivory rounded-xl border border-brand-ivoryDark flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${heatColor}`}>
                <Flame className="w-3.5 h-3.5" /> {heatScore} / 100 ({heatLabel})
              </span>
              <span className="text-[11px] text-brand-slateText">Algorithmic Heat Score</span>
            </div>
            <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-medium text-brand-charcoal">
              <input
                type="checkbox"
                checked={isPreapproved}
                onChange={(e) => setIsPreapproved(e.target.checked)}
                className="rounded text-brand-forest focus:ring-brand-gold"
              />
              <span>Pre-Approved Buyer</span>
            </label>
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
              Save Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
