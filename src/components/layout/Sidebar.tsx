import React from 'react';
import {
  LayoutDashboard,
  Sun,
  Calendar,
  CheckSquare,
  UserPlus,
  GitBranch,
  BookOpen,
  Key,
  Tag,
  DoorClosed,
  Star,
  Building,
  List,
  Layers,
  Eye,
  Home,
  FileText,
  Timer,
  Calculator,
  BarChart3,
  Sliders,
  X,
  ShieldCheck,
} from 'lucide-react';
import { NavigationSection } from '../../types/database';

export type { NavigationSection };

interface NavItem {
  id: NavigationSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  currentSection: NavigationSection;
  onNavigate: (section: NavigationSection) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  badgeCounts?: {
    leads?: number;
    properties?: number;
    tasks?: number;
    offers?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  badgeCounts = { leads: 12, properties: 16, tasks: 4, offers: 3 },
}) => {
  const navGroups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'today', label: 'Today', icon: Sun },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        {
          id: 'tasks',
          label: 'Tasks',
          icon: CheckSquare,
          badge: badgeCounts.tasks,
          badgeColor: 'bg-rose-600 text-white',
        },
      ],
    },
    {
      title: 'CLIENTS',
      items: [
        {
          id: 'leads',
          label: 'Leads',
          icon: UserPlus,
          badge: badgeCounts.leads,
          badgeColor: 'bg-[#c5a059] text-[#081c15]',
        },
        { id: 'pipeline', label: 'Lead Pipeline', icon: GitBranch },
        { id: 'contacts', label: 'Contacts', icon: BookOpen },
        { id: 'buyers', label: 'Buyers', icon: Key },
        { id: 'sellers', label: 'Sellers', icon: Tag },
        { id: 'renters', label: 'Renters', icon: DoorClosed },
        { id: 'pastclients', label: 'Past Clients', icon: Star },
      ],
    },
    {
      title: 'PROPERTIES',
      items: [
        {
          id: 'properties',
          label: 'Properties',
          icon: Building,
          badge: badgeCounts.properties,
          badgeColor: 'bg-[#2d6a4f] text-[#faf9f5]',
        },
        { id: 'listings', label: 'Listings', icon: List },
        { id: 'listingpipe', label: 'Listing Pipeline', icon: Layers },
      ],
    },
    {
      title: 'SALES',
      items: [
        { id: 'showings', label: 'Showings', icon: Eye },
        { id: 'openhouses', label: 'Open Houses', icon: Home },
        {
          id: 'offers',
          label: 'Offers',
          icon: FileText,
          badge: badgeCounts.offers,
          badgeColor: 'bg-amber-600 text-white',
        },
        { id: 'deals', label: 'Deals & Closings', icon: Timer },
      ],
    },
    {
      title: 'BUSINESS',
      items: [
        { id: 'money', label: 'Commission & Expenses', icon: Calculator },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Sliders },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 w-64 bg-[#081c15] text-[#faf9f5] flex flex-col z-50 transition-transform duration-300 border-r border-[#1b4332]/60 select-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#1b4332]/70 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#1b4332] border border-[#c5a059]/60 flex items-center justify-center text-[#c5a059] font-serif font-bold text-lg shadow-inner">
              NV
            </div>
            <div>
              <h1 className="font-serif font-bold text-sm tracking-wide text-white uppercase">
                NILMA VA
              </h1>
              <p className="text-[10px] text-[#c5a059] font-mono tracking-widest uppercase">
                Real Estate OS
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-white/70 hover:text-white p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups List */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold font-mono tracking-widest text-[#c5a059]/70 uppercase">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition relative group ${
                        isActive
                          ? 'bg-[#1b4332] text-white shadow-xs'
                          : 'text-[#faf9f5]/75 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#c5a059] rounded-r" />
                      )}
                      <Icon
                        className={`w-4 h-4 mr-2.5 transition shrink-0 ${
                          isActive
                            ? 'text-[#c5a059]'
                            : 'text-[#c5a059]/70 group-hover:text-[#c5a059]'
                        }`}
                      />
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Identity Footer */}
        <div className="p-3 border-t border-[#1b4332]/70 bg-black/30 shrink-0">
          <div className="flex items-center space-x-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
              alt="Avatar"
              className="w-8 h-8 rounded-xl border border-[#c5a059]/60 object-cover"
            />
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">Marcus Vance</p>
              <p className="text-[10px] text-[#c5a059] truncate flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3 text-[#c5a059]" /> Principal Broker
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
