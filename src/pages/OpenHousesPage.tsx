import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  User,
  Trash2,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../contexts/ToastContext';
import { OpenHouse, OpenHouseStatus } from '../types/database';

export const OpenHousesPage: React.FC = () => {
  const { openHouses, properties, agents, saveOpenHouse, deleteOpenHouse } = useOrganization();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ohToEdit, setOhToEdit] = useState<OpenHouse | null>(null);

  // Form
  const [propertyId, setPropertyId] = useState('');
  const [hostAgentId, setHostAgentId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('16:00');
  const [visitorCount, setVisitorCount] = useState<number>(15);
  const [leadsCaptured, setLeadsCaptured] = useState<number>(5);
  const [status, setStatus] = useState<OpenHouseStatus>('Scheduled');
  const [refreshments, setRefreshments] = useState('');
  const [feedback, setFeedback] = useState('');

  const filtered = openHouses;

  const totalVisitors = openHouses.reduce((sum, oh) => sum + oh.visitor_count, 0);
  const totalLeads = openHouses.reduce((sum, oh) => sum + oh.leads_captured, 0);

  const openModal = (oh?: OpenHouse) => {
    if (oh) {
      setOhToEdit(oh);
      setPropertyId(oh.property_id);
      setHostAgentId(oh.host_agent_id);
      setEventDate(oh.event_date);
      setStartTime(oh.start_time);
      setEndTime(oh.end_time);
      setVisitorCount(oh.visitor_count);
      setLeadsCaptured(oh.leads_captured);
      setStatus(oh.status);
      setRefreshments(oh.refreshments_notes || '');
      setFeedback(oh.feedback_summary || '');
    } else {
      setOhToEdit(null);
      setPropertyId(properties[0]?.id || '');
      setHostAgentId(agents[0]?.id || '');
      const nextSat = new Date();
      nextSat.setDate(nextSat.getDate() + ((6 - nextSat.getDay() + 7) % 7 || 7));
      setEventDate(nextSat.toISOString().split('T')[0]);
      setStartTime('13:00');
      setEndTime('16:00');
      setVisitorCount(15);
      setLeadsCaptured(5);
      setStatus('Scheduled');
      setRefreshments('Champagne reception & artisan canapés');
      setFeedback('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !hostAgentId || !eventDate) return;

    const prop = properties.find((p) => p.id === propertyId);
    try {
      await saveOpenHouse({
        id: ohToEdit?.id,
        property_id: propertyId,
        property_title: prop ? prop.title : 'Luxury Property Showing',
        host_agent_id: hostAgentId,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        visitor_count: Number(visitorCount),
        leads_captured: Number(leadsCaptured),
        status,
        refreshments_notes: refreshments.trim(),
        feedback_summary: feedback.trim(),
      });
      showToast('Open house event saved successfully.', 'success');
      setIsModalOpen(false);
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
              Open House Event Management
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1b4332]/10 text-[#1b4332]">
              {openHouses.length} Scheduled Events
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Coordinate luxury open house events, hospitality catering, host broker schedules, and attendee lead capture.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#faf9f5] border border-gray-200">
            <span className="text-gray-500">Total Visitors: </span>
            <strong className="text-[#081c15]">{totalVisitors} Attendees</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-800">Leads Captured: </span>
            <strong className="text-emerald-950">{totalLeads} Buyer Profiles</strong>
          </div>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-[#1b4332] text-white font-semibold rounded-xl hover:bg-[#2d6a4f] shadow-xs transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Open House</span>
          </button>
        </div>
      </div>

      {/* Grid of Open House Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((oh) => {
          const agent = agents.find((a) => a.id === oh.host_agent_id);

          return (
            <div
              key={oh.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {oh.status}
                    </span>
                    <h3 className="font-serif font-bold text-base text-[#081c15] mt-1.5 line-clamp-1">
                      {oh.property_title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#c5a059]">{oh.id}</span>
                </div>

                <div className="pt-3 space-y-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-[#c5a059]" />
                    <span className="font-semibold text-[#081c15]">{oh.event_date}</span>
                    <span className="text-gray-400">({oh.start_time} - {oh.end_time})</span>
                  </div>

                  {agent && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>Host Broker: <strong>{agent.name}</strong></span>
                    </div>
                  )}

                  {oh.refreshments_notes && (
                    <p className="text-[11px] text-gray-500 italic mt-1">
                      🥂 {oh.refreshments_notes}
                    </p>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 text-center">
                  <div className="p-2 rounded-xl bg-gray-50">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Attendees</p>
                    <p className="text-base font-bold text-[#081c15] mt-0.5">{oh.visitor_count}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50">
                    <p className="text-[10px] text-emerald-800 uppercase font-semibold">Leads Captured</p>
                    <p className="text-base font-bold text-emerald-900 mt-0.5">{oh.leads_captured}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => openModal(oh)}
                  className="font-semibold text-gray-700 hover:text-[#1b4332]"
                >
                  Edit Event
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Delete open house event?')) {
                      await deleteOpenHouse(oh.id);
                      showToast('Open house event removed.', 'success');
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
              {ohToEdit ? 'Edit Open House' : 'Schedule New Open House Event'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold uppercase mb-1">Estate / Property *</label>
                <select
                  required
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
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
                  <label className="block font-semibold uppercase mb-1">Host Advisory Broker *</label>
                  <select
                    required
                    value={hostAgentId}
                    onChange={(e) => setHostAgentId(e.target.value)}
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
                  <label className="block font-semibold uppercase mb-1">Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase mb-1">Expected Visitors</label>
                  <input
                    type="number"
                    value={visitorCount}
                    onChange={(e) => setVisitorCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase mb-1">Leads Captured</label>
                  <input
                    type="number"
                    value={leadsCaptured}
                    onChange={(e) => setLeadsCaptured(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase mb-1">Hospitality / Refreshments Notes</label>
                <input
                  type="text"
                  value={refreshments}
                  onChange={(e) => setRefreshments(e.target.value)}
                  placeholder="e.g. Champagne bar & passed hors d'oeuvres"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300"
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
                  Save Open House
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
