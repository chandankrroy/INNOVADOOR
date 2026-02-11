import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { ArrowLeft, Save, AlertCircle, X, Settings } from 'lucide-react';

interface MeasurementItem {
  sr_no?: string;
  location?: string;
  location_of_fitting?: string;
  hinges?: string;
  bldg?: string;
  flat_no?: string;
  area?: string;
  act_width?: string;
  act_height?: string;
  ro_width?: string;
  ro_height?: string;
  wall?: string;
  subframe_side?: string;
  sub_frame?: string;
  h?: string;
  w?: string;
  qty?: string;
  width?: string;
  height?: string;
  minus_width?: string;
  minus_height?: string;
  remark?: string;
  custom_area?: string;
  [key: string]: any;
}

type Measurement = {
  id: number;
  measurement_type: string;
  measurement_number: string;
  party_name: string | null;
  party_id: number | null;
  thickness: string | null;
  measurement_date: string | null;
  site_location: string | null;
  items: MeasurementItem[] | string;
  notes: string | null;
  approval_status?: string;
  created_at: string;
  updated_at: string | null;
};

type MeasurementType = 'frame_sample' | 'shutter_sample' | 'regular_frame' | 'regular_shutter';

const AREA_OPTIONS = [
  'MD', 'CB', 'MB', 'CHB', 'CT', 'MT', 'CHT', 'TR', 'KG', 'DRB',
  'WC-Bath', 'Top-Ter', 'STR', 'Safety-MD', 'custom'
];

