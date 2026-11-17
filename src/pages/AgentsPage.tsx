import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  DollarSign,
  Award,
  TrendingUp,
  AlertCircle,
  Building,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../contexts/ToastContext';
import { Agent } from '../types/database';
import { AgentModal } from '../components/modals/AgentModal';

export const AgentsPage: React.FC = () => {
  const {
    agents,
    properties,
    deals,
    transactions,
    viewings,
    saveAgent,
    deleteAgent,
    toggleAgentActive,
  } = useOrganization();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Performance calculations per agent
  const getAgentMetrics = (agentId: string, agentName: string) => {
    const closedTxs = transactions.filter(
      (tx) => tx.agent_id === agentId || tx.agent_name_snapshot === agentName
    );
    const closedVolume = closedTxs.reduce((sum, tx) => sum + tx.sale_price, 0);
    const commissionEarned = closedTxs.reduce((sum, tx) => sum + tx.agent_share, 0);
    const activeListings = properties.filter(
      (p) => p.assigned_agent_id === agentId && p.status === 'Available'
    ).length;
    const scheduledViewings = viewings.filter(
      (v) => v.assigned_agent_id === agentId && v.status === 'Scheduled'
    ).length;
    const pipelineDeals = deals.filter(
      (d) => d.assigned_agent_id === agentId && d.stage !== 'closed_won' && d.stage !== 'closed_lost'
    ).length;

    return {
      closedTxsCount: closedTxs.length,
      closedVolume,
      commissionEarned,
      activeListings,
      scheduledViewings,
      pipelineDeals,
    };
  };

  const filteredAgents = agents.filter((agent) => {
    if (filterActive === 'active' && !agent.is_active) return false;
    if (filterActive === 'inactive' && agent.is_active) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        agent.name.toLowerCase().includes(q) ||
        agent.email.toLowerCase().includes(q) ||
        agent.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalVolume = transactions.reduce((acc, tx) => acc + tx.sale_price, 0);
  const totalCommission = transactions.reduce((acc, tx) => acc + tx.agent_share, 0);

  const handleEdit = (agent: Agent) => {
    setAgentToEdit(agent);
    setIsModalOpen(true);
  };

  const handleToggle = async (agent: Agent) => {
    try {
      await toggleAgentActive(agent.id);
      showToast(
        `Broker ${agent.name} marked as ${!agent.is_active ? 'Active' : 'Suspended'}.`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update broker status', 'error');
    }
  };

  const handleDelete = async (agent: Agent) => {
    if (
      !window.confirm(
        `Are you sure you want to remove broker "${agent.name}"? If historical transactions exist, deactivation is recommended instead.`
      )
    ) {
      return;
    }
    try {
      await deleteAgent(agent.id);
      showToast(`Broker profile for ${agent.name} successfully deleted.`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Advisory Team
            </p>
            <h3 className="text-2xl font-bold font-serif text-[#081c15] mt-1">
              {agents.filter((a) => a.is_active).length}{' '}
              <span className="text-xs text-gray-400 font-sans font-normal">
                / {agents.length} Total
              </span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#1b4332]/10 text-[#1b4332] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Sales Closed
            </p>
            <h3 className="text-2xl font-bold font-serif text-[#081c15] mt-1">
              ${(totalVolume / 1000000).toFixed(1)}M
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Broker Commissions
            </p>
            <h3 className="text-2xl font-bold font-serif text-[#081c15] mt-1">
              ${(totalCommission / 1000).toFixed(0)}k
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Portfolio
            </p>
            <h3 className="text-2xl font-bold font-serif text-[#081c15] mt-1">
              {properties.filter((p) => p.status === 'Available').length} Estates
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#2d6a4f]/10 text-[#2d6a4f] flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#c5a059]/20 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search brokers by name, email or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 text-sm rounded-xl border border-gray-300 w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
          />

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                filterActive === 'all'
                  ? 'bg-white text-[#081c15] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All ({agents.length})
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                filterActive === 'active'
                  ? 'bg-white text-[#081c15] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Active ({agents.filter((a) => a.is_active).length})
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                filterActive === 'inactive'
                  ? 'bg-white text-[#081c15] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Suspended ({agents.filter((a) => !a.is_active).length})
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setAgentToEdit(null);
            setIsModalOpen(true);
          }}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#1b4332] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-all shadow-md flex items-center justify-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Onboard Broker</span>
        </button>
      </div>

      {/* Broker Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => {
          const metrics = getAgentMetrics(agent.id, agent.name);
          const quotaPct = Math.min(
            100,
            Math.round((metrics.closedVolume / (agent.annual_quota || 3000000)) * 100)
          );

          return (
            <div
              key={agent.id}
              className={`bg-white rounded-2xl border transition-all hover:shadow-lg overflow-hidden flex flex-col justify-between ${
                agent.is_active
                  ? 'border-gray-200 hover:border-[#c5a059]/40'
                  : 'border-red-200 bg-gray-50/60 opacity-80'
              }`}
            >
              <div>
                {/* Card Header & Avatar */}
                <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={agent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'}
                      alt={agent.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#c5a059]/30"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-bold font-serif text-[#081c15]">
                          {agent.name}
                        </h4>
                        {!agent.is_active && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                            Suspended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#c5a059] font-medium">{agent.role}</p>
                      <span className="text-[11px] text-gray-400 font-mono">{agent.id}</span>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded-lg text-gray-700">
                    {agent.commission_split_rate}% Split
                  </span>
                </div>

                {/* Contact Info */}
                <div className="px-6 py-3 bg-[#faf9f5]/50 border-b border-gray-100 space-y-1 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{agent.email}</span>
                  </div>
                  {agent.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{agent.phone}</span>
                    </div>
                  )}
                </div>

                {/* Quota Progress */}
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-600 flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>Annual Target Attainment</span>
                      </span>
                      <span className="font-bold text-[#1b4332]">{quotaPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#1b4332] to-[#c5a059] rounded-full transition-all duration-500"
                        style={{ width: `${quotaPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                      <span>Closed: ${(metrics.closedVolume / 1000000).toFixed(2)}M</span>
                      <span>Target: ${(agent.annual_quota / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>

                  {/* Micro KPIs */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
                    <div className="p-2 rounded-xl bg-gray-50">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Active Listings</p>
                      <p className="text-base font-bold text-[#081c15] mt-0.5">
                        {metrics.activeListings}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Showings</p>
                      <p className="text-base font-bold text-[#081c15] mt-0.5">
                        {metrics.scheduledViewings}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Deals Won</p>
                      <p className="text-base font-bold text-[#1b4332] mt-0.5">
                        {metrics.closedTxsCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleToggle(agent)}
                  className={`font-semibold hover:underline ${
                    agent.is_active ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {agent.is_active ? 'Suspend Account' : 'Reactivate'}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(agent)}
                    className="px-3 py-1 rounded-lg bg-white border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => handleDelete(agent)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete broker profile (audit protected)"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <AgentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (agentData) => {
          await saveAgent(agentData);
          showToast(`Broker profile for ${agentData.name} saved successfully.`, 'success');
        }}
        agentToEdit={agentToEdit}
      />
    </div>
  );
};
