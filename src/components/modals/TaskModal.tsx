import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, Flag, Building, User } from 'lucide-react';
import { Task, Agent, Property, Lead, TaskPriority } from '../../types/database';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task> & { title: string; due_date: string }) => Promise<void>;
  taskToEdit?: Task | null;
  agents: Agent[];
  properties: Property[];
  leads: Lead[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  agents,
  properties,
  leads,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Client Follow-up');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [linkedPropertyId, setLinkedPropertyId] = useState('');
  const [linkedLeadId, setLinkedLeadId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setCategory(taskToEdit.category);
      setDueDate(taskToEdit.due_date);
      setPriority(taskToEdit.priority);
      setAssignedAgentId(taskToEdit.assigned_agent_id || '');
      setLinkedPropertyId(taskToEdit.linked_property_id || '');
      setLinkedLeadId(taskToEdit.linked_lead_id || '');
    } else {
      setTitle('');
      setCategory('Client Follow-up');
      const today = new Date().toISOString().split('T')[0];
      setDueDate(today);
      setPriority('Medium');
      setAssignedAgentId(agents[0]?.id || '');
      setLinkedPropertyId('');
      setLinkedLeadId('');
    }
  }, [taskToEdit, isOpen, agents]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    try {
      setIsSubmitting(true);
      await onSave({
        id: taskToEdit?.id,
        title: title.trim(),
        category,
        due_date: dueDate,
        priority,
        assigned_agent_id: assignedAgentId || undefined,
        linked_property_id: linkedPropertyId || undefined,
        linked_lead_id: linkedLeadId || undefined,
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
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white tracking-wide">
                {taskToEdit ? 'Edit Operational Task' : 'Create Agency Action Item'}
              </h2>
              <p className="text-xs text-white/60">
                Track critical milestone deadlines, escrow tasks, and broker reminders.
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
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
              Task Description / Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Confirm escrow deposit receipt with Title Co."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              >
                <option value="Client Follow-up">Client Follow-up</option>
                <option value="Legal / Escrow">Legal & Title / Escrow</option>
                <option value="Listing Prep">Listing Prep / Staging</option>
                <option value="Marketing">Marketing Campaign</option>
                <option value="Inspection">Property Inspection</option>
                <option value="Administrative">Administrative</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Flag className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Priority Level</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              >
                <option value="High">High (Immediate)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="Low">Low (Routine)</option>
              </select>
            </div>
          </div>

          {/* Due Date & Assigned Broker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Due Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5">
                Assignee Broker
              </label>
              <select
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              >
                <option value="">-- Unassigned --</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Linked Property & Lead (Optional references) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-gray-400" />
                <span>Linked Property</span>
              </label>
              <select
                value={linkedPropertyId}
                onChange={(e) => setLinkedPropertyId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              >
                <option value="">-- None --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#081c15] uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Linked Lead / Client</span>
              </label>
              <select
                value={linkedLeadId}
                onChange={(e) => setLinkedLeadId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
              >
                <option value="">-- None --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
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
                <span>Saving Task...</span>
              ) : (
                <span>{taskToEdit ? 'Update Task' : 'Add Action Item'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
