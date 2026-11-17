import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Phone, MapPin, DollarSign, Calendar } from 'lucide-react';
import { Client, Agent, ClientType } from '../../types/database';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client> & { name: string; email: string }) => Promise<void>;
  clientToEdit?: Client | null;
  agents: Agent[];
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clientToEdit,
  agents,
}) => {
  const [name, setName] = useState('');
  const [clientType, setClientType] = useState<ClientType>('Buyer');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [budget, setBudget] = useState<number>(2500000);
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [status, setStatus] = useState('Active');
  const [birthday, setBirthday] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setClientType(clientToEdit.client_type);
      setEmail(clientToEdit.email);
      setPhone(clientToEdit.phone || '');
      setPreferredLocation(clientToEdit.preferred_location || '');
      setBudget(clientToEdit.budget || 2500000);
      setAssignedAgentId(clientToEdit.assigned_agent_id || '');
      setStatus(clientToEdit.status || 'Active');
      setBirthday(clientToEdit.birthday || '');
    } else {
      setName('');
      setClientType('Buyer');
      setEmail('');
      setPhone('');
      setPreferredLocation('Beverly Hills');
      setBudget(2500000);
      setAssignedAgentId(agents[0]?.id || '');
      setStatus('Active');
      setBirthday('');
    }
  }, [clientToEdit, isOpen, agents]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setIsSubmitting(true);
      await onSave({
        id: clientToEdit?.id,
        name: name.trim(),
        client_type: clientType,
        email: email.trim(),
        phone: phone.trim(),
        preferred_location: preferredLocation.trim(),
        budget: Number(budget),
        assigned_agent_id: assignedAgentId || undefined,
        status,
        birthday: birthday || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#faf9f5] rounded-2xl w-full max-w-xl shadow-2xl border border-[#c5a059]/30 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#081c15] text-white px-6 py-5 flex items-center justify-between border-b border-[#c5a059]/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/20 flex items-center justify-center text-[#c5a059]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white tracking-wide">
                {clientToEdit ? 'Edit Client Profile' : 'Register New Client'}
              </h2>
              <p className="text-xs text-white/60">
                Track high-net-worth buyers, sellers, investors, and preferred acquisition criteria.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Client Type & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Client Classification *
              </label>
              <select
                value={clientType}
                onChange={(e) => setClientType(e.target.value as ClientType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              >
                <option value="Buyer">Buyer (Acquisition)</option>
                <option value="Seller">Seller (Vendor)</option>
                <option value="Investor">Institutional / Private Investor</option>
                <option value="Tenant">High-End Tenant</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              >
                <option value="Active">Active Search</option>
                <option value="VIP">VIP Client</option>
                <option value="Under Contract">Under Contract</option>
                <option value="Past Client">Past Client (Closed)</option>
                <option value="Inactive">Inactive / On Hold</option>
              </select>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              Client Full Name / Legal Entity *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lord Alistair Vance"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vance.family@office.co.uk"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 20 7946 0912"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>
            </div>
          </div>

          {/* Location & Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Target Location / Area
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  placeholder="e.g. Mayfair, Belgravia or Malibu"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Budget / Capital Capacity ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>
            </div>
          </div>

          {/* Assigned Broker & Birthday */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Assigned Advisory Broker
              </label>
              <select
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              >
                <option value="">-- Unassigned --</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Client Birthday / Anniversary
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#1b4332] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-all shadow-md flex items-center space-x-2"
            >
              {isSubmitting ? (
                <span>Saving Client...</span>
              ) : (
                <span>{clientToEdit ? 'Update Client' : 'Confirm & Save Client'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
