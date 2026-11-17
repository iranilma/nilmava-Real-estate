import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  Building,
  Clock,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../contexts/ToastContext';
import { Task } from '../types/database';
import { TaskModal } from '../components/modals/TaskModal';

export const TasksPage: React.FC = () => {
  const { tasks, agents, properties, leads, saveTask, toggleTaskCompleted, deleteTask } =
    useOrganization();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [filterMode, setFilterMode] = useState<'pending' | 'completed' | 'high' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    if (filterMode === 'pending' && t.is_completed) return false;
    if (filterMode === 'completed' && !t.is_completed) return false;
    if (filterMode === 'high' && (t.priority !== 'High' || t.is_completed)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.is_completed).length;
  const highPriorityCount = tasks.filter((t) => !t.is_completed && t.priority === 'High').length;
  const dueTodayCount = tasks.filter((t) => !t.is_completed && t.due_date <= todayStr).length;
  const completedCount = tasks.filter((t) => t.is_completed).length;

  const handleToggle = async (t: Task) => {
    try {
      await toggleTaskCompleted(t.id);
      showToast(
        `Task "${t.title}" marked as ${!t.is_completed ? 'Completed' : 'Pending'}.`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle task', 'error');
    }
  };

  const handleEdit = (t: Task) => {
    setTaskToEdit(t);
    setIsModalOpen(true);
  };

  const handleDelete = async (t: Task) => {
    if (!window.confirm(`Are you sure you want to remove task "${t.title}"?`)) return;
    try {
      await deleteTask(t.id);
      showToast('Task removed from queue.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Pending Actions
            </p>
            <h3 className="text-2xl font-bold font-serif text-[#081c15] mt-1">
              {pendingCount} <span className="text-xs font-normal text-gray-400">Open</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#1b4332]/10 text-[#1b4332] flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Urgent / High Priority
            </p>
            <h3 className="text-2xl font-bold font-serif text-red-600 mt-1">
              {highPriorityCount} <span className="text-xs font-normal text-gray-400">Critical</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Due Today / Overdue
            </p>
            <h3 className="text-2xl font-bold font-serif text-amber-600 mt-1">
              {dueTodayCount} <span className="text-xs font-normal text-gray-400">Items</span>
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Completed Tasks
            </p>
            <h3 className="text-2xl font-bold font-serif text-emerald-700 mt-1">
              {completedCount}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
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
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-3.5 py-2 text-sm rounded-xl border border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            />
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterMode('pending')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                filterMode === 'pending'
                  ? 'bg-white text-[#081c15] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterMode('high')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                filterMode === 'high'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              High Priority ({highPriorityCount})
            </button>
            <button
              onClick={() => setFilterMode('completed')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                filterMode === 'completed'
                  ? 'bg-white text-[#081c15] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                filterMode === 'all'
                  ? 'bg-white text-[#081c15] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All ({tasks.length})
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setTaskToEdit(null);
            setIsModalOpen(true);
          }}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#1b4332] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-all shadow-md flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Action Item</span>
        </button>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {filteredTasks.map((task) => {
          const agent = agents.find((a) => a.id === task.assigned_agent_id);
          const prop = properties.find((p) => p.id === task.linked_property_id);
          const isOverdue = !task.is_completed && task.due_date < todayStr;
          const isDueToday = !task.is_completed && task.due_date === todayStr;

          return (
            <div
              key={task.id}
              className={`p-4 md:p-5 flex items-center justify-between gap-4 transition-colors ${
                task.is_completed
                  ? 'bg-gray-50/50 opacity-60'
                  : isOverdue
                  ? 'bg-red-50/30'
                  : 'hover:bg-gray-50/60'
              }`}
            >
              {/* Left: Checkbox + Details */}
              <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggle(task)}
                  className="mt-0.5 text-gray-400 hover:text-[#1b4332] transition-colors focus:outline-none"
                >
                  {task.is_completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 hover:text-[#1b4332]" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-semibold text-sm ${
                        task.is_completed
                          ? 'line-through text-gray-400'
                          : 'text-[#081c15]'
                      }`}
                    >
                      {task.title}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                      {task.category}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.priority === 'High'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-1.5">
                    {/* Due Date */}
                    <div
                      className={`flex items-center space-x-1 font-medium ${
                        isOverdue
                          ? 'text-red-600 font-bold'
                          : isDueToday
                          ? 'text-amber-700 font-bold'
                          : 'text-gray-500'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due: {task.due_date}</span>
                      {isOverdue && <span>(Overdue)</span>}
                      {isDueToday && <span>(Today)</span>}
                    </div>

                    {/* Assigned Agent */}
                    {agent && (
                      <div className="flex items-center space-x-1.5">
                        <img
                          src={agent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop'}
                          alt={agent.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>{agent.name}</span>
                      </div>
                    )}

                    {/* Linked Property */}
                    {prop && (
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Building className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span className="truncate max-w-[180px]">{prop.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleEdit(task)}
                  className="p-1.5 text-gray-400 hover:text-[#1b4332] rounded-lg hover:bg-gray-100 transition-colors"
                  title="Edit Task"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(task)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <CheckSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium">No tasks found matching your filter.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (tData) => {
          await saveTask(tData);
          showToast('Operational task saved successfully.', 'success');
        }}
        taskToEdit={taskToEdit}
        agents={agents}
        properties={properties}
        leads={leads}
      />
    </div>
  );
};
