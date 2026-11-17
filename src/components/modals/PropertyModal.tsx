import React, { useState, useEffect } from 'react';
import { X, Building, Link as LinkIcon, Image, AlertCircle } from 'lucide-react';
import { Property, Agent, PropertyType, PropertyStatus, MeasurementUnit } from '../../types/database';
import { sqmToSqft, sqftToSqm, SQM_TO_SQFT_FACTOR, isValidGoogleDriveUrl } from '../../utils/units';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prop: Partial<Property> & { title: string; price: number; size_sqm: number }) => Promise<void>;
  propertyToEdit?: Property | null;
  agents: Agent[];
  defaultUnit?: MeasurementUnit;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  propertyToEdit,
  agents,
  defaultUnit = 'sqm',
}) => {
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('Villa');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState<number>(3500000);
  const [bedrooms, setBedrooms] = useState<number>(4);
  const [bathrooms, setBathrooms] = useState<number>(4);

  // Dual Measurement State
  const [activeUnit, setActiveUnit] = useState<MeasurementUnit>(defaultUnit);
  const [inputSize, setInputSize] = useState<string>('350');
  const [canonicalSqm, setCanonicalSqm] = useState<number>(350);

  // URLs
  const [imageUrl, setImageUrl] = useState('');
  const [googleDriveFolderUrl, setGoogleDriveFolderUrl] = useState('');
  const [status, setStatus] = useState<PropertyStatus>('Available');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [gdriveError, setGdriveError] = useState(false);

  useEffect(() => {
    if (propertyToEdit) {
      setTitle(propertyToEdit.title);
      setPropertyType(propertyToEdit.property_type);
      setLocation(propertyToEdit.location);
      setPrice(propertyToEdit.price);
      setBedrooms(propertyToEdit.bedrooms);
      setBathrooms(propertyToEdit.bathrooms);
      setCanonicalSqm(propertyToEdit.size_sqm);

      const unit = propertyToEdit.entry_measurement_unit || defaultUnit;
      setActiveUnit(unit);
      if (unit === 'sqft') {
        setInputSize(String(sqmToSqft(propertyToEdit.size_sqm)));
      } else {
        setInputSize(String(propertyToEdit.size_sqm));
      }

      setImageUrl(propertyToEdit.image_url || '');
      setGoogleDriveFolderUrl(propertyToEdit.google_drive_folder_url || '');
      setStatus(propertyToEdit.status);
      setAssignedAgentId(propertyToEdit.assigned_agent_id || '');
      setDescription(propertyToEdit.description || '');
      setNotes(propertyToEdit.notes || '');
    } else {
      // Default new listing values
      setTitle('');
      setPropertyType('Villa');
      setLocation('Bel-Air, Los Angeles');
      setPrice(3500000);
      setBedrooms(4);
      setBathrooms(4);
      setActiveUnit(defaultUnit);
      if (defaultUnit === 'sqft') {
        setInputSize('3800');
        setCanonicalSqm(sqftToSqm(3800));
      } else {
        setInputSize('350');
        setCanonicalSqm(350);
      }
      setImageUrl('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop');
      setGoogleDriveFolderUrl('');
      setStatus('Available');
      setAssignedAgentId(agents[0]?.id || '');
      setDescription('');
      setNotes('');
    }
    setGdriveError(false);
  }, [propertyToEdit, isOpen, defaultUnit, agents]);

  // Handle Measurement Input Change
  const handleSizeChange = (valStr: string) => {
    setInputSize(valStr);
    const parsed = parseFloat(valStr) || 0;
    if (activeUnit === 'sqm') {
      setCanonicalSqm(parsed);
    } else {
      setCanonicalSqm(sqftToSqm(parsed));
    }
  };

  // Switch Active Entry Unit
  const handleUnitToggle = (unit: MeasurementUnit) => {
    if (unit === activeUnit) return;
    setActiveUnit(unit);
    if (unit === 'sqft') {
      setInputSize(String(sqmToSqft(canonicalSqm)));
    } else {
      setInputSize(String(Number(canonicalSqm.toFixed(2))));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (googleDriveFolderUrl && !isValidGoogleDriveUrl(googleDriveFolderUrl)) {
      setGdriveError(true);
      return;
    }

    await onSave({
      id: propertyToEdit?.id,
      title,
      property_type: propertyType,
      location,
      price,
      bedrooms,
      bathrooms,
      size_sqm: canonicalSqm,
      entry_measurement_unit: activeUnit,
      image_url: imageUrl,
      google_drive_folder_url: googleDriveFolderUrl,
      status,
      assigned_agent_id: assignedAgentId,
      description,
      notes,
    });
    onClose();
  };

  if (!isOpen) return null;

  const alternateConversionDisplay =
    activeUnit === 'sqm'
      ? `≈ ${sqmToSqft(canonicalSqm).toLocaleString()} sq ft`
      : `≈ ${canonicalSqm.toFixed(1)} m²`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 card-shadow border border-brand-ivoryDark space-y-4 my-8 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-ivoryDark">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-brand-goldLight text-brand-forest flex items-center justify-center">
              <Building className="w-4 h-4" />
            </span>
            <h3 className="font-display font-bold text-base text-brand-charcoal">
              {propertyToEdit ? `Edit Listing (${propertyToEdit.ref_code})` : 'Add Property Listing'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-brand-slateText hover:text-brand-charcoal p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
          {/* Title */}
          <div>
            <label className="block font-semibold text-brand-charcoal mb-1">
              Property Title / Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bel-Air Grand Estate"
              className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
              >
                <option value="Villa">Villa</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Apartment">Apartment</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Commercial">Commercial</option>
                <option value="Land">Land</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">
                Location District *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bel-Air, Los Angeles"
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>

          {/* Pricing & Bed/Bath */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Price ($) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="3500000"
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Bedrooms</label>
              <input
                type="number"
                min="0"
                value={bedrooms}
                onChange={(e) => setBedrooms(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Bathrooms</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={bathrooms}
                onChange={(e) => setBathrooms(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>

          {/* DUAL MEASUREMENT SECTION */}
          <div className="p-3.5 bg-brand-ivory rounded-xl border border-brand-ivoryDark space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-brand-charcoal">
                Property Size Measurement (m² & ft²) *
              </label>
              {/* Unit Toggle */}
              <div className="flex items-center bg-white border border-brand-ivoryDark rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => handleUnitToggle('sqm')}
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-md transition ${
                    activeUnit === 'sqm'
                      ? 'bg-brand-forest text-white'
                      : 'text-brand-slateText hover:text-brand-charcoal'
                  }`}
                >
                  m² (Square Metres)
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle('sqft')}
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-md transition ${
                    activeUnit === 'sqft'
                      ? 'bg-brand-forest text-white'
                      : 'text-brand-slateText hover:text-brand-charcoal'
                  }`}
                >
                  ft² (Square Feet)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div>
                <input
                  type="number"
                  step="any"
                  required
                  value={inputSize}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />
              </div>
              <div className="text-xs text-brand-slateText bg-white/80 px-3 py-2 rounded-lg border border-brand-ivoryDark/80">
                <span>Automatic Conversion: </span>
                <strong className="text-brand-forest font-bold">{alternateConversionDisplay}</strong>
                <p className="text-[10px] text-brand-slateText mt-0.5">
                  Stored canonical value: {canonicalSqm.toFixed(2)} m² (Factor: 1 m² = {SQM_TO_SQFT_FACTOR} ft²)
                </p>
              </div>
            </div>
          </div>

          {/* Status & Agent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Listing Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
              >
                <option value="Available">Available</option>
                <option value="Under Offer">Under Offer</option>
                <option value="Sold">Sold</option>
                <option value="Off Market">Off Market</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-brand-charcoal mb-1">Listing Broker</label>
              <select
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark bg-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
              >
                <option value="">Unassigned</option>
                {agents.map((agt) => (
                  <option key={agt.id} value={agt.id}>
                    {agt.name} ({agt.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Featured Image URL */}
          <div>
            <label className="block font-semibold text-brand-charcoal mb-1 flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-brand-gold" />
              <span>Property Featured Image URL</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
            <p className="text-[10px] text-brand-slateText mt-0.5">
              Used strictly for cards, thumbnails, and preview imagery in the interface.
            </p>
          </div>

          {/* GOOGLE DRIVE PROPERTY FOLDER LINK */}
          <div>
            <label className="block font-semibold text-brand-charcoal mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-brand-forest" />
                <span>Google Drive Property Folder URL</span>
              </span>
              <span className="text-[10px] text-brand-gold font-medium">External Dossier Link</span>
            </label>
            <input
              type="url"
              value={googleDriveFolderUrl}
              onChange={(e) => {
                setGoogleDriveFolderUrl(e.target.value);
                setGdriveError(false);
              }}
              placeholder="https://drive.google.com/drive/folders/1aBcDeFgHiJk..."
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 ${
                gdriveError
                  ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30'
                  : 'border-brand-ivoryDark focus:ring-brand-gold'
              }`}
            />
            {gdriveError && (
              <p className="text-[10px] text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Please enter a valid Google Drive folder or document URL.</span>
              </p>
            )}
            <p className="text-[10px] text-brand-slateText mt-0.5">
              Brokers can click "Open Property Folder" to view HD photography, deeds, and disclosures in Google Drive. No OAuth required.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-brand-charcoal mb-1">
              Public Listing Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Architectural features, views, luxury amenities..."
              className="w-full px-3 py-2 rounded-lg border border-brand-ivoryDark focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-brand-ivoryDark flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-brand-ivoryDark hover:bg-brand-ivory text-brand-slateText font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-forest hover:bg-brand-forestLight text-white rounded-lg font-semibold shadow-xs"
            >
              {propertyToEdit ? 'Save Changes' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
