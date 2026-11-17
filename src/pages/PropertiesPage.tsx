import React, { useState, useEffect } from 'react';
import {
  Grid,
  List,
  Plus,
  Search,
  ExternalLink,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Edit3,
  Trash2,
  Folder,
} from 'lucide-react';
import { Property, Agent, PropertyStatus } from '../types/database';
import { repository } from '../services/agencyRepository';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency, formatDualMeasurement } from '../utils/units';
import { PropertyModal } from '../components/modals/PropertyModal';

interface PropertiesPageProps {
  defaultStatus?: PropertyStatus | '';
  pageTitle?: string;
  pageSubtitle?: string;
}

export const PropertiesPage: React.FC<PropertiesPageProps> = ({
  defaultStatus = '',
  pageTitle,
  pageSubtitle,
}) => {
  const { organization } = useOrganization();
  const { showToast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatus);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    setStatusFilter(defaultStatus);
  }, [defaultStatus]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [props, agts] = await Promise.all([
        repository.getProperties(),
        repository.getAgents(),
      ]);
      setProperties(props);
      setAgents(agts);
    } catch (err) {
      console.error('Failed to load property listings', err);
    }
  };

  const handleSaveProperty = async (data: any) => {
    try {
      await repository.saveProperty(data);
      showToast(
        data.id ? 'Property updated successfully.' : 'New property listing created.',
        'success'
      );
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save property', 'error');
    }
  };

  const handleDeleteProperty = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete listing "${title}"?`)) {
      try {
        await repository.deleteProperty(id);
        showToast(`Listing "${title}" deleted.`, 'info');
        loadData();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete listing', 'error');
      }
    }
  };

  // Filter Properties
  const filtered = properties.filter((p) => {
    if (
      search &&
      !(
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.ref_code.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase())
      )
    ) {
      return false;
    }
    if (typeFilter && p.property_type !== typeFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  const statusBadgeClasses: Record<PropertyStatus, string> = {
    Available: 'bg-emerald-600 text-white',
    'Under Offer': 'bg-amber-600 text-white',
    Sold: 'bg-brand-charcoal text-white',
    'Off Market': 'bg-slate-500 text-white',
  };

  const prefUnit = organization?.default_measurement_unit || 'sqm';

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-brand-charcoal">
            {pageTitle || 'Property Portfolio Listings'}
          </h2>
          <p className="text-xs text-brand-slateText">
            {pageSubtitle || 'Exclusive agency listings featuring dual-unit sizing (m² & ft²) and verified Google Drive dossiers.'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="bg-brand-ivoryDark/60 p-0.5 rounded-lg flex items-center border border-brand-ivoryDark">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                viewMode === 'cards'
                  ? 'bg-white shadow-xs text-brand-forest'
                  : 'text-brand-slateText hover:text-brand-charcoal'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white shadow-xs text-brand-forest'
                  : 'text-brand-slateText hover:text-brand-charcoal'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedProperty(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-brand-forest hover:bg-brand-forestLight text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property Listing</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-brand-ivoryDark card-shadow flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-brand-slateText" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search property title, reference code, neighborhood..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
        >
          <option value="">All Property Types</option>
          <option value="Villa">Villa</option>
          <option value="Penthouse">Penthouse</option>
          <option value="Apartment">Apartment</option>
          <option value="Townhouse">Townhouse</option>
          <option value="Commercial">Commercial</option>
          <option value="Land">Land</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Under Offer">Under Offer</option>
          <option value="Sold">Sold</option>
          <option value="Off Market">Off Market</option>
        </select>

        {(search || typeFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setTypeFilter('');
              setStatusFilter('');
            }}
            className="text-xs text-brand-slateText hover:text-brand-charcoal font-medium px-2 py-1"
          >
            Reset
          </button>
        )}
      </div>

      {/* CARDS VIEW MODE */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p) => {
            const agt = agents.find((a) => a.id === p.assigned_agent_id);
            const badgeClass = statusBadgeClasses[p.status] || 'bg-slate-600 text-white';

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-brand-ivoryDark overflow-hidden card-shadow flex flex-col hover:border-brand-gold/60 transition group"
              >
                {/* Featured Image Container */}
                <div className="h-44 relative overflow-hidden bg-brand-charcoal">
                  <img
                    src={p.image_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop'}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${badgeClass}`}>
                      {p.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-brand-charcoal backdrop-blur-xs">
                      {p.property_type}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/75 text-brand-gold font-bold text-[11px] backdrop-blur-xs font-mono">
                    {p.ref_code}
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <p className="text-[11px] text-brand-slateText flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-brand-gold flex-shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </p>
                    <h3 className="font-display font-bold text-sm text-brand-charcoal mt-1 line-clamp-1">
                      {p.title}
                    </h3>
                    <p className="text-base font-bold text-brand-forest mt-1 tabular-nums">
                      {formatCurrency(p.price)}
                    </p>
                  </div>

                  {/* Dual Measurement Metric Row */}
                  <div className="p-2 bg-brand-ivory rounded-lg text-xs flex items-center justify-between border border-brand-ivoryDark/80">
                    <span className="text-brand-slateText flex items-center gap-1 font-medium">
                      <Maximize2 className="w-3.5 h-3.5 text-brand-gold" /> Dimensions:
                    </span>
                    <span className="font-semibold text-brand-charcoal">
                      {formatDualMeasurement(p.size_sqm, prefUnit)}
                    </span>
                  </div>

                  {/* Bed, Bath & GDrive External Action */}
                  <div className="flex items-center justify-between text-xs text-brand-slateText pt-2 border-t border-brand-ivoryDark">
                    <div className="flex items-center space-x-2 text-[11px]">
                      <span>
                        <Bed className="w-3.5 h-3.5 inline text-brand-slateText" /> {p.bedrooms}
                      </span>
                      <span>
                        <Bath className="w-3.5 h-3.5 inline text-brand-slateText" /> {p.bathrooms}
                      </span>
                    </div>

                    {/* Google Drive Link Trigger */}
                    {p.google_drive_folder_url ? (
                      <a
                        href={p.google_drive_folder_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-brand-forest/10 hover:bg-brand-forest text-brand-forest hover:text-white transition font-semibold text-[10px]"
                        title="Open Google Drive Property Dossier"
                      >
                        <Folder className="w-3 h-3 text-brand-gold" />
                        <span>GDrive Folder</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-brand-slateText/70 italic">
                        No GDrive Linked
                      </span>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-brand-ivoryDark flex items-center justify-between text-xs">
                    <span className="text-[10px] text-brand-slateText truncate max-w-[120px]">
                      Broker: {agt?.name || 'Unassigned'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setSelectedProperty(p);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-brand-slateText hover:text-brand-forest transition"
                        title="Edit Listing"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(p.id, p.title)}
                        className="p-1 text-rose-500 hover:text-rose-700 transition"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW MODE */
        <div className="bg-white rounded-xl border border-brand-ivoryDark overflow-hidden card-shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-ivory text-brand-charcoal font-semibold uppercase tracking-wider text-[11px] border-b border-brand-ivoryDark">
                <tr>
                  <th className="py-3 px-4">Ref Code</th>
                  <th className="py-3 px-4">Property Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Dimensions (Dual Unit)</th>
                  <th className="py-3 px-4">Beds/Baths</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">GDrive Link</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-ivoryDark">
                {filtered.map((p) => {
                  const badgeClass = statusBadgeClasses[p.status] || 'bg-slate-600 text-white';
                  return (
                    <tr key={p.id} className="hover:bg-brand-ivory/50 transition">
                      <td className="py-3 px-4 font-bold text-brand-gold font-mono">{p.ref_code}</td>
                      <td className="py-3 px-4 font-semibold text-brand-charcoal">{p.title}</td>
                      <td className="py-3 px-4 text-brand-slateText">{p.property_type}</td>
                      <td className="py-3 px-4 text-brand-slateText">{p.location}</td>
                      <td className="py-3 px-4 font-bold text-brand-forest tabular-nums">
                        {formatCurrency(p.price)}
                      </td>
                      <td className="py-3 px-4 font-medium text-brand-charcoal">
                        {formatDualMeasurement(p.size_sqm, prefUnit)}
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        {p.bedrooms} bd / {p.bathrooms} ba
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badgeClass}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.google_drive_folder_url ? (
                          <a
                            href={p.google_drive_folder_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-forest hover:underline"
                          >
                            <Folder className="w-3 h-3 text-brand-gold" />
                            <span>Folder</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[10px]">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedProperty(p);
                            setIsModalOpen(true);
                          }}
                          className="p-1 hover:text-brand-forest transition"
                          title="Edit Listing"
                        >
                          <Edit3 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(p.id, p.title)}
                          className="p-1 text-rose-500 hover:text-rose-700 transition"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Property Modal */}
      <PropertyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProperty}
        propertyToEdit={selectedProperty}
        agents={agents}
        defaultUnit={prefUnit}
      />
    </div>
  );
};