export default function EditMeasurement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isCollapsed, isHovered } = useSidebar();
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [items, setItems] = useState<MeasurementItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [areaMinusValues, setAreaMinusValues] = useState<{ [key: string]: { width: string; height: string } }>({});
  const [showAreaConfig, setShowAreaConfig] = useState(false);
  const [editRemark, setEditRemark] = useState('');
  const [initialItems, setInitialItems] = useState<MeasurementItem[]>([]);
  const [initialNotes, setInitialNotes] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const formSubmittedRef = useRef(false);

  useEffect(() => {
    if (id) {
      loadMeasurement();
    }
    // Load area minus values from localStorage if available
    const savedAreaMinusValues = localStorage.getItem('areaMinusValues');
    if (savedAreaMinusValues) {
      try {
        setAreaMinusValues(JSON.parse(savedAreaMinusValues));
      } catch (e) {
        console.error('Failed to load area minus values:', e);
      }
    }
  }, [id]);

  const loadMeasurement = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get(`/production/measurements/${id}`, true);
      setMeasurement(data);
      
      // Parse items
      let itemsData: MeasurementItem[] = [];
      if (data.items) {
        if (typeof data.items === 'string') {
          try {
            itemsData = JSON.parse(data.items);
          } catch {
            itemsData = [];
          }
        } else if (Array.isArray(data.items)) {
          itemsData = data.items;
        }
      }
      const itemsToSet = itemsData.length > 0 ? itemsData : [{}];
      
      // Calculate act_sq_ft for all items that have minus_width and minus_height
      const itemsWithSqFt = itemsToSet.map(item => {
        if (item.minus_width && item.minus_height) {
          const minusWidthNum = parseFloat(item.minus_width);
          const minusHeightNum = parseFloat(item.minus_height);
          if (!isNaN(minusWidthNum) && !isNaN(minusHeightNum) && minusWidthNum > 0 && minusHeightNum > 0) {
            const sqFt = (minusWidthNum * minusHeightNum) / 92903.04;
            return { ...item, act_sq_ft: sqFt.toFixed(4) };
          }
        }
        return item;
      });
      
      setItems(itemsWithSqFt);
      setInitialItems(JSON.parse(JSON.stringify(itemsWithSqFt))); // Deep copy
      const notesToSet = data.notes || '';
      setNotes(notesToSet);
      setInitialNotes(notesToSet);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load measurement');
    } finally {
      setLoading(false);
    }
  };

  const getMeasurementTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      frame_sample: 'Sample Frame',
      shutter_sample: 'Sample Shutter',
      regular_frame: 'Regular Frame',
      regular_shutter: 'Regular Shutter',
    };
    return labels[type] || type;
  };

  // Round-up function for RO Width/Height calculation
  // Rule: x.01 – x.10 → x, x.11 – x.60 → x.5, x.61 – (x+1).10 → x+1
  const roundUpForRO = (value: number): number => {
    if (isNaN(value) || value <= 0) return 0;
    
    const integerPart = Math.floor(value);
    // Round to 2 decimals to avoid floating point precision issues
    const decimalPart = parseFloat((value - integerPart).toFixed(2));
    
    // x.00 – x.10 → x
    if (decimalPart === 0 || (decimalPart >= 0.01 && decimalPart <= 0.10)) {
      return integerPart;
    }
    
    // x.11 – x.60 → x.5
    if (decimalPart >= 0.11 && decimalPart <= 0.60) {
      return integerPart + 0.5;
    }
    
    // x.61 – (x+1).10 → x+1
    if (decimalPart >= 0.61) {
      return integerPart + 1;
    }
    
    return value;
  };

  const getFieldsForType = (type: string): string[] => {
    switch (type) {
      case 'frame_sample':
        return ['sr_no', 'location_of_fitting', 'bldg', 'flat_no', 'area', 'act_width', 'act_height', 'wall', 'subframe_side', 'remark'];
      case 'shutter_sample':
        return ['sr_no', 'location', 'bldg', 'flat_no', 'area', 'width', 'height', 'minus_width', 'minus_height', 'act_width', 'act_height', 'ro_width', 'ro_height', 'act_sq_ft', 'remark'];
      case 'regular_frame':
        return ['sr_no', 'location_of_fitting', 'bldg', 'flat_no', 'area', 'act_width', 'act_height', 'wall', 'subframe_side', 'remark'];
      case 'regular_shutter':
        return ['sr_no', 'location', 'bldg', 'flat_no', 'area', 'width', 'height', 'minus_width', 'minus_height', 'act_width', 'act_height', 'ro_width', 'ro_height', 'act_sq_ft', 'remark'];
      default:
        return [];
    }
  };

  const getFieldLabel = (field: string, type?: string): string => {
    // Conditional labels based on measurement type
    if (field === 'act_width' && (type === 'shutter_sample' || type === 'regular_shutter')) {
      return 'Act Width (inch)';
    }
    if (field === 'act_height' && (type === 'shutter_sample' || type === 'regular_shutter')) {
      return 'Act Height (inch)';
    }
    if (field === 'act_width' && (type === 'frame_sample' || type === 'regular_frame')) {
      return 'ACT Width (MM)';
    }
    if (field === 'act_height' && (type === 'frame_sample' || type === 'regular_frame')) {
      return 'ACT Height (MM)';
    }
    
    const labels: { [key: string]: string } = {
      sr_no: 'Sr No',
      location_of_fitting: 'Location',
      location: 'Location',
      hinges: 'Hinges',
      bldg: 'BLDG/Wings',
      flat_no: 'Flat No',
      area: 'Area',
      act_width: 'Act Width',
      act_height: 'Act Height',
      ro_width: 'RO Width(inches)',
      ro_height: 'RO Height(inches)',
      wall: 'WALL',
      subframe_side: 'Subframe Side',
      sub_frame: 'Sub Frame',
      h: 'H',
      w: 'W',
      qty: 'QTY',
      width: 'Width',
      height: 'Height',
      minus_width: 'Act Width(mm)',
      minus_height: 'Act Height (mm)',
      act_sq_ft: 'Act Sq. Ft.',
      remark: 'Remark',
    };
    return labels[field] || field;
  };

  const handleItemFieldChange = (index: number, field: string, value: string) => {
    const measurementType = measurement?.measurement_type as MeasurementType;
    // Check if user is entering width/height without area set (shutter types only)
    if ((field === 'width' || field === 'height') && value.trim() !== '' &&
        (measurementType === 'shutter_sample' || measurementType === 'regular_shutter')) {
      const currentArea = items[index]?.area === 'custom' ? (items[index]?.custom_area || '') : (items[index]?.area || '');
      if (!currentArea || currentArea.trim() === '') {
        const shouldOpen = window.confirm(
          'Area value is not set for this row. Please configure Area Minus Values for accurate calculations. Click OK to open Area configuration.'
        );
        if (shouldOpen) {
          setShowAreaConfig(true);
        }
      }
    }
    updateItem(index, field, value);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    if (!newItems[index]) {
      newItems[index] = {};
    }
    newItems[index] = { ...newItems[index], [field]: value };
    
    const measurementType = measurement?.measurement_type as MeasurementType;
    
    // Prevent manual editing of auto-generated location fields
    if (
      ((measurementType === 'frame_sample' || measurementType === 'regular_frame') && field === 'location_of_fitting') ||
      ((measurementType === 'shutter_sample' || measurementType === 'regular_shutter') && field === 'location')
    ) {
      // Don't allow manual editing of auto-generated location fields
      return;
    }
    
    // Auto-generate location fields when bldg, flat_no, or area changes
    if (field === 'bldg' || field === 'flat_no' || field === 'area') {
      const bldg = field === 'bldg' ? value : (newItems[index].bldg || '');
      const flatNo = field === 'flat_no' ? value : (newItems[index].flat_no || '');
      const area = field === 'area' ? value : (newItems[index].area || '');
      
      // Generate location: BLDG/Wings + "_" + Flat No + "_" + Area
      const generatedLocation = bldg && flatNo && area ? `${bldg}_${flatNo}_${area}` : '';
      
      // Update location_of_fitting for frame_sample and regular_frame
      if (measurementType === 'frame_sample' || measurementType === 'regular_frame') {
        newItems[index].location_of_fitting = generatedLocation;
      }
      
      // Update location for shutter_sample and regular_shutter
      if (measurementType === 'shutter_sample' || measurementType === 'regular_shutter') {
        newItems[index].location = generatedLocation;
      }
    }
    
    // Auto-calculate minus_width and minus_height for shutter_sample and regular_shutter
    if ((measurementType === 'shutter_sample' || measurementType === 'regular_shutter')) {
      const area = newItems[index].area === 'custom' ? (newItems[index].custom_area || '') : (newItems[index].area || '');
      
      // Get current width and height values (use updated value if this field is being changed)
      const width = field === 'width' ? value : (newItems[index].width || '');
      const height = field === 'height' ? value : (newItems[index].height || '');
      
      // If width, height, or area changes, recalculate minus_width and minus_height
      // (but only if area has configured minus values)
      if (field === 'width' || field === 'height' || field === 'area') {
        if (area && areaMinusValues[area]) {
          // Recalculate minus_width when width or area changes
          if (width && areaMinusValues[area].width) {
            const widthNum = parseFloat(width);
            const minusWidthNum = parseFloat(areaMinusValues[area].width);
            if (!isNaN(widthNum) && !isNaN(minusWidthNum)) {
              newItems[index].minus_width = (widthNum - minusWidthNum).toString();
            } else {
              newItems[index].minus_width = '';
            }
          } else {
            // Clear minus_width if width is empty or area doesn't have width minus value
            newItems[index].minus_width = '';
          }
          
          // Recalculate minus_height when height or area changes
          if (height && areaMinusValues[area].height) {
            const heightNum = parseFloat(height);
            const minusHeightNum = parseFloat(areaMinusValues[area].height);
            if (!isNaN(heightNum) && !isNaN(minusHeightNum)) {
              newItems[index].minus_height = (heightNum - minusHeightNum).toString();
            } else {
              newItems[index].minus_height = '';
            }
          } else {
            // Clear minus_height if height is empty or area doesn't have height minus value
            newItems[index].minus_height = '';
          }
        } else {
          // Clear minus values if area is cleared or doesn't have minus values
          newItems[index].minus_width = '';
          newItems[index].minus_height = '';
        }
      }
      
      // Auto-calculate act_width and act_height from minus_width and minus_height (convert mm to inches)
      // This should always recalculate whenever minus_width, minus_height, width, height, or area changes
      if (field === 'minus_width' || field === 'minus_height' || field === 'width' || field === 'height' || field === 'area') {
        // Get the current minus_width value (use updated value if this field is being changed)
        const minusWidth = field === 'minus_width' ? value : (newItems[index].minus_width || '');
        
        // Calculate Act Width from Minus Width (convert mm to inches)
        if (minusWidth && minusWidth.trim() !== '') {
          const minusWidthNum = parseFloat(minusWidth);
          if (!isNaN(minusWidthNum)) {
            // Convert mm to inches: 1 inch = 25.4 mm
            const actWidthInches = minusWidthNum / 25.4;
            newItems[index].act_width = actWidthInches.toFixed(2);
          } else {
            // Clear act_width if minus_width is invalid
            newItems[index].act_width = '';
          }
        } else {
          // Clear act_width if minus_width is empty
          newItems[index].act_width = '';
        }
        
        // Get the current minus_height value (use updated value if this field is being changed)
        const minusHeight = field === 'minus_height' ? value : (newItems[index].minus_height || '');
        
        // Calculate Act Height from Minus Height (convert mm to inches)
        if (minusHeight && minusHeight.trim() !== '') {
          const minusHeightNum = parseFloat(minusHeight);
          if (!isNaN(minusHeightNum)) {
            // Convert mm to inches: 1 inch = 25.4 mm
            const actHeightInches = minusHeightNum / 25.4;
            newItems[index].act_height = actHeightInches.toFixed(2);
          } else {
            // Clear act_height if minus_height is invalid
            newItems[index].act_height = '';
          }
        } else {
          // Clear act_height if minus_height is empty
          newItems[index].act_height = '';
        }
      }
      
      // Auto-calculate RO Width and RO Height from Act Width and Act Height using round-up rule
      // This should recalculate whenever act_width or act_height changes
      if (field === 'act_width' || field === 'act_height' || field === 'minus_width' || field === 'minus_height' || field === 'width' || field === 'height' || field === 'area') {
        // Get the current act_width value (use updated value if this field is being changed)
        const actWidth = field === 'act_width' ? value : (newItems[index].act_width || '');
        
        // Calculate RO Width from Act Width using round-up rule
        if (actWidth && actWidth.trim() !== '') {
          const actWidthNum = parseFloat(actWidth);
          if (!isNaN(actWidthNum) && actWidthNum > 0) {
            const roWidth = roundUpForRO(actWidthNum);
            newItems[index].ro_width = roWidth.toString();
          } else {
            // Clear ro_width if act_width is invalid
            newItems[index].ro_width = '';
          }
        } else {
          // Clear ro_width if act_width is empty
          newItems[index].ro_width = '';
        }
        
        // Get the current act_height value (use updated value if this field is being changed)
        const actHeight = field === 'act_height' ? value : (newItems[index].act_height || '');
        
        // Calculate RO Height from Act Height using round-up rule
        if (actHeight && actHeight.trim() !== '') {
          const actHeightNum = parseFloat(actHeight);
          if (!isNaN(actHeightNum) && actHeightNum > 0) {
            const roHeight = roundUpForRO(actHeightNum);
            newItems[index].ro_height = roHeight.toString();
          } else {
            // Clear ro_height if act_height is invalid
            newItems[index].ro_height = '';
          }
        } else {
          // Clear ro_height if act_height is empty
          newItems[index].ro_height = '';
        }
        
        // Auto-calculate Act Sq. Ft. from minus_width and minus_height (Act Width(mm) and Act Height (mm))
        // Formula: (minus_width × minus_height) / 92903.04
        // Where 92903.04 = 25.4 × 25.4 × 144 (conversion from square mm to square feet)
        const minusWidth = field === 'minus_width' ? value : (newItems[index].minus_width || '');
        const minusHeight = field === 'minus_height' ? value : (newItems[index].minus_height || '');
        
        if (minusWidth && minusWidth.trim() !== '' && minusHeight && minusHeight.trim() !== '') {
          const minusWidthNum = parseFloat(minusWidth);
          const minusHeightNum = parseFloat(minusHeight);
          
          if (!isNaN(minusWidthNum) && !isNaN(minusHeightNum) && minusWidthNum > 0 && minusHeightNum > 0) {
            // Calculate square feet: (width in mm × height in mm) / 92903.04
            const sqFt = (minusWidthNum * minusHeightNum) / 92903.04;
            newItems[index].act_sq_ft = sqFt.toFixed(4);
          } else {
            // Clear act_sq_ft if values are invalid
            newItems[index].act_sq_ft = '';
          }
        } else {
          // Clear act_sq_ft if either value is empty
          newItems[index].act_sq_ft = '';
        }
      }
    }
    
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, {}]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Filter out completely empty items
    const validItems = items.filter(item => {
      return Object.keys(item).some(key => {
        if (key === 'custom_area') return false;
        const value = item[key];
        return value !== null && value !== undefined && value !== '';
      });
    });

    if (validItems.length === 0) {
      setError('Please add at least one measurement item with data');
      return;
    }

    setSaving(true);

    try {
      // Clean up items - remove custom_area if present
      const cleanedItems = validItems.map(item => {
        const cleaned = { ...item };
        delete cleaned.custom_area;
        return cleaned;
      });

      const updateData = {
        items: cleanedItems,
        notes: notes || null,
        edit_remark: editRemark || null,
      };

      await api.put(`/production/measurements/${id}`, updateData, true);
      formSubmittedRef.current = true;
      // Update initial state to current state
      setInitialItems(JSON.parse(JSON.stringify(validItems)));
      setInitialNotes(notes || '');
      navigate(`/measurements/${id}`);
    } catch (err: any) {
      console.error('Measurement update error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update measurement. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const isShutterType = (type: string): boolean => {
    return type === 'shutter_sample' || type === 'regular_shutter';
  };

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (formSubmittedRef.current) return false;
    
    // Compare items
    const itemsChanged = JSON.stringify(items) !== JSON.stringify(initialItems);
    
    // Compare notes
    const notesChanged = notes !== initialNotes;
    
    return itemsChanged || notesChanged;
  }, [items, initialItems, notes, initialNotes]);

  // Handle navigation with unsaved changes check
  const handleNavigation = (navigationFn: () => void) => {
    if (hasUnsavedChanges()) {
      setPendingNavigation(() => navigationFn);
      setShowExitConfirm(true);
    } else {
      navigationFn();
    }
  };

  // Handle save and exit
  const handleSaveAndExit = async () => {
    setShowExitConfirm(false);
    const navFn = pendingNavigation;
    setPendingNavigation(null);
    
    // Manually trigger form submission
    const fakeEvent = { 
      preventDefault: () => {},
      stopPropagation: () => {}
    } as React.FormEvent<HTMLFormElement>;
    
    try {
      await handleSubmit(fakeEvent);
      // If save was successful, navigate
      if (navFn) {
        navFn();
      }
    } catch (err) {
      // Error already handled in handleSubmit
      // Don't navigate if there was an error
    }
  };

  // Handle exit without saving
  const handleExitWithoutSaving = () => {
    setShowExitConfirm(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  // Handle browser beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges() && !formSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Navbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <main className="p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!measurement) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Navbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <main className="p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Measurement not found
            </div>
            <button
              onClick={() => navigate('/measurements')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Measurements
            </button>
          </main>
        </div>
      </div>
    );
  }

  const fields = getFieldsForType(measurement.measurement_type);
  const measurementType = measurement.measurement_type as MeasurementType;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => handleNavigation(() => navigate(`/measurements/${id}`))}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Measurement
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Measurement</h1>
          <p className="text-gray-600 mb-6">Edit measurement items and notes</p>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Read-only Header Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Measurement Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Measurement Number</label>
                  <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md border border-gray-300">
                    {measurement.measurement_number}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md border border-gray-300">
                    {getMeasurementTypeLabel(measurement.measurement_type)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
                  <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md border border-gray-300">
                    {measurement.party_name || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Measurement Date</label>
                  <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md border border-gray-300">
                    {measurement.measurement_date ? new Date(measurement.measurement_date).toLocaleString() : '-'}
                  </div>
                </div>
                {measurement.site_location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
                    <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md border border-gray-300">
                      {measurement.site_location}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Editable Measurement Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Measurement Items</h2>
                <div className="flex gap-2">
                  {isShutterType(measurement.measurement_type) && (
                    <button
                      type="button"
                      onClick={() => setShowAreaConfig(true)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Configure Area
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Item
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {fields.map(field => (
                        <th key={field} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getFieldLabel(field, measurement.measurement_type)}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={index}>
                        {fields.map(field => {
                          const isLocationField = (field === 'location' || field === 'location_of_fitting');
                          const isReadOnly = isLocationField;
                          
                          return (
                            <td key={field} className="px-3 py-3 whitespace-nowrap min-w-[100px]">
                              {field === 'area' ? (
                                <select
                                  value={item.area || ''}
                                  onChange={(e) => updateItem(index, 'area', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                >
                                  <option value="">Select Area</option>
                                  {AREA_OPTIONS.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                  ))}
                                </select>
                              ) : isReadOnly ? (
                                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600 text-sm">
                                  {item[field] || '-'}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={item[field] || ''}
                                  onChange={(e) => handleItemFieldChange(index, field, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[80px]"
                                  placeholder={field === 'sr_no' ? 'Auto' : ''}
                                />
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length === 1}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Editable Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter any additional notes..."
              />
            </div>

            {/* Edit Remark Field */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Remark (Optional)</h2>
              <textarea
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter reason for editing this measurement..."
              />
              <p className="text-sm text-gray-500 mt-2">This remark will be recorded to track why this measurement was edited.</p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => handleNavigation(() => navigate(`/measurements/${id}`))}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Area Configuration Modal */}
          {showAreaConfig && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Configure Area Minus Values</h2>
                  <button
                    onClick={() => setShowAreaConfig(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Set minus values for each area category. These values will be automatically subtracted from Width and Height when an area is selected.
                  </p>
                  <div className="space-y-4">
                    {AREA_OPTIONS.map((area) => (
                      <div key={area} className="grid grid-cols-3 gap-4 items-center p-3 border border-gray-200 rounded-lg">
                        <div className="font-semibold text-gray-900">
                          {area === 'custom' ? 'Custom Area' : area}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Act Width(mm)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Width minus value"
                            value={areaMinusValues[area]?.width || ''}
                            onChange={(e) => {
                              setAreaMinusValues(prev => ({
                                ...prev,
                                [area]: {
                                  ...(prev[area] || {}),
                                  width: e.target.value,
                                  height: prev[area]?.height || ''
                                }
                              }));
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Act Height (mm)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Height minus value"
                            value={areaMinusValues[area]?.height || ''}
                            onChange={(e) => {
                              setAreaMinusValues(prev => ({
                                ...prev,
                                [area]: {
                                  ...(prev[area] || {}),
                                  width: prev[area]?.width || '',
                                  height: e.target.value
                                }
                              }));
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={() => setShowAreaConfig(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Save to localStorage
                      localStorage.setItem('areaMinusValues', JSON.stringify(areaMinusValues));
                      // Recalculate minus values for all existing rows
                      const updatedItems = items.map(item => {
                        if (!isShutterType(measurement.measurement_type)) {
                          return item;
                        }
                        const area = item.area === 'custom' ? (item.custom_area || '') : (item.area || '');
                        const width = item.width || '';
                        const height = item.height || '';
                        const updatedItem = { ...item };
                        
                        if (area && areaMinusValues[area]) {
                          if (width && areaMinusValues[area].width) {
                            const widthNum = parseFloat(width);
                            const minusWidthNum = parseFloat(areaMinusValues[area].width);
                            if (!isNaN(widthNum) && !isNaN(minusWidthNum)) {
                              updatedItem.minus_width = (widthNum - minusWidthNum).toString();
                            }
                          }
                          if (height && areaMinusValues[area].height) {
                            const heightNum = parseFloat(height);
                            const minusHeightNum = parseFloat(areaMinusValues[area].height);
                            if (!isNaN(heightNum) && !isNaN(minusHeightNum)) {
                              updatedItem.minus_height = (heightNum - minusHeightNum).toString();
                            }
                          }
                        }
                        // Recalculate act and RO values
                        if (updatedItem.minus_width) {
                          const minusWidthNum = parseFloat(updatedItem.minus_width);
                          if (!isNaN(minusWidthNum)) {
                            updatedItem.act_width = (minusWidthNum / 25.4).toFixed(2);
                            const roWidth = roundUpForRO(parseFloat(updatedItem.act_width));
                            updatedItem.ro_width = roWidth.toString();
                          }
                        }
                        if (updatedItem.minus_height) {
                          const minusHeightNum = parseFloat(updatedItem.minus_height);
                          if (!isNaN(minusHeightNum)) {
                            updatedItem.act_height = (minusHeightNum / 25.4).toFixed(2);
                            const roHeight = roundUpForRO(parseFloat(updatedItem.act_height));
                            updatedItem.ro_height = roHeight.toString();
                          }
                        }
                        return updatedItem;
                      });
                      setItems(updatedItems);
                      setShowAreaConfig(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save & Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Exit Confirmation Dialog */}
          {showExitConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Unsaved Changes</h3>
                  <p className="text-gray-600 mt-2">You have unsaved changes. What would you like to do?</p>
                </div>
                <div className="p-6 flex flex-col gap-3">
                  <button
                    onClick={handleSaveAndExit}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save and Exit
                  </button>
                  <button
                    onClick={handleExitWithoutSaving}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Exit Without Saving
                  </button>
                  <button
                    onClick={() => {
                      setShowExitConfirm(false);
                      setPendingNavigation(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
