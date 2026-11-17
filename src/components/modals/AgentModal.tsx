import React, { useState, useEffect } from 'react';
import { X, UserCheck, Mail, Phone, Award, DollarSign, Image } from 'lucide-react';
import { Agent } from '../../types/database';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Partial<Agent> & { name: string; role: string; email: string }) => Promise<void>;
  agentToEdit?: Agent | null;
}

export const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  agentToEdit,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Senior Broker');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [annualQuota, setAnnualQuota] = useState<number>(3000000);
  const [commissionSplitRate, setCommissionSplitRate] = useState<number>(50.0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (agentToEdit) {
      setName(agentToEdit.name);
      setRole(agentToEdit.role);
      setEmail(agentToEdit.email);
      setPhone(agentToEdit.phone || '');
      setAvatarUrl(agentToEdit.avatar_url || '');
      setAnnualQuota(agentToEdit.annual_quota || 3000000);
      setCommissionSplitRate(agentToEdit.commission_split_rate || 50.0);
      setIsActive(agentToEdit.is_active);
    } else {
      setName('');
      setRole('Senior Broker');
      setEmail('');
      setPhone('');
      setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop');
      setAnnualQuota(3000000);
      setCommissionSplitRate(50.0);
      setIsActive(true);
    }
  }, [agentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setIsSubmitting(true);
      await onSave({
        id: agentToEdit?.id,
        name: name.trim(),
        role: role.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
        annual_quota: Number(annualQuota),
        commission_split_rate: Number(commissionSplitRate),
        is_active: isActive,
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
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white tracking-wide">
                {agentToEdit ? 'Edit Broker Profile' : 'Onboard New Broker'}
              </h2>
              <p className="text-xs text-white/60">
                Manage commercial quota, commission split tiers, and license credentials.
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Full Name & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Broker Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Genevieve Laurent"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Agency Role / Title *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              >
                <option value="Senior Broker">Senior Broker</option>
                <option value="Luxury Specialist">Luxury Specialist</option>
                <option value="Listing Director">Listing Director</option>
                <option value="Associate Broker">Associate Broker</option>
                <option value="Commercial Director">Commercial Director</option>
                <option value="Principal Broker">Principal Broker</option>
              </select>
            </div>
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
                  placeholder="g.laurent@nilmava.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Direct Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (310) 555-0199"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>
            </div>
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              Portrait / Headshot Photo URL
            </label>
            <div className="relative">
              <Image className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              />
            </div>
          </div>

          {/* Quota & Split Settings */}
          <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
            <h3 className="text-xs font-bold text-[#1b4332] uppercase tracking-wider flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-[#c5a059]" />
              <span>Commercial Quota & Split Agreement</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Annual Sales Target ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="100000"
                    step="50000"
                    value={annualQuota}
                    onChange={(e) => setAnnualQuota(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contractual Split Rate (% to Broker)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="10"
                    max="90"
                    step="5"
                    value={commissionSplitRate}
                    onChange={(e) => setCommissionSplitRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold"
                  />
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                    Agency: {100 - commissionSplitRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-700">Account License Status</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1b4332]"></div>
                <span className="ml-3 text-xs font-semibold text-gray-700">
                  {isActive ? 'Active Broker' : 'Suspended'}
                </span>
              </label>
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
                <span>Saving Profile...</span>
              ) : (
                <span>{agentToEdit ? 'Save Changes' : 'Confirm & Onboard'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
