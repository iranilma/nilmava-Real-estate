import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';

interface CalendarEvent {
  id: string;
  type: 'showing' | 'openhouse' | 'task' | 'offer' | 'closing';
  title: string;
  date: string;
  time?: string;
  agent?: string;
  details?: string;
  status?: string;
}

export const CalendarPage: React.FC = () => {
  const { viewings, openHouses, tasks, offers, deals, agents } = useOrganization();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 16)); // November 2026
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Assemble unified event feed
  const events: CalendarEvent[] = [
    ...viewings.map((v) => ({
      id: v.id,
      type: 'showing' as const,
      title: `Showing: ${v.property_title}`,
      date: v.viewing_date,
      time: v.viewing_time,
      agent: agents.find((a) => a.id === v.assigned_agent_id)?.name,
      details: `Client: ${v.client_name || 'Prospect'} • Feedback: ${v.feedback || 'None'}`,
      status: v.status,
    })),
    ...openHouses.map((oh) => ({
      id: oh.id,
      type: 'openhouse' as const,
      title: `Open House: ${oh.property_title}`,
      date: oh.event_date,
      time: `${oh.start_time} - ${oh.end_time}`,
      agent: agents.find((a) => a.id === oh.host_agent_id)?.name,
      details: `${oh.visitor_count} expected visitors • ${oh.refreshments_notes || ''}`,
      status: oh.status,
    })),
    ...tasks.map((t) => ({
      id: t.id,
      type: 'task' as const,
      title: `Task: ${t.title}`,
      date: t.due_date,
      details: `Priority: ${t.priority} • Category: ${t.category}`,
      status: t.is_completed ? 'Completed' : 'Pending',
    })),
    ...offers.map((o) => ({
      id: o.id,
      type: 'offer' as const,
      title: `Offer Deadline: ${o.property_title}`,
      date: o.expiration_date,
      details: `$${o.offer_amount.toLocaleString()} offer by ${o.client_name} (${o.status})`,
      status: o.status,
    })),
    ...deals
      .filter((d) => d.expected_close_date)
      .map((d) => ({
        id: d.id,
        type: 'closing' as const,
        title: `Closing: ${d.title}`,
        date: d.expected_close_date!,
        details: `Value: $${d.deal_value.toLocaleString()} • Stage: ${d.stage}`,
        status: d.stage,
      })),
  ];

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Month grid calculation
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getEventsForDay = (day: number) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.date === formatted);
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'showing':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'openhouse':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'task':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'offer':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'closing':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#c5a059]/20 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-serif font-bold text-[#081c15]">{monthName}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1b4332]/10 text-[#1b4332]">
              {events.length} Scheduled Events
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Visual operational calendar tracking showings, open houses, contract deadlines, and closings.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg bg-white shadow-xs hover:bg-gray-50 text-gray-700"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(2026, 10, 16))}
              className="px-2.5 py-1 text-xs font-semibold text-gray-700 hover:text-black"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg bg-white shadow-xs hover:bg-gray-50 text-gray-700"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Color Legend */}
          <div className="hidden lg:flex items-center space-x-3 text-[11px] font-semibold text-gray-600 pl-4 border-l border-gray-200">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Showing</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Open House</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Task</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>Offer</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Closing</span>
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 bg-[#faf9f5] border-b border-gray-200 text-center py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-100 text-xs">
          {/* Empty prefix cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[110px] bg-gray-50/40 p-2 text-gray-300"></div>
          ))}

          {/* Actual Month Days */}
          {daysArray.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day === 16 && month === 10 && year === 2026;

            return (
              <div
                key={`day-${day}`}
                className={`min-h-[110px] p-2 transition-colors flex flex-col justify-between ${
                  isToday ? 'bg-amber-50/30 ring-2 ring-[#c5a059] inset-ring' : 'hover:bg-gray-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        isToday
                          ? 'bg-[#1b4332] text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        {dayEvents.length} ev
                      </span>
                    )}
                  </div>

                  {/* Day Events Stack */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px]">
                    {dayEvents.map((evt) => (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => setSelectedEvent(evt)}
                        className={`w-full text-left p-1 rounded-md border text-[10px] font-semibold truncate block transition hover:brightness-95 ${getEventTypeColor(
                          evt.type
                        )}`}
                      >
                        {evt.time && <span className="font-mono text-[9px] mr-1">{evt.time}</span>}
                        {evt.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Dialog Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#faf9f5] rounded-3xl w-full max-w-md shadow-2xl border border-[#c5a059]/30 overflow-hidden">
            <div className="bg-[#081c15] text-white p-5 flex items-center justify-between border-b border-[#c5a059]/30">
              <div className="flex items-center space-x-2.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getEventTypeColor(selectedEvent.type)}`}>
                  {selectedEvent.type}
                </span>
                <span className="text-xs text-white/70 font-mono">{selectedEvent.date}</span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-white/60 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <h3 className="text-base font-serif font-bold text-[#081c15]">
                {selectedEvent.title}
              </h3>

              {selectedEvent.time && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <Clock className="w-4 h-4 text-[#c5a059]" />
                  <span>Scheduled Time: <strong>{selectedEvent.time}</strong></span>
                </div>
              )}

              {selectedEvent.agent && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>Assigned Broker: <strong>{selectedEvent.agent}</strong></span>
                </div>
              )}

              {selectedEvent.details && (
                <div className="p-3 bg-white rounded-xl border border-gray-200 text-gray-600">
                  <p className="font-semibold text-gray-800 mb-1">Details & Context</p>
                  <p>{selectedEvent.details}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-5 py-2 bg-[#1b4332] text-white rounded-xl font-semibold hover:bg-[#2d6a4f] transition"
                >
                  Close Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
