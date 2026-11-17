import React from 'react';
import {
  Sun,
  Calendar,
  User,
  CheckSquare,
  AlertTriangle,
  Flame,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { NavigationSection } from '../types/database';

interface TodayPageProps {
  onNavigate: (section: NavigationSection) => void;
  onOpenQuickAdd: (type?: string) => void;
}

export const TodayPage: React.FC<TodayPageProps> = ({ onNavigate, onOpenQuickAdd }) => {
  const { viewings, tasks, leads, offers, toggleTaskCompleted } =
    useOrganization();

  const todayStr = new Date().toISOString().split('T')[0];

  // Showings & Appointments Today
  const todaysShowings = viewings.filter((v) => v.viewing_date === todayStr || v.status === 'Scheduled').slice(0, 4);

  // Overdue / Due Today Tasks
  const todaysTasks = tasks.filter((t) => !t.is_completed && t.due_date <= todayStr);
  const overdueTasks = tasks.filter((t) => !t.is_completed && t.due_date < todayStr);

  // Priority Leads with follow-up scheduled today or high heat score
  const priorityLeads = leads
    .filter((l) => l.status !== 'Closed Won' && l.status !== 'Lost' && (l.heat_score >= 70 || l.next_followup_date === todayStr))
    .slice(0, 5);

  // Active Offer Deadlines
  const expiringOffers = offers.filter((o) => o.status === 'Submitted' || o.status === 'Countered');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#c5a059]/20 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-[#081c15]">
              Daily Command Center — Today's Action Schedule
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Live briefing of showing appointments, contract deadlines, follow-up calls, and priority buyers.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-[#faf9f5] border border-gray-200 font-mono font-semibold text-gray-700">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button
            onClick={() => onOpenQuickAdd('lead')}
            className="px-4 py-2 rounded-xl bg-[#1b4332] text-white font-semibold hover:bg-[#2d6a4f] shadow-xs transition"
          >
            + Quick Lead
          </button>
        </div>
      </div>

      {/* 4 Quick Stat Strips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Showings Today</p>
            <p className="text-2xl font-serif font-bold text-[#081c15] mt-1">{todaysShowings.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Overdue Tasks</p>
            <p className="text-2xl font-serif font-bold text-red-600 mt-1">{overdueTasks.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Offer Deadlines</p>
            <p className="text-2xl font-serif font-bold text-[#1b4332] mt-1">{expiringOffers.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#1b4332]/10 text-[#1b4332] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Priority Leads</p>
            <p className="text-2xl font-serif font-bold text-orange-600 mt-1">{priorityLeads.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Showings & Overdue Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Today's Showing Appointments */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="font-serif font-bold text-base text-[#081c15] flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#c5a059]" />
              <span>Today's Showing Schedule</span>
            </h2>
            <button
              onClick={() => onNavigate('showings')}
              className="text-xs text-[#1b4332] font-semibold hover:underline flex items-center space-x-1"
            >
              <span>All Showings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todaysShowings.map((viewing) => (
              <div
                key={viewing.id}
                className="p-4 bg-[#faf9f5] rounded-xl border border-gray-200 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-[#081c15]">{viewing.property_title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1b4332] text-white">
                      {viewing.viewing_time}
                    </span>
                  </div>
                  <p className="text-gray-600 flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>Client: <strong>{viewing.client_name}</strong></span>
                  </p>
                  {viewing.feedback && (
                    <p className="text-gray-500 italic text-[11px] mt-1">"{viewing.feedback}"</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {viewing.status}
                  </span>
                </div>
              </div>
            ))}

            {todaysShowings.length === 0 && (
              <p className="text-xs text-gray-400 italic py-6 text-center">
                No showings scheduled for today.
              </p>
            )}
          </div>
        </div>

        {/* Right: Overdue Tasks & Milestones */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="font-serif font-bold text-base text-[#081c15] flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-[#1b4332]" />
              <span>Due & Overdue Action Items</span>
            </h2>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-[#1b4332] font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Manage Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {todaysTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 bg-[#faf9f5] rounded-xl border border-gray-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={() => toggleTaskCompleted(task.id)}
                    className="w-4 h-4 rounded text-[#1b4332] focus:ring-[#1b4332]"
                  />
                  <div>
                    <p className="font-bold text-[#081c15]">{task.title}</p>
                    <p className="text-[10px] text-gray-500">
                      Due: <strong className="text-red-600">{task.due_date}</strong> • {task.category}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                  {task.priority}
                </span>
              </div>
            ))}

            {todaysTasks.length === 0 && (
              <p className="text-xs text-emerald-700 italic py-6 text-center">
                ✓ All tasks for today are up to date!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Grid: Active Offers & Priority Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Offer Deadlines */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="font-serif font-bold text-base text-[#081c15] flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#c5a059]" />
              <span>Pending Offers & Counteroffers</span>
            </h2>
            <button
              onClick={() => onNavigate('offers')}
              className="text-xs text-[#1b4332] font-semibold hover:underline"
            >
              Offers Register
            </button>
          </div>

          <div className="space-y-2.5">
            {expiringOffers.map((offer) => (
              <div
                key={offer.id}
                className="p-3 bg-[#faf9f5] rounded-xl border border-gray-200 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-[#081c15]">{offer.property_title}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Buyer: <strong>{offer.client_name}</strong> • ${offer.offer_amount.toLocaleString()} (Asking: ${offer.asking_price.toLocaleString()})
                  </p>
                  <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                    Expires: {offer.expiration_date} • {offer.financing_type}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {offer.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Hot Leads */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="font-serif font-bold text-base text-[#081c15] flex items-center space-x-2">
              <Flame className="w-4 h-4 text-red-600" />
              <span>Top Active Buyer Leads to Contact Today</span>
            </h2>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs text-[#1b4332] font-semibold hover:underline"
            >
              All Leads
            </button>
          </div>

          <div className="space-y-2.5">
            {priorityLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-3 bg-[#faf9f5] rounded-xl border border-gray-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-[#081c15]">{lead.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-700">
                      🔥 {lead.heat_score}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Budget: ${(lead.budget_max || 0).toLocaleString()} • {lead.property_interest || 'Luxury Estate'}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('leads')}
                  className="px-3 py-1 bg-[#1b4332] text-white rounded-lg text-xs font-semibold hover:bg-[#2d6a4f] transition"
                >
                  Contact
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
