import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Building,
  User,
  Star,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Search,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../contexts/ToastContext';
import { Viewing, ViewingStatus } from '../types/database';
import { ViewingModal } from '../components/modals/ViewingModal';

export const ViewingsPage: React.FC = () => {
  const { viewings, properties, clients, agents, saveViewing, deleteViewing } = useOrganization();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingToEdit, setViewingToEdit] = useState<Viewing | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredViewings = viewings.filter((v) => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const pTitle = v.property_title?.toLowerCase() || '';
      const cName = v.client_name?.toLowerCase() || '';
      return pTitle.includes(q) || cName.includes(q);
    }
    return true;
  });

  const scheduledCount = viewings.filter((v) => v.status === 'Scheduled').length;
  const completedCount = viewings.filter((v) => v.status === 'Completed').length;
  const ratedViewings = viewings.filter((v) => v.rating > 0);
  const avgRating =
    ratedViewings.length > 0
      ? (ratedViewings.reduce((sum, v) => sum + v.rating, 0) / ratedViewings.length).toFixed(1)
      : '5.0';

  const handleEdit = (v: Viewing) => {
    setViewingToEdit(v);
    setIsModalOpen(true);
  };

  const handleStatusQuickChange = async (v: Viewing, newStatus: ViewingStatus) => {
    try {
      await saveViewing({ ...v, status: newStatus });
      showToast(`Showing updated to ${newStatus}.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update showing', 'error');
    }
  };

  const handleDelete = async (v: Viewing) => {
    if (!window.confirm('Are you sure you want to delete this showing record?')) return;
    try {
      await deleteViewing(v.id);
      showToast('Showing record removed.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete showing', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Upcoming Showings
            </p>
            <h3 className="text-2xl font-bold font-serif text-[#081c15] mt-1">
              {scheduledCount} <span className="text-xs font-normal text-gray-400">Scheduled</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#1b4332]/10 text-[#1b4332] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Completed Showings
            </p>
            <h3 className="text-2xl font-bold font-serif text-[#081c15] mt-1">
              {completedCount} <span className="text-xs font-normal text-gray-400">Done</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Client Satisfaction
            </p>
            <h3 className="text-2xl font-bold font-serif text-[#081c15] mt-1 flex items-center space-x-1.5">
              <span>{avgRating}</span>
              <Star className="w-5 h-5 text-[#c5a059] fill-[#c5a059]" />
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center">
            <Star className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Logged Appointments
            </p>
            <h3 className="text-2xl font-bold font-serif text-[#081c15] mt-1">
              {viewings.length}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
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
              placeholder="Search by property or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-3.5 py-2 text-sm rounded-xl border border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            />
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            {['all', 'Scheduled', 'Completed', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors capitalize ${
                  statusFilter === st
                    ? 'bg-white text-[#081c15] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {st === 'all' ? 'All Viewings' : st}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            setViewingToEdit(null);
            setIsModalOpen(true);
          }}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#1b4332] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-all shadow-md flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Showing</span>
        </button>
      </div>

      {/* Showing Cards / Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#faf9f5] border-b border-gray-200 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Date & Time</th>
                <th className="py-4 px-6">Property</th>
                <th className="py-4 px-6">Client / Attendee</th>
                <th className="py-4 px-6">Attending Broker</th>
                <th className="py-4 px-6">Status & Rating</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredViewings.map((viewing) => {
                const agent = agents.find((a) => a.id === viewing.assigned_agent_id);
                const isUpcoming = viewing.viewing_date >= todayStr && viewing.status === 'Scheduled';

                return (
                  <tr
                    key={viewing.id}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      isUpcoming ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Date / Time */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-gray-900">
                        <Calendar className="w-4 h-4 text-[#c5a059]" />
                        <span>{viewing.viewing_date}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-gray-500 mt-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{viewing.viewing_time}</span>
                        {isUpcoming && (
                          <span className="ml-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Property */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="font-bold text-[#081c15] text-sm">
                          {viewing.property_title}
                        </span>
                      </div>
                      {viewing.feedback && (
                        <p className="text-xs text-gray-500 italic mt-1 line-clamp-1">
                          "{viewing.feedback}"
                        </p>
                      )}
                    </td>

                    {/* Client */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 text-xs font-medium text-gray-800">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{viewing.client_name || 'Client Attendee'}</span>
                      </div>
                    </td>

                    {/* Attending Broker */}
                    <td className="py-4 px-6 text-xs text-gray-700">
                      {agent ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={agent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop'}
                            alt={agent.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="font-semibold text-[#081c15]">{agent.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Status & Rating */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <select
                          value={viewing.status}
                          onChange={(e) =>
                            handleStatusQuickChange(viewing, e.target.value as ViewingStatus)
                          }
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:ring-1 focus:ring-[#1b4332] ${
                            viewing.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : viewing.status === 'Scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : viewing.status === 'Cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="No-Show">No-Show</option>
                        </select>

                        {viewing.rating > 0 && (
                          <div className="flex items-center text-xs text-[#c5a059] font-bold ml-1">
                            <span>{viewing.rating}</span>
                            <Star className="w-3 h-3 fill-current ml-0.5" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(viewing)}
                          className="p-1.5 text-gray-400 hover:text-[#1b4332] rounded-lg hover:bg-gray-100 transition-colors"
                          title="Edit Showing"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(viewing)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Showing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredViewings.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium">No viewing appointments found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <ViewingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (vData) => {
          await saveViewing(vData);
          showToast('Showing appointment scheduled successfully.', 'success');
        }}
        viewingToEdit={viewingToEdit}
        properties={properties}
        clients={clients}
        agents={agents}
      />
    </div>
  );
};
