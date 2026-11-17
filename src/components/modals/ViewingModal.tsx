import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Building, User, Star } from 'lucide-react';
import { Viewing, Property, Client, Agent, ViewingStatus } from '../../types/database';

interface ViewingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (viewing: Partial<Viewing> & {
    property_id: string;
    assigned_agent_id: string;
    viewing_date: string;
    viewing_time: string;
  }) => Promise<void>;
  viewingToEdit?: Viewing | null;
  properties: Property[];
  clients: Client[];
  agents: Agent[];
}

export const ViewingModal: React.FC<ViewingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  viewingToEdit,
  properties,
  clients,
  agents,
}) => {
  const [propertyId, setPropertyId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [viewingDate, setViewingDate] = useState('');
  const [viewingTime, setViewingTime] = useState('14:00');
  const [status, setStatus] = useState<ViewingStatus>('Scheduled');
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (viewingToEdit) {
      setPropertyId(viewingToEdit.property_id);
      setClientId(viewingToEdit.client_id || '');
      setClientName(viewingToEdit.client_name || '');
      setAssignedAgentId(viewingToEdit.assigned_agent_id);
      setViewingDate(viewingToEdit.viewing_date);
      setViewingTime(viewingToEdit.viewing_time || '14:00');
      setStatus(viewingToEdit.status);
      setRating(viewingToEdit.rating || 0);
      setFeedback(viewingToEdit.feedback || '');
    } else {
      setPropertyId(properties[0]?.id || '');
      setClientId(clients[0]?.id || '');
      setClientName(clients[0]?.name || '');
      setAssignedAgentId(agents[0]?.id || '');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setViewingDate(tomorrow.toISOString().split('T')[0]);
      setViewingTime('14:00');
      setStatus('Scheduled');
      setRating(0);
      setFeedback('');
    }
  }, [viewingToEdit, isOpen, properties, clients, agents]);

  if (!isOpen) return null;

  const handleClientChange = (cId: string) => {
    setClientId(cId);
    const cl = clients.find((c) => c.id === cId);
    if (cl) setClientName(cl.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !assignedAgentId || !viewingDate) return;

    try {
      setIsSubmitting(true);
      await onSave({
        id: viewingToEdit?.id,
        property_id: propertyId,
        client_id: clientId || undefined,
        client_name: clientName || undefined,
        assigned_agent_id: assignedAgentId,
        viewing_date: viewingDate,
        viewing_time: viewingTime,
        status,
        rating: Number(rating),
        feedback: feedback.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#faf9f5] rounded-2xl w-full max-w-lg shadow-2xl border border-[#c5a059]/30 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#081c15] text-white px-6 py-5 flex items-center justify-between border-b border-[#c5a059]/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/20 flex items-center justify-center text-[#c5a059]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white tracking-wide">
                {viewingToEdit ? 'Manage Property Showing' : 'Schedule Private Showing'}
              </h2>
              <p className="text-xs text-white/60">
                Coordinate client viewing times, broker attendance, and feedback ratings.
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
          {/* Target Property */}
          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Building className="w-4 h-4 text-[#c5a059]" />
              <span>Target Estate / Listing *</span>
            </label>
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.ref_code}) — ${p.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Client Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <User className="w-4 h-4 text-[#c5a059]" />
                <span>Existing Client</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              >
                <option value="">-- Custom Attendee --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.client_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Attendee Name (Snapshot)
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client Name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              />
            </div>
          </div>

          {/* Attending Broker */}
          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              Attending Advisory Broker *
            </label>
            <select
              required
              value={assignedAgentId}
              onChange={(e) => setAssignedAgentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.role}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Showing Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  required
                  value={viewingDate}
                  onChange={(e) => setViewingDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Appointment Time *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="time"
                  required
                  value={viewingTime}
                  onChange={(e) => setViewingTime(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>
            </div>
          </div>

          {/* Status & Rating */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Showing Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ViewingStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No-Show">No-Show</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Client Interest Rating (0–5 Stars)
              </label>
              <div className="flex items-center space-x-1 py-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star === rating ? 0 : star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-[#c5a059] fill-[#c5a059]'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-gray-500 font-semibold ml-2">
                  {rating > 0 ? `${rating}/5 Stars` : 'Unrated'}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback & Client Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              Viewing Debrief & Client Feedback
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Record client impressions, pricing objections, amenity preferences, or follow-up offer timeline..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332] resize-none"
            />
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
                <span>Scheduling...</span>
              ) : (
                <span>{viewingToEdit ? 'Update Showing' : 'Confirm & Schedule'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
