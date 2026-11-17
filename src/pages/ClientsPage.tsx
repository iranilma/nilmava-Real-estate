import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Search,
  Trash2,
  Edit2,
  Briefcase,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../contexts/ToastContext';
import { Client, ClientType } from '../types/database';
import { ClientModal } from '../components/modals/ClientModal';

interface ClientsPageProps {
  initialType?: ClientType | 'all';
  initialStatus?: string | 'all';
  pageTitle?: string;
  pageSubtitle?: string;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({
  initialType = 'all',
  initialStatus = 'all',
  pageTitle,
  pageSubtitle,
}) => {
  const { clients, agents, saveClient, deleteClient } = useOrganization();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(initialType);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  React.useEffect(() => {
    setTypeFilter(initialType);
  }, [initialType]);

  React.useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);

  const filteredClients = clients.filter((c) => {
    if (typeFilter !== 'all' && c.client_type !== typeFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.preferred_location && c.preferred_location.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalCapitalCapacity = clients.reduce((acc, c) => acc + (c.budget || 0), 0);
  const activeBuyers = clients.filter((c) => c.client_type === 'Buyer').length;
  const vipClients = clients.filter((c) => c.status === 'VIP').length;

  const handleEdit = (client: Client) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  const handleDelete = async (client: Client) => {
    if (!window.confirm(`Are you sure you want to remove client "${client.name}"?`)) return;
    try {
      await deleteClient(client.id);
      showToast(`Client ${client.name} removed from registry.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove client', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {pageTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-[#c5a059]/15">
          <div>
            <h2 className="text-xl font-bold font-serif text-[#081c15]">{pageTitle}</h2>
            {pageSubtitle && <p className="text-xs text-gray-500">{pageSubtitle}</p>}
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Client Registry
            </p>
            <h3 className="text-2xl font-bold font-serif text-[#081c15] mt-1">
              {clients.length} <span className="text-xs font-normal text-gray-400">Profiles</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#1b4332]/10 text-[#1b4332] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Acquisitions
            </p>
            <h3 className="text-2xl font-bold font-serif text-[#081c15] mt-1">
              {activeBuyers} <span className="text-xs font-normal text-gray-400">Buyers</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              VIP High-Net-Worth
            </p>
            <h3 className="text-2xl font-bold font-serif text-[#081c15] mt-1">
              {vipClients} <span className="text-xs font-normal text-gray-400">HNW Accounts</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Purchasing Capital
            </p>
            <h3 className="text-2xl font-bold font-serif text-[#081c15] mt-1">
              ${(totalCapitalCapacity / 1000000).toFixed(1)}M
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#c5a059]/20 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, location or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-3.5 py-2 text-sm rounded-xl border border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
          >
            <option value="all">All Classifications</option>
            <option value="Buyer">Buyers</option>
            <option value="Seller">Sellers</option>
            <option value="Investor">Investors</option>
            <option value="Tenant">Tenants</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active Search</option>
            <option value="VIP">VIP</option>
            <option value="Under Contract">Under Contract</option>
            <option value="Past Client">Past Client</option>
          </select>
        </div>

        <button
          onClick={() => {
            setClientToEdit(null);
            setIsModalOpen(true);
          }}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#1b4332] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-all shadow-md flex items-center justify-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Client</span>
        </button>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#faf9f5] border-b border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Client Profile</th>
                <th className="py-4 px-6">Type & Status</th>
                <th className="py-4 px-6">Target Location</th>
                <th className="py-4 px-6">Budget / Capacity</th>
                <th className="py-4 px-6">Assigned Broker</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.map((client) => {
                const assignedAgent = agents.find((a) => a.id === client.assigned_agent_id);

                return (
                  <tr key={client.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Profile */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#1b4332]/10 text-[#1b4332] font-serif font-bold flex items-center justify-center text-sm">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold font-serif text-[#081c15]">{client.name}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span>{client.email}</span>
                            </span>
                            {client.phone && (
                              <span className="flex items-center space-x-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span>{client.phone}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Classification */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`inline-block w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            client.client_type === 'Buyer'
                              ? 'bg-blue-50 text-blue-700'
                              : client.client_type === 'Seller'
                              ? 'bg-purple-50 text-purple-700'
                              : client.client_type === 'Investor'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {client.client_type}
                        </span>
                        <span
                          className={`text-[11px] font-medium ${
                            client.status === 'VIP'
                              ? 'text-amber-600 font-bold'
                              : client.status === 'Under Contract'
                              ? 'text-indigo-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {client.status}
                        </span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-6">
                      {client.preferred_location ? (
                        <div className="flex items-center space-x-1 text-xs text-gray-700">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{client.preferred_location}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unspecified</span>
                      )}
                    </td>

                    {/* Budget */}
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {client.budget ? (
                        <span>${client.budget.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Flexible</span>
                      )}
                    </td>

                    {/* Assigned Broker */}
                    <td className="py-4 px-6 text-xs text-gray-700">
                      {assignedAgent ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={assignedAgent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop'}
                            alt={assignedAgent.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="font-medium text-[#081c15]">{assignedAgent.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-1.5 text-gray-400 hover:text-[#1b4332] rounded-lg hover:bg-gray-100 transition-colors"
                          title="Edit Client"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium">No clients matching your search criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (clientData) => {
          await saveClient(clientData);
          showToast(`Client record for ${clientData.name} saved successfully.`, 'success');
        }}
        clientToEdit={clientToEdit}
        agents={agents}
      />
    </div>
  );
};
