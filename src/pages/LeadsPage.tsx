import React, { useState, useEffect } from 'react';
import { Plus, Search, Flame, Edit3, Trash2 } from 'lucide-react';
import { Lead, Agent, LeadStatus } from '../types/database';
import { repository } from '../services/agencyRepository';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency } from '../utils/units';
import { LeadModal } from '../components/modals/LeadModal';

export const LeadsPage: React.FC = () => {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allLeads, allAgents] = await Promise.all([
        repository.getLeads(),
        repository.getAgents(),
      ]);
      setLeads(allLeads);
      setAgents(allAgents);
    } catch (err) {
      console.error('Failed to load leads', err);
    }
  };

  const handleSaveLead = async (data: any) => {
    try {
      await repository.saveLead(data);
      showToast(data.id ? 'Lead updated.' : 'Inbound lead registered.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save lead', 'error');
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (window.confirm(`Delete lead profile for "${name}"?`)) {
      try {
        await repository.deleteLead(id);
        showToast(`Lead "${name}" deleted.`, 'info');
        loadData();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete lead', 'error');
      }
    }
  };

  const filtered = leads.filter((l) => {
    if (
      search &&
      !(
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        (l.phone && l.phone.includes(search)) ||
        (l.property_interest && l.property_interest.toLowerCase().includes(search.toLowerCase()))
      )
    ) {
      return false;
    }
    if (statusFilter && l.status !== statusFilter) return false;
    if (sourceFilter && l.source !== sourceFilter) return false;
    if (agentFilter && l.assigned_agent_id !== agentFilter) return false;
    return true;
  });

  const statusBadgeClasses: Record<LeadStatus, string> = {
    New: 'bg-blue-50 text-blue-700 border-blue-200',
    Contacted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Qualified: 'bg-brand-goldLight text-brand-forest border-brand-gold/40',
    'Viewing Scheduled': 'bg-purple-50 text-purple-700 border-purple-200',
    Negotiation: 'bg-amber-50 text-amber-800 border-amber-200',
    'Closed Won': 'bg-emerald-50 text-emerald-800 border-emerald-300',
    Lost: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-brand-charcoal">
            Leads & Enquiries Management
          </h2>
          <p className="text-xs text-brand-slateText">
            Algorithmic lead heat scoring (0–100), acquisition channels, and follow-up SLA cadences.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedLead(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-brand-forest hover:bg-brand-forestLight text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Inbound Lead</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-brand-slateText" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lead name, email, phone, interest..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Viewing Scheduled">Viewing Scheduled</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Closed Won">Closed Won</option>
          <option value="Lost">Lost</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
        >
          <option value="">All Sources</option>
          <option value="Website">Website</option>
          <option value="Portal">Portal</option>
          <option value="Referral">Referral</option>
          <option value="Walk-in">Walk-in</option>
          <option value="Social">Social</option>
        </select>

        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
        >
          <option value="">All Brokers</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {(search || statusFilter || sourceFilter || agentFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setSourceFilter('');
              setAgentFilter('');
            }}
            className="text-xs text-brand-slateText hover:text-brand-charcoal font-medium px-2 py-1"
          >
            Reset
          </button>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-brand-ivoryDark overflow-hidden card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-ivory text-brand-charcoal font-semibold uppercase tracking-wider text-[11px] border-b border-brand-ivoryDark">
              <tr>
                <th className="py-3 px-4">Lead Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Assigned Broker</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Heat Score</th>
                <th className="py-3 px-4">Budget Range</th>
                <th className="py-3 px-4">Interest</th>
                <th className="py-3 px-4">Next Follow-up</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-ivoryDark">
              {filtered.map((l) => {
                const agt = agents.find((a) => a.id === l.assigned_agent_id);
                const badgeClass = statusBadgeClasses[l.status] || 'bg-slate-100 text-slate-700';
                const heat = l.heat_score || 50;
                const heatColor =
                  heat >= 70
                    ? 'text-rose-600 bg-rose-50 border-rose-200'
                    : heat >= 45
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-slate-600 bg-slate-50 border-slate-200';

                return (
                  <tr key={l.id} className="hover:bg-brand-ivory/50 transition">
                    <td className="py-3 px-4 font-semibold text-brand-charcoal">{l.name}</td>
                    <td className="py-3 px-4">
                      <div className="text-brand-charcoal">{l.email}</div>
                      <div className="text-[11px] text-brand-slateText">{l.phone || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-brand-ivory border border-brand-ivoryDark text-brand-slateText">
                        {l.source}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-brand-charcoal">{agt?.name || 'Unassigned'}</div>
                      <div className="text-[10px] text-brand-slateText">{agt?.role}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeClass}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-max ${heatColor}`}>
                        <Flame className="w-3 h-3" /> {heat}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-brand-forest tabular-nums">
                      {l.budget_max ? formatCurrency(l.budget_max) : 'Flexible'}
                    </td>
                    <td className="py-3 px-4 text-brand-slateText">{l.property_interest || 'General'}</td>
                    <td className="py-3 px-4 tabular-nums">
                      <span
                        className={
                          l.next_followup_date && l.next_followup_date <= '2026-11-16'
                            ? 'text-rose-600 font-bold'
                            : 'text-brand-slateText'
                        }
                      >
                        {l.next_followup_date || 'None'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedLead(l);
                          setIsModalOpen(true);
                        }}
                        className="p-1 hover:text-brand-forest transition"
                        title="Edit Lead"
                      >
                        <Edit3 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(l.id, l.name)}
                        className="p-1 text-rose-500 hover:text-rose-700 transition"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Modal */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLead}
        leadToEdit={selectedLead}
        agents={agents}
      />
    </div>
  );
};
