import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import { useUndoRedo } from '../../context/UndoRedoContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Plus, ArrowRight, Search, ChevronDown, X, AlertTriangle, Upload, File, Image, FileText, FileSpreadsheet, Trash2, Eye, Mic, Square, Volume2 } from 'lucide-react';

type MeasurementType = 'frame_sample' | 'shutter_sample' | 'regular_frame' | 'regular_shutter' | '';

interface ContactPerson {
  name: string;
  designation?: string;
  mobile_number?: string;
  email?: string;
}

interface SiteAddress {
  project_site_name?: string;
  site_address?: string;
  site_contact_person?: string;
  site_mobile_no?: string;
}

interface Party {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  contact_persons?: ContactPerson[];
  site_addresses?: SiteAddress[];
}

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
  column3?: string;
  column4?: string;
  weidth?: string;
  colum?: string;
  heigh?: string;
  minus_width?: string;
  minus_height?: string;
  remark?: string;
  [key: string]: any;
}

const AREA_OPTIONS = [
  'MD',
  'CB',
  'MB',
  'CHB',
  'CT',
  'MT',
  'CHT',
  'TR',
  'KG',
  'DRB',
  'WC-Bath',
  'Top-Ter',
  'STR',
  'Safety-MD',
  'custom'
];

export default function CreateMeasurement() {
  const { isCollapsed, isHovered } = useSidebar();
  const { saveState } = useUndoRedo();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const partyIdFromUrl = searchParams.get('party_id');
  const [measurementType, setMeasurementType] = useState<MeasurementType>('');
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [partySearchTerm, setPartySearchTerm] = useState('');
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    measurement_number: '',
    measurement_date: new Date().toISOString().slice(0, 16),
    site_location: '',
    notes: '',
  });
  const [items, setItems] = useState<MeasurementItem[]>([{}]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingParties, setIsLoadingParties] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showRemoveConfirmDialog, setShowRemoveConfirmDialog] = useState(false);
  const [rowToRemove, setRowToRemove] = useState<number | null>(null);
  const [showAreaConfig, setShowAreaConfig] = useState(false);
  const [areaMinusValues, setAreaMinusValues] = useState<{ [key: string]: { width: string; height: string } }>({});
  const formSubmittedRef = useRef(false);
  const saveStateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFormStateRef = useRef({
    measurementType: '' as MeasurementType,
    selectedPartyId: null as number | null,
    formData: {
      measurement_number: '',
      measurement_date: new Date().toISOString().slice(0, 16),
      site_location: '',
      notes: '',
    },
    items: [{}] as MeasurementItem[],
  });
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    loadParties();
    loadNextMeasurementNumber();
    
    // Listen for undo/redo events from Navbar
    const handleUndo = (event: Event) => {
      const customEvent = event as CustomEvent;
      const state = customEvent.detail;
      if (state) {
        setFormData(state.formData);
        setItems(state.items);
        if (state.measurementType) {
          setMeasurementType(state.measurementType);
        }
        if (state.selectedPartyId !== undefined) {
          setSelectedPartyId(state.selectedPartyId);
        }
      }
    };
    
    const handleRedo = (event: Event) => {
      const customEvent = event as CustomEvent;
      const state = customEvent.detail;
      if (state) {
        setFormData(state.formData);
        setItems(state.items);
        if (state.measurementType) {
          setMeasurementType(state.measurementType);
        }
        if (state.selectedPartyId !== undefined) {
          setSelectedPartyId(state.selectedPartyId);
        }
      }
    };
    
    window.addEventListener('undo-redo-undo', handleUndo);
    window.addEventListener('undo-redo-redo', handleRedo);
    
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Allow default behavior for input fields, but handle Ctrl+Z/Y
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('undo-redo-undo'));
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('undo-redo-redo'));
        }
      } else {
        // Handle shortcuts when not in input fields
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('undo-redo-undo'));
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('undo-redo-redo'));
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('undo-redo-undo', handleUndo);
      window.removeEventListener('undo-redo-redo', handleRedo);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync initial state once after measurement_number is loaded from API
  useEffect(() => {
    if (!hasInitializedRef.current && formData.measurement_number) {
      // Capture current state values at the time measurement_number is first loaded
      initialFormStateRef.current.formData = { ...formData };
      initialFormStateRef.current.measurementType = measurementType;
      initialFormStateRef.current.selectedPartyId = selectedPartyId;
      initialFormStateRef.current.items = JSON.parse(JSON.stringify(items));
      hasInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.measurement_number]); // Only depend on measurement_number to initialize once - we intentionally capture current state values

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.party-search-container')) {
        setIsPartyDropdownOpen(false);
      }
    };

    if (isPartyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isPartyDropdownOpen]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewFile) {
        URL.revokeObjectURL(previewFile.url);
      }
    };
  }, [previewFile]);

  // Generate serial number for items when measurement type is selected
  useEffect(() => {
    const generateSerialForItems = async () => {
      if (measurementType && items.length > 0) {
        // Check if any items need serial numbers
        const itemsNeedingSerial = items.filter(item => !item.sr_no);
        if (itemsNeedingSerial.length > 0) {
          try {
            // Generate serial numbers for all items that need them
            const updatedItems = [...items];
            let hasUpdates = false;
            for (let i = 0; i < updatedItems.length; i++) {
              if (!updatedItems[i].sr_no) {
                try {
                  const response = await api.get('/production/measurements/next-serial-number', true);
                  updatedItems[i] = { ...updatedItems[i], sr_no: response.serial_number };
                  hasUpdates = true;
                } catch (err: any) {
                  // If API fails for one item, continue with others
                  console.error('Failed to generate serial number for item:', err);
                  // Show error to user only once
                  if (err.response?.data?.detail) {
                    setError(err.response.data.detail);
                  } else if (err.message) {
                    setError(err.message || 'Failed to generate serial number. Please contact admin to assign a prefix.');
                  }
                }
              }
            }
            // Only update if we actually generated any serial numbers
            if (hasUpdates) {
              setItems(updatedItems);
            }
          } catch (err: any) {
            console.error('Failed to generate serial numbers:', err);
          }
        }
      }
    };
    
    generateSerialForItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurementType]); // Run when measurement type changes

  // Generate serial numbers for items without them when new items are added (but avoid infinite loops)
  const prevItemsLengthRef = useRef(items.length);
  const isGeneratingRef = useRef(false);
  
  useEffect(() => {
    // Only run if items length increased (new item added) and measurement type is set
    // Also check if we're not already generating to avoid infinite loops
    if (measurementType && items.length > prevItemsLengthRef.current && !isGeneratingRef.current) {
      const generateMissingSerials = async () => {
        const itemsNeedingSerial = items.filter(item => !item.sr_no);
        if (itemsNeedingSerial.length > 0) {
          isGeneratingRef.current = true;
          try {
            const updatedItems = [...items];
            let hasUpdates = false;
            for (let i = 0; i < updatedItems.length; i++) {
              if (!updatedItems[i].sr_no) {
                try {
                  const response = await api.get('/production/measurements/next-serial-number', true);
                  updatedItems[i] = { ...updatedItems[i], sr_no: response.serial_number };
                  hasUpdates = true;
                } catch (err: any) {
                  console.error('Failed to generate serial number for item:', err);
                  const errorMessage = err.response?.data?.detail || err.message;
                  if (errorMessage) {
                    setError(errorMessage);
                  }
                }
              }
            }
            if (hasUpdates) {
              setItems(updatedItems);
            }
          } catch (err: any) {
            console.error('Failed to generate serial numbers:', err);
          } finally {
            isGeneratingRef.current = false;
          }
        }
      };
      
      // Small delay to avoid race conditions
      const timer = setTimeout(() => {
        generateMissingSerials();
      }, 100);
      
      prevItemsLengthRef.current = items.length;
      return () => {
        clearTimeout(timer);
        isGeneratingRef.current = false;
      };
    } else {
      prevItemsLengthRef.current = items.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, measurementType]); // Run when items are added or measurement type changes

  const loadNextMeasurementNumber = async () => {
    try {
      const data = await api.get('/production/measurements/next-number', true);
      if (data.measurement_number) {
        setFormData(prev => ({ ...prev, measurement_number: data.measurement_number }));
      }
    } catch (err: any) {
      console.error('Failed to load next measurement number:', err);
    }
  };

  const loadParties = async () => {
    try {
      setIsLoadingParties(true);
      const data = await api.get('/production/parties', true);
      setParties(data);
    } catch (err: any) {
      console.error('Failed to load parties:', err);
    } finally {
      setIsLoadingParties(false);
    }
  };

  // Round-up function for RO Width/Height calculation
  // Rule: x.01 – x.10 → x, x.11 – x.60 → x.5, x.61 – (x+1).10 → x+1
  // Examples: 31.01-31.10→31, 31.11-31.60→31.5, 31.61-32.10→32, 32.11-32.60→32.5, 32.61-33.10→33
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
    // This means: 31.61 to 32.10 all round to 32
    // So if decimal >= 0.61, round up to next integer
    if (decimalPart >= 0.61) {
      return integerPart + 1;
    }
    
    return value;
  };

  const getFieldsForType = (type: MeasurementType): string[] => {
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

  const getFieldLabel = (field: string, type?: MeasurementType): string => {
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
      location_of_fitting: 'Location of Fitting',
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
      weidth: 'Weidth',
      colum: 'Column',
      heigh: 'Heigh',
      column3: 'Column3',
      column4: 'Column4',
      minus_width: 'Act Width(mm)',
      minus_height: 'Act Height (mm)',
      act_sq_ft: 'Act Sq. Ft.',
      remark: 'Remark',
    };
    return labels[field] || field;
  };

  const getFieldPlaceholder = (field: string, type: MeasurementType): string => {
    const placeholders: { [key: string]: { [key in MeasurementType]?: string } } = {
      sr_no: {
        frame_sample: 'User-specific serial (e.g., A00001)',
        shutter_sample: 'User-specific serial (e.g., A00001)',
        regular_frame: 'User-specific serial (e.g., A00001)',
        regular_shutter: 'User-specific serial (e.g., A00001)',
      },
      location_of_fitting: {
        frame_sample: 'Auto-generated from BLDG/Wings, Flat No, and Area',
        regular_frame: 'Auto-generated from BLDG/Wings, Flat No, and Area',
      },
      location: {
        shutter_sample: 'Auto-generated from BLDG/Wings, Flat No, and Area',
        regular_shutter: 'Auto-generated from BLDG/Wings, Flat No, and Area',
      },
      hinges: {
        regular_frame: 'e.g., A-101-MD, A-101-CB',
      },
      bldg: {
        frame_sample: 'Building letter (e.g., A, B, C)',
        shutter_sample: 'Building/Wings (e.g., A)',
        regular_frame: 'Building letter (e.g., A, B, C)',
        regular_shutter: 'Building (e.g., A)',
      },
      flat_no: {
        frame_sample: 'Flat number (e.g., 102, 103)',
        shutter_sample: 'Flat number (e.g., 102)',
        regular_frame: 'Flat number (e.g., 102, 103)',
        regular_shutter: 'Flat number (e.g., 101, 402, 203)',
      },
      area: {
        frame_sample: 'Area code (e.g., MD, CHB, CB, MB)',
        shutter_sample: 'Area (e.g., MD, SAFETY, CHB, CB, MB, MT, CT)',
        regular_frame: 'Area code (e.g., MD, CHB, CB, MB)',
        regular_shutter: 'Area (e.g., MD)',
      },
      act_width: {
        frame_sample: 'Actual width in mm (e.g., 986, 898, 900)',
        shutter_sample: 'Actual width in inches (e.g., 35.16, 35.12)',
        regular_frame: 'Actual width in mm (e.g., 986, 898, 900)',
        regular_shutter: 'Actual width in inches (e.g., 35.51, 35.31)',
      },
      act_height: {
        frame_sample: 'Actual height in mm (e.g., 2310)',
        shutter_sample: 'Actual height in inches (e.g., 88.31, 88.19)',
        regular_frame: 'Actual height in mm (e.g., 2310)',
        regular_shutter: 'Actual height in inches (e.g., 88.82, 89.25)',
      },
      ro_width: {
        shutter_sample: 'RO Width(inches)',
        regular_shutter: 'RO Width(inches)',
      },
      ro_height: {
        shutter_sample: 'RO Height(inches)',
        regular_shutter: 'RO Height(inches)',
      },
      act_sq_ft: {
        shutter_sample: 'Calculated from Act Width(mm) and Act Height (mm)',
        regular_shutter: 'Calculated from Act Width(mm) and Act Height (mm)',
      },
      wall: {
        frame_sample: 'Wall thickness (e.g., 190, 4.5")',
        shutter_sample: 'Wall type',
        regular_frame: 'Wall thickness (e.g., 190, 4.5")',
        regular_shutter: 'Wall type (e.g., A, AA, AB, AC, B, BA)',
      },
      subframe_side: {
        frame_sample: 'Subframe side (e.g., L+T, R+T)',
        regular_frame: 'Subframe side (e.g., L+T, R+T)',
      },
      sub_frame: {
        regular_frame: 'Sub Frame (e.g., R+T)',
      },
      h: {
        shutter_sample: 'Height in inches (e.g., 35.5, 36)',
        regular_shutter: 'Height in inches (e.g., 35.5, 36)',
      },
      w: {
        shutter_sample: 'Width in inches (e.g., 88, 88.5, 89)',
        regular_frame: 'Width',
        regular_shutter: 'Width in inches (e.g., 88, 88.5, 89)',
      },
      qty: {
        shutter_sample: 'Quantity (e.g., 2, 1)',
        regular_frame: 'Quantity',
        regular_shutter: 'Quantity (e.g., 2, 1)',
      },
      width: {
        shutter_sample: 'Width in mm (e.g., 903, 902)',
        regular_frame: 'Width in mm',
        regular_shutter: 'Width in mm (e.g., 909, 906)',
      },
      minus_width: {
        shutter_sample: 'Minus value for Width',
        regular_shutter: 'Minus value for Width',
      },
      height: {
        shutter_sample: 'Height in mm (e.g., 2255, 2252)',
        regular_frame: 'Height in mm',
        regular_shutter: 'Height in mm (e.g., 2250, 2238)',
      },
      minus_height: {
        shutter_sample: 'Minus value for Height',
        regular_shutter: 'Minus value for Height',
      },
      weidth: {
        shutter_sample: 'Weidth in mm (e.g., 903, 902)',
      },
      colum: {
        shutter_sample: 'Column in mm (e.g., 893, 892)',
      },
      heigh: {
        shutter_sample: 'Height in mm (e.g., 2255, 2252)',
      },
      column3: {
        regular_frame: 'Column3 in mm',
        regular_shutter: 'Column3 in mm (e.g., 902, 897)',
      },
      column4: {
        shutter_sample: 'Column4 in mm (e.g., 2243, 2240)',
        regular_frame: 'Column4 in mm',
        regular_shutter: 'Column4 in mm (e.g., 2256, 2267)',
      },
      remark: {
        frame_sample: 'Enter any remarks or notes',
        shutter_sample: 'Enter any remarks or notes',
        regular_frame: 'Enter any remarks or notes',
        regular_shutter: 'Enter any remarks or notes',
      },
    };
    return placeholders[field]?.[type] || getFieldLabel(field, type);
  };

  const addItem = async () => {
    try {
      // Get next serial number from API
      const response = await api.get('/production/measurements/next-serial-number', true);
      const serialNumber = response.serial_number;
      
      // Add new item with the serial number
      setItems([...items, { sr_no: serialNumber }]);
      // Clear any previous errors on success
      setError('');
    } catch (err: any) {
      // If API fails (e.g., prefix not assigned), show error but still allow adding row
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to generate serial number. Please contact admin to assign a prefix.';
      setError(errorMessage);
      console.error('Failed to generate serial number:', err);
      // Add row without serial number - user can manually enter or it will be generated on save
      setItems([...items, {}]);
    }
  };

  const handleRemoveClick = (index: number) => {
    if (items.length > 1) {
      setRowToRemove(index);
      setShowRemoveConfirmDialog(true);
    }
  };

  const confirmRemoveItem = () => {
    if (rowToRemove !== null && items.length > 1) {
      setItems(items.filter((_, i) => i !== rowToRemove));
      setShowRemoveConfirmDialog(false);
      setRowToRemove(null);
    }
  };

  const cancelRemoveItem = () => {
    setShowRemoveConfirmDialog(false);
    setRowToRemove(null);
  };


  // Helper function to check if a field is editable
  const isEditableField = (field: string, type: MeasurementType): boolean => {
    if (field === 'sr_no') return false;
    if (field === 'location_of_fitting' && (type === 'frame_sample' || type === 'regular_frame')) return false;
    if (field === 'location' && (type === 'shutter_sample' || type === 'regular_shutter')) return false;
    return true;
  };

  // Helper function to get the first editable field
  const getFirstEditableField = (type: MeasurementType): string | null => {
    const fieldsList = getFieldsForType(type);
    for (const field of fieldsList) {
      if (isEditableField(field, type)) {
        return field;
      }
    }
    return null;
  };

  // Helper function to check if current field is the last editable field in the row
  const isLastEditableField = (currentField: string, type: MeasurementType): boolean => {
    const fieldsList = getFieldsForType(type);
    let foundCurrent = false;
    for (let i = fieldsList.length - 1; i >= 0; i--) {
      const field = fieldsList[i];
      if (isEditableField(field, type)) {
        if (foundCurrent) {
          return false; // There's another editable field after current
        }
        if (field === currentField) {
          foundCurrent = true;
        }
      }
    }
    return foundCurrent; // Current field is the last editable field
  };

  // Helper function to focus the next input field in the same row
  const focusNextField = (currentRowIndex: number, currentField: string) => {
    const fieldsList = getFieldsForType(measurementType);
    const currentFieldIndex = fieldsList.indexOf(currentField);
    if (currentFieldIndex === -1) return;
    
    // Check if this is the last editable field - if so, add a new row
    if (isLastEditableField(currentField, measurementType)) {
      addItem();
      // Focus the first editable field of the new row
      setTimeout(() => {
        const newRowIndex = items.length; // New row will be at this index
        const firstEditableField = getFirstEditableField(measurementType);
        if (firstEditableField) {
          const nextInput = document.querySelector(
            `input[data-row-index="${newRowIndex}"][data-field="${firstEditableField}"], 
             select[data-row-index="${newRowIndex}"][data-field="${firstEditableField}"]`
          ) as HTMLInputElement | HTMLSelectElement;
          
          if (nextInput) {
            nextInput.focus();
            // For select elements, open the dropdown
            if (nextInput instanceof HTMLSelectElement) {
              nextInput.click();
            }
          }
        }
      }, 50); // Slightly longer delay to ensure new row is rendered
      return;
    }
    
    // Find the next editable field
    for (let i = currentFieldIndex + 1; i < fieldsList.length; i++) {
      const nextField = fieldsList[i];
      
      // Skip non-editable fields
      if (!isEditableField(nextField, measurementType)) continue;
      
      // Find and focus the next input/select element
      setTimeout(() => {
        const nextInput = document.querySelector(
          `input[data-row-index="${currentRowIndex}"][data-field="${nextField}"], 
           select[data-row-index="${currentRowIndex}"][data-field="${nextField}"]`
        ) as HTMLInputElement | HTMLSelectElement;
        
        if (nextInput) {
          nextInput.focus();
          // For select elements, open the dropdown
          if (nextInput instanceof HTMLSelectElement) {
            nextInput.click();
          }
        }
      }, 10);
      break;
    }
  };

  // Save state to history with debouncing
  const saveStateToHistory = useCallback(() => {
    if (saveStateTimeoutRef.current) {
      clearTimeout(saveStateTimeoutRef.current);
    }
    saveStateTimeoutRef.current = setTimeout(() => {
      const stateToSave = {
        ...formData,
        measurementType,
        selectedPartyId,
      };
      saveState(stateToSave, items);
    }, 300); // Debounce for 300ms
  }, [formData, items, measurementType, selectedPartyId, saveState]);

  // Save state whenever form data or items change
  useEffect(() => {
    if (hasInitializedRef.current && !formSubmittedRef.current) {
      saveStateToHistory();
    }
    return () => {
      if (saveStateTimeoutRef.current) {
        clearTimeout(saveStateTimeoutRef.current);
      }
    };
  }, [formData, items, measurementType, selectedPartyId, saveStateToHistory]);

  const handleItemFieldChange = (index: number, field: string, value: string) => {
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
    newItems[index] = { ...newItems[index], [field]: value };

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

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (formSubmittedRef.current) return false;
    if (!hasInitializedRef.current) return false; // Don't detect changes until initialized
    
    const initial = initialFormStateRef.current;
    const hasFormChanges = 
      measurementType !== initial.measurementType ||
      selectedPartyId !== initial.selectedPartyId ||
      formData.measurement_number !== initial.formData.measurement_number ||
      formData.measurement_date !== initial.formData.measurement_date ||
      formData.site_location !== initial.formData.site_location ||
      formData.notes !== initial.formData.notes;
    
    const hasItemsChanges = JSON.stringify(items) !== JSON.stringify(initial.items);
    
    return hasFormChanges || hasItemsChanges;
  }, [measurementType, selectedPartyId, formData, items]);

  // Handle browser back/forward and page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges() && !formSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    // Handle browser back/forward button
    const handlePopState = (_e: PopStateEvent) => {
      if (hasUnsavedChanges() && !formSubmittedRef.current) {
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
        // Show confirmation dialog
        setShowConfirmDialog(true);
        setPendingNavigation(() => () => {
          // Navigate back after user confirms
          window.history.back();
        });
      }
    };

    // Push a state to the history stack so we can detect back button
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);

  // Handle navigation blocking for internal routes
  // Note: useBlocker requires a data router, so we use a simpler approach
  // Browser navigation (refresh/close) is handled by beforeunload event above

  const handleCancelNavigation = () => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
  };

  const handleConfirmNavigation = () => {
    // Close the dialog first
    setShowConfirmDialog(false);
    
    // Clear the pending navigation
    setPendingNavigation(null);
    
    // Mark form as submitted to prevent further warnings
    formSubmittedRef.current = true;
    
    // Always navigate to measurements list without saving
    navigate('/measurements');
  };

  const handleSaveAndNavigate = async () => {
    setShowConfirmDialog(false);
    const navFunction = pendingNavigation;
    setPendingNavigation(null);
    
    // Validate and save
    setError('');
    if (!selectedPartyId) {
      setError('Please select a party to save the measurement');
      return;
    }

    const validItems = items.filter(item => {
      return Object.keys(item).some(key => {
        if (key === 'custom_area') return false;
        const value = item[key];
        return value !== null && value !== undefined && value !== '';
      });
    });

    if (validItems.length === 0) {
      setError('Please add at least one measurement item with data to save');
      return;
    }

    setIsLoading(true);

    try {
      const partyId = selectedPartyId;
      const party = parties.find(p => p.id === selectedPartyId);
      const partyName = party?.name || '';

      // Generate serial numbers for items that don't have one
      const itemsWithSrNo = await Promise.all(
        validItems.map(async (item, index) => {
          const cleanedItem = { ...item };
          delete cleanedItem.custom_area;
          
          // If item already has a serial number, use it; otherwise generate a new one
          let serialNumber = item.sr_no;
          if (!serialNumber) {
            try {
              const response = await api.get('/production/measurements/next-serial-number', true);
              serialNumber = response.serial_number;
            } catch (err: any) {
              // If API fails, fall back to index-based number (shouldn't happen in normal flow)
              serialNumber = String(index + 1);
              console.error('Failed to generate serial number:', err);
            }
          }
          
          return {
            ...cleanedItem,
            sr_no: serialNumber,
          };
        })
      );

      const attachments: Array<{ name: string; content: string; type: string }> = [];
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              const base64Content = result.split(',')[1] || result;
              resolve(base64Content);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          attachments.push({
            name: file.name,
            content: base64,
            type: file.type || 'application/octet-stream',
          });
        }
      }

      const measurementData = {
        measurement_type: measurementType,
        measurement_number: formData.measurement_number || undefined,
        party_id: partyId,
        party_name: partyName,
        thickness: null,
        measurement_date: formData.measurement_date ? new Date(formData.measurement_date).toISOString() : null,
        site_location: formData.site_location || null,
        items: itemsWithSrNo,
        notes: formData.notes || null,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      await api.post('/production/measurements', measurementData, true);
      formSubmittedRef.current = true;
      
      // Navigate after successful save
      if (navFunction) {
        navFunction();
      } else {
        navigate('/measurements');
      }
    } catch (err: any) {
      console.error('Measurement creation error:', err);
      setError(err.message || 'Failed to save measurement. Please check all fields and try again.');
      formSubmittedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach((file) => {
      // Check file type
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName);
      const isPdf = fileType === 'application/pdf' || fileName.endsWith('.pdf');
      const isExcel = 
        fileType.includes('spreadsheet') || 
        fileType.includes('excel') ||
        /\.(xls|xlsx|xlsm)$/i.test(fileName);
      const isAudio = fileType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(fileName);

      if (!isImage && !isPdf && !isExcel && !isAudio) {
        setError(`File "${file.name}" is not a valid image, PDF, Excel, or audio file.`);
        return;
      }

      if (file.size > maxSize) {
        setError(`File "${file.name}" exceeds the maximum size of 10MB.`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles]);
      setError(''); // Clear any previous errors
    }

    // Reset input
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      // Check if MediaRecorder is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Audio recording is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.');
        return;
      }

      if (!window.MediaRecorder) {
        setError('MediaRecorder API is not supported in your browser. Please use a modern browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine the best mimeType for the browser
      let mimeType = '';
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav'
      ];
      
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      // If no specific type is supported, let MediaRecorder choose
      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        setError('An error occurred while recording. Please try again.');
        stopRecording();
      };
      
      recorder.onstop = () => {
        if (chunks.length === 0) {
          setError('No audio data was recorded. Please try again.');
          stream.getTracks().forEach(track => track.stop());
          setRecordingTime(0);
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          return;
        }

        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        
        // Determine file extension based on mimeType
        let extension = 'webm';
        if (recorder.mimeType.includes('mp4')) {
          extension = 'mp4';
        } else if (recorder.mimeType.includes('ogg')) {
          extension = 'ogg';
        } else if (recorder.mimeType.includes('wav')) {
          extension = 'wav';
        }
        
        const fileName = `recording_${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`;
        // Create File object from blob
        const fileOptions: FilePropertyBag = { type: recorder.mimeType || blob.type };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const FileConstructor = File as any;
        const file = new FileConstructor([blob], fileName, fileOptions) as File;
        setUploadedFiles((prev) => [...prev, file]);
        stream.getTracks().forEach(track => track.stop()); // Stop the media stream
        setRecordingTime(0);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };
      
      // Start recording with timeslice to ensure data is available
      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      setError(''); // Clear any previous errors
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
    } catch (err: any) {
      console.error('Error starting recording:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission was denied. Please allow microphone access and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Microphone is already in use by another application. Please close other applications and try again.');
      } else {
        setError(`Could not access microphone: ${err.message || 'Unknown error'}. Please check permissions and try again.`);
      }
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      try {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        setIsRecording(false);
        // Don't set mediaRecorder to null here - let onstop handle it
      } catch (err) {
        console.error('Error stopping recording:', err);
        setError('Error stopping recording. Please try again.');
        setIsRecording(false);
        setMediaRecorder(null);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (mediaRecorder) {
        try {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        } catch (err) {
          console.error('Error cleaning up recorder:', err);
        }
      }
    };
  }, [mediaRecorder]);

  const handleRemoveFile = (index: number) => {
    // If the file being removed is currently being previewed, close the preview
    if (previewFile && uploadedFiles[index] === previewFile.file) {
      handleClosePreview();
    }
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleViewFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewFile({ file, url });
  };

  const handleClosePreview = () => {
    if (previewFile) {
      URL.revokeObjectURL(previewFile.url);
      setPreviewFile(null);
    }
  };

  const isImageFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName) || file.type.startsWith('image/');
  };

  const isPdfFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.pdf') || file.type === 'application/pdf';
  };

  const isExcelFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    return /\.(xls|xlsx|xlsm)$/i.test(fileName) || file.type.includes('spreadsheet') || file.type.includes('excel');
  };

  const isAudioFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    return file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(fileName);
  };

  const getFileIcon = (file: File) => {
    const fileName = file.name.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName)) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (fileName.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (/\.(xls|xlsx|xlsm)$/i.test(fileName)) {
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    } else if (isAudioFile(file)) {
      return <Volume2 className="w-5 h-5 text-purple-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!selectedPartyId) {
      setError('Please select a party');
      return;
    }

    // Filter out completely empty items
    const validItems = items.filter(item => {
      // Check if item has at least one non-empty field (excluding custom_area)
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

    setIsLoading(true);

    try {
      const partyId = selectedPartyId;
      const party = parties.find(p => p.id === selectedPartyId);
      const partyName = party?.name || '';

      // Ensure each item has a user-specific serial number
      // Clean up custom_area field (it's only for UI state, area field has the actual value)
      const itemsWithSrNo = await Promise.all(
        validItems.map(async (item, index) => {
          const cleanedItem = { ...item };
          // Remove custom_area as it's only for internal state management
          delete cleanedItem.custom_area;
          
          // If item already has a serial number, use it; otherwise generate a new one
          let serialNumber = item.sr_no;
          if (!serialNumber) {
            try {
              const response = await api.get('/production/measurements/next-serial-number', true);
              serialNumber = response.serial_number;
            } catch (err: any) {
              // If API fails, fall back to index-based number (shouldn't happen in normal flow)
              serialNumber = String(index + 1);
              console.error('Failed to generate serial number:', err);
            }
          }
          
          return {
            ...cleanedItem,
            sr_no: serialNumber,
          };
        })
      );

      // Convert files to base64 if any files are uploaded
      const attachments: Array<{ name: string; content: string; type: string }> = [];
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              // Remove data URL prefix (e.g., "data:image/png;base64,")
              const base64Content = result.split(',')[1] || result;
              resolve(base64Content);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          attachments.push({
            name: file.name,
            content: base64,
            type: file.type || 'application/octet-stream',
          });
        }
      }

      const measurementData = {
        measurement_type: measurementType,
        measurement_number: formData.measurement_number || undefined, // Let backend auto-generate if empty
        party_id: partyId,
        party_name: partyName,
        thickness: null,
        measurement_date: formData.measurement_date ? new Date(formData.measurement_date).toISOString() : null,
        site_location: formData.site_location || null,
        items: itemsWithSrNo,
        notes: formData.notes || null,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      await api.post('/production/measurements', measurementData, true);
      formSubmittedRef.current = true;
      navigate('/measurements');
    } catch (err: any) {
      console.error('Measurement creation error:', err);
      setError(err.message || 'Failed to create measurement. Please check all fields and try again.');
      formSubmittedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const fields = getFieldsForType(measurementType);
  const selectedParty = parties.find(p => p.id === selectedPartyId);
  
  // Filter parties based on search term (keyword search)
  const filteredParties = partySearchTerm.trim()
    ? parties.filter(party => {
        const searchLower = partySearchTerm.toLowerCase().trim();
        const searchTerm = partySearchTerm.trim();
        return (
          party.name.toLowerCase().includes(searchLower) ||
          (party.contact_person && party.contact_person.toLowerCase().includes(searchLower)) ||
          (party.email && party.email.toLowerCase().includes(searchLower)) ||
          (party.phone && party.phone.includes(searchTerm)) ||
          // Search in contact_persons array
          (party.contact_persons && party.contact_persons.some(cp => 
            (cp.name && cp.name.toLowerCase().includes(searchLower)) ||
            (cp.mobile_number && cp.mobile_number.includes(searchTerm)) ||
            (cp.email && cp.email.toLowerCase().includes(searchLower))
          )) ||
          // Search in site_addresses array
          (party.site_addresses && party.site_addresses.some(sa => 
            (sa.site_address && sa.site_address.toLowerCase().includes(searchLower)) ||
            (sa.project_site_name && sa.project_site_name.toLowerCase().includes(searchLower))
          ))
        );
      })
    : parties;
  
  // Auto-select party from URL query parameter
  useEffect(() => {
    // Only auto-select if party_id is in URL and parties are loaded
    if (partyIdFromUrl && parties.length > 0 && !selectedPartyId) {
      const partyId = parseInt(partyIdFromUrl);
      const party = parties.find(p => p.id === partyId);
      if (party) {
        setSelectedPartyId(partyId);
        setPartySearchTerm(party.name);
      }
    }
  }, [partyIdFromUrl, parties, selectedPartyId]);

  // Update search term when party is selected
  useEffect(() => {
    if (selectedParty) {
      setPartySearchTerm(selectedParty.name);
      setIsPartyDropdownOpen(false);
    }
  }, [selectedPartyId, selectedParty]);

  return (
    <>
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 mx-2">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Unsaved Changes
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  You have unsaved changes. What would you like to do?
                </p>
                <div className="flex flex-col gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleSaveAndNavigate}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Measurement'}
                  </button>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={handleCancelNavigation}
                      className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmNavigation}
                      className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Leave Without Saving
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Row Confirmation Dialog */}
      {showRemoveConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 mx-2">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Remove Row
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">
                  Are you sure you want to remove this row? This action cannot be undone and all data in this row will be lost.
                </p>
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 sm:space-x-0">
                  <button
                    type="button"
                    onClick={cancelRemoveItem}
                    className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmRemoveItem}
                    className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Remove Row
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  // Recalculate minus values for all existing rows
                  const updatedItems = items.map(item => {
                    if (measurementType !== 'shutter_sample' && measurementType !== 'regular_shutter') {
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

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2 sm:p-4" onClick={handleClosePreview}>
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col mx-2" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getFileIcon(previewFile.file)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
                    {previewFile.file.name}
                  </h3>
                  <span className="text-xs sm:text-sm text-gray-500 block sm:inline sm:ml-2">
                    ({formatFileSize(previewFile.file.size)})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClosePreview}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex-shrink-0 ml-2"
                title="Close preview"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-2 sm:p-4">
              {isImageFile(previewFile.file) ? (
                <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                  <img
                    src={previewFile.url}
                    alt={previewFile.file.name}
                    className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-lg"
                  />
                </div>
              ) : isPdfFile(previewFile.file) ? (
                <div className="w-full h-[60vh] sm:h-[70vh]">
                  <iframe
                    src={previewFile.url}
                    className="w-full h-full border border-gray-300 rounded-lg"
                    title={previewFile.file.name}
                  />
                </div>
              ) : isAudioFile(previewFile.file) ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] p-4 sm:p-8">
                  <Volume2 className="w-16 h-16 sm:w-24 sm:h-24 text-purple-500 mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base md:text-lg font-medium text-gray-900 mb-2 text-center px-2">
                    {previewFile.file.name}
                  </p>
                  <audio
                    controls
                    src={previewFile.url}
                    className="w-full max-w-md mt-3 sm:mt-4"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : isExcelFile(previewFile.file) ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] p-4 sm:p-8">
                  <FileSpreadsheet className="w-16 h-16 sm:w-24 sm:h-24 text-green-500 mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base md:text-lg font-medium text-gray-900 mb-2 text-center">
                    Excel File Preview
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 text-center max-w-md px-2">
                    Excel files cannot be previewed in the browser. Please download the file to view its contents.
                  </p>
                  <a
                    href={previewFile.url}
                    download={previewFile.file.name}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Download File
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] p-4 sm:p-8">
                  <File className="w-16 h-16 sm:w-24 sm:h-24 text-gray-400 mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base md:text-lg font-medium text-gray-900 mb-2 text-center">
                    File Preview Not Available
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 text-center max-w-md px-2">
                    This file type cannot be previewed in the browser.
                  </p>
                  <a
                    href={previewFile.url}
                    download={previewFile.file.name}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                  >
                    <File className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'} pt-16 max-w-full overflow-x-hidden`}>
        <main className="p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Create Measurement</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 sm:mt-2">Add a new measurement document</p>
          </div>

          <div className="bg-white rounded-lg shadow max-w-7xl mx-auto">
            <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs sm:text-sm md:text-base">
                  {error}
                </div>
              )}

              {/* Measurement Type */}
              <div>
                <label htmlFor="measurement_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Measurement Type *
                </label>
                <select
                  id="measurement_type"
                  required
                  className={`w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 font-semibold ${
                    measurementType === '' 
                      ? 'bg-gray-50 text-gray-500 border-gray-300 focus:ring-gray-500 focus:border-gray-400' 
                      : measurementType === 'frame_sample' 
                      ? 'bg-amber-50 text-amber-900 border-amber-300 focus:ring-amber-500 focus:border-amber-400' 
                      : measurementType === 'shutter_sample' 
                      ? 'bg-blue-50 text-blue-900 border-blue-300 focus:ring-blue-500 focus:border-blue-400'
                      : measurementType === 'regular_frame' 
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 focus:ring-emerald-500 focus:border-emerald-400'
                      : 'bg-pink-50 text-pink-900 border-pink-300 focus:ring-pink-500 focus:border-pink-400'
                  }`}
                  value={measurementType}
                  onChange={async (e) => {
                    const newType = e.target.value as MeasurementType;
                    setMeasurementType(newType);
                    // Reset items when type changes
                    if (newType) {
                      // Generate serial number for the first item when type is selected
                      try {
                        const response = await api.get('/production/measurements/next-serial-number', true);
                        const serialNumber = response.serial_number;
                        setItems([{ sr_no: serialNumber }]);
                        // Clear any previous errors on success
                        setError('');
                      } catch (err: any) {
                        // If API fails, just add empty item (will be generated on save)
                        const errorMessage = err.response?.data?.detail || err.message || 'Failed to generate serial number. Please contact admin to assign a prefix.';
                        setError(errorMessage);
                        console.error('Failed to generate serial number:', err);
                        setItems([{}]);
                      }
                    } else {
                      setItems([{}]);
                    }
                  }}
                >
                  <option value="" className="bg-gray-50 text-gray-500 font-semibold">
                    Select Measurement Type *
                  </option>
                  <option value="frame_sample" className="bg-amber-50 text-amber-900 font-semibold">
                    ▢ Sample Frame
                  </option>
                  <option value="shutter_sample" className="bg-blue-50 text-blue-900 font-semibold">
                    🚪 Sample Shutter
                  </option>
                  <option value="regular_frame" className="bg-emerald-50 text-emerald-900 font-semibold">
                    ▢ Regular Frame
                  </option>
                  <option value="regular_shutter" className="bg-pink-50 text-pink-900 font-semibold">
                    🚪 Regular Shutter
                  </option>
                </select>
              </div>

              {/* Party Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative party-search-container">
                  <label htmlFor="party" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Party
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                    id="party"
                      className="w-full pl-10 pr-10 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search party by name, contact, or email..."
                      value={partySearchTerm}
                    onChange={(e) => {
                        const value = e.target.value;
                        setPartySearchTerm(value);
                        setIsPartyDropdownOpen(true);
                        // Clear selection if user starts typing a new search (different from selected party name)
                        if (selectedPartyId && selectedParty && value !== selectedParty.name) {
                          setSelectedPartyId(null);
                        }
                      }}
                      onFocus={() => {
                        // Show dropdown when focused, allowing user to see all parties or search by keyword
                        if (parties.length > 0) {
                          setIsPartyDropdownOpen(true);
                        }
                    }}
                    disabled={isLoadingParties}
                    />
                    {partySearchTerm && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPartySearchTerm('');
                          setSelectedPartyId(null);
                          setIsPartyDropdownOpen(false);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {!partySearchTerm && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Dropdown list */}
                  {isPartyDropdownOpen && !isLoadingParties && filteredParties.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredParties.map((party) => (
                        <div
                          key={party.id}
                          onClick={() => {
                            setSelectedPartyId(party.id);
                            setPartySearchTerm(party.name);
                            setIsPartyDropdownOpen(false);
                          }}
                          className={`px-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                            selectedPartyId === party.id ? 'bg-blue-100' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900">{party.name}</div>
                          {/* Show contact person name from contact_persons array if available */}
                          {party.contact_persons && party.contact_persons.length > 0 && party.contact_persons[0].name && (
                            <div className="text-sm text-gray-500">{party.contact_persons[0].name}</div>
                          )}
                          {/* Show contact person name from legacy field if contact_persons not available */}
                          {(!party.contact_persons || party.contact_persons.length === 0) && party.contact_person && (
                            <div className="text-sm text-gray-500">{party.contact_person}</div>
                          )}
                          {/* Show contact number */}
                          {party.contact_persons && party.contact_persons.length > 0 && party.contact_persons[0].mobile_number && (
                            <div className="text-sm text-gray-600">
                              📞 {party.contact_persons[0].mobile_number}
                            </div>
                          )}
                          {/* Show site address */}
                          {party.site_addresses && party.site_addresses.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              📍 {party.site_addresses[0].site_address || party.site_addresses[0].project_site_name || 'Site Address'}
                            </div>
                          )}
                          {party.email && (
                            <div className="text-xs text-gray-400">{party.email}</div>
                          )}
                        </div>
                      ))}
                      {filteredParties.length > 10 && (
                        <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-200">
                          Showing {filteredParties.length} parties. Type to search by keyword.
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* No results message */}
                  {isPartyDropdownOpen && !isLoadingParties && partySearchTerm.trim() && filteredParties.length === 0 && parties.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-sm text-gray-500">
                      No parties found matching "{partySearchTerm}"
                    </div>
                  )}
                  
                  {/* Loading state */}
                  {isLoadingParties && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-sm text-gray-500">
                      Loading parties...
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or Create New Party
                  </label>
                  <Link
                    to="/parties/create"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create New Party</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {selectedParty && (
                <div className="bg-blue-50 p-2 sm:p-3 rounded">
                  <p className="text-xs sm:text-sm text-gray-700 break-words">
                    <strong>Selected Party:</strong> {selectedParty.name}
                    {selectedParty.contact_person && ` - ${selectedParty.contact_person}`}
                  </p>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="measurement_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Measurement Number *
                  </label>
                  <input
                    type="text"
                    id="measurement_number"
                    required
                    readOnly
                    className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    value={formData.measurement_number}
                    placeholder="Auto-generated (e.g., MP00001)"
                    title="Auto-generated measurement number"
                  />
                  <p className="mt-1 text-xs text-gray-500">Auto-generated measurement number</p>
                </div>
                <div>
                  <label htmlFor="measurement_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Measurement Date/Time
                  </label>
                  <input
                    type="datetime-local"
                    id="measurement_date"
                    className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.measurement_date}
                    onChange={(e) => setFormData({ ...formData, measurement_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Measurement Items Table */}
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 sm:mb-4 gap-2 sm:gap-3">
                  <div className="flex-1 w-full md:w-auto">
                    <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Measurement Items</h2>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-0.5 sm:mt-1">
                      {measurementType === 'frame_sample' || measurementType === 'regular_frame' 
                        ? 'Enter measurements in millimeters (mm)'
                        : 'Enter actual measurements in inches, calculated measurements in millimeters (mm)'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(measurementType === 'shutter_sample' || measurementType === 'regular_shutter') && (
                      <button
                        type="button"
                        onClick={() => setShowAreaConfig(true)}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors whitespace-nowrap text-xs sm:text-sm font-medium shadow-sm hover:shadow-md w-full md:w-auto justify-center"
                      >
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Set Area Values
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={addItem}
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors whitespace-nowrap text-xs sm:text-sm font-medium shadow-sm hover:shadow-md w-full md:w-auto justify-center"
                  >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Add Row
                  </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-300 border-collapse" style={{ minWidth: '1000px' }}>
                          <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        {fields.map((field) => (
                                <th 
                                  key={field} 
                                  className="px-3 py-3 text-left text-sm font-medium text-gray-700 border border-gray-300 whitespace-nowrap bg-gray-50 min-w-[100px]"
                                >
                                  <div className="flex flex-col min-w-[80px]">
                                    <span className="font-semibold">{getFieldLabel(field, measurementType)}</span>
                                    <span className="text-[10px] sm:text-xs text-gray-500 font-normal mt-0.5 leading-tight">
                                {getFieldPlaceholder(field, measurementType)}
                              </span>
                            </div>
                          </th>
                        ))}
                              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 border border-gray-300 whitespace-nowrap bg-gray-50 sticky right-0 z-20 min-w-[100px]">
                                Actions
                              </th>
                      </tr>
                    </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {fields.map((field) => (
                            <td key={field} className="px-2 py-2 border border-gray-300 min-w-[100px]">
                              {field === 'sr_no' ? (
                                <div className="flex items-center justify-center">
                                  <span
                                    className="inline-flex items-center justify-center min-w-[4rem] sm:min-w-[5rem] px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold border border-blue-200"
                                    title="User-specific serial number (e.g., A00001)"
                                  >
                                    {item.sr_no || '-'}
                                  </span>
                                </div>
                              ) : (field === 'location_of_fitting' && (measurementType === 'frame_sample' || measurementType === 'regular_frame')) || 
                                  (field === 'location' && (measurementType === 'shutter_sample' || measurementType === 'regular_shutter')) ? (
                                <div className="flex items-center">
                                  <span
                                    className="w-full px-1 sm:px-2 py-1 text-xs sm:text-sm bg-gray-50 text-gray-700 rounded border border-gray-200 truncate block"
                                    title="Auto-generated from BLDG/Wings, Flat No, and Area"
                                  >
                                    {item[field] || '-'}
                                  </span>
                                </div>
                              ) : field === 'area' ? (
                                // Check if current area value is 'custom' or not in predefined options
                                item[field] === 'custom' || (item[field] && !AREA_OPTIONS.includes(item[field])) ? (
                                  <input
                                    type="text"
                                    data-row-index={index}
                                    data-field={field}
                                    className="w-full px-1 sm:px-2 py-1 text-xs sm:text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[80px]"
                                    value={item[field] === 'custom' ? (item.custom_area || '') : (item[field] || '')}
                                    onChange={(e) => {
                                      const newItems = [...items];
                                      const customValue = e.target.value;
                                      
                                      if (customValue.trim()) {
                                        // Store the custom value in area field
                                        newItems[index].area = customValue;
                                        newItems[index].custom_area = customValue;
                                      } else {
                                        // If cleared, reset to empty
                                        newItems[index].area = '';
                                        delete newItems[index].custom_area;
                                      }
                                      
                                      // Auto-generate location fields if needed
                                      const bldg = newItems[index].bldg || '';
                                      const flatNo = newItems[index].flat_no || '';
                                      const area = newItems[index].area || '';
                                      const generatedLocation = bldg && flatNo && area ? `${bldg}_${flatNo}_${area}` : '';
                                      
                                      if (measurementType === 'frame_sample' || measurementType === 'regular_frame') {
                                        newItems[index].location_of_fitting = generatedLocation;
                                      } else if (measurementType === 'shutter_sample' || measurementType === 'regular_shutter') {
                                        newItems[index].location = generatedLocation;
                                          
                                          // Auto-calculate minus_width and minus_height when area is selected
                                          if (area && areaMinusValues[area]) {
                                            const width = newItems[index].width || '';
                                            const height = newItems[index].height || '';
                                            
                                            if (width && areaMinusValues[area].width) {
                                              const widthNum = parseFloat(width);
                                              const minusWidthNum = parseFloat(areaMinusValues[area].width);
                                              if (!isNaN(widthNum) && !isNaN(minusWidthNum)) {
                                                const minusWidth = (widthNum - minusWidthNum).toString();
                                                newItems[index].minus_width = minusWidth;
                                                // Calculate act_width from minus_width (convert mm to inches)
                                                const minusWidthValue = parseFloat(minusWidth);
                                                if (!isNaN(minusWidthValue)) {
                                                  const actWidth = (minusWidthValue / 25.4).toFixed(2);
                                                  newItems[index].act_width = actWidth;
                                                  // Calculate ro_width from act_width using round-up rule
                                                  const actWidthNum = parseFloat(actWidth);
                                                  if (!isNaN(actWidthNum) && actWidthNum > 0) {
                                                    newItems[index].ro_width = roundUpForRO(actWidthNum).toString();
                                                  }
                                                }
                                              }
                                            }
                                            if (height && areaMinusValues[area].height) {
                                              const heightNum = parseFloat(height);
                                              const minusHeightNum = parseFloat(areaMinusValues[area].height);
                                              if (!isNaN(heightNum) && !isNaN(minusHeightNum)) {
                                                const minusHeight = (heightNum - minusHeightNum).toString();
                                                newItems[index].minus_height = minusHeight;
                                                // Calculate act_height from minus_height (convert mm to inches)
                                                const minusHeightValue = parseFloat(minusHeight);
                                                if (!isNaN(minusHeightValue)) {
                                                  const actHeight = (minusHeightValue / 25.4).toFixed(2);
                                                  newItems[index].act_height = actHeight;
                                                  // Calculate ro_height from act_height using round-up rule
                                                  const actHeightNum = parseFloat(actHeight);
                                                  if (!isNaN(actHeightNum) && actHeightNum > 0) {
                                                    newItems[index].ro_height = roundUpForRO(actHeightNum).toString();
                                                  }
                                                }
                                              }
                                            }
                                          }
                                      }
                                      
                                      setItems(newItems);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        focusNextField(index, field);
                                      }
                                    }}
                                    onBlur={(e) => {
                                      // If custom input is cleared, reset to dropdown
                                      if (!e.target.value.trim()) {
                                        const newItems = [...items];
                                        newItems[index].area = '';
                                        delete newItems[index].custom_area;
                                        setItems(newItems);
                                      }
                                    }}
                                    placeholder="Enter custom area"
                                    title="Enter custom area value"
                                    autoFocus
                                  />
                                ) : (
                                  <select
                                    data-row-index={index}
                                    data-field={field}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[90px]"
                                    value={item[field] || ''}
                                    onChange={(e) => {
                                      const newItems = [...items];
                                      if (e.target.value === 'custom') {
                                        // When custom is selected, set area to 'custom' to trigger text input
                                        newItems[index].area = 'custom';
                                        newItems[index].custom_area = '';
                                      } else {
                                        // Clear custom_area if a predefined option is selected
                                        newItems[index].area = e.target.value;
                                        delete newItems[index].custom_area;
                                        
                                        // Auto-generate location fields if needed
                                        const bldg = newItems[index].bldg || '';
                                        const flatNo = newItems[index].flat_no || '';
                                        const area = e.target.value || '';
                                        const generatedLocation = bldg && flatNo && area ? `${bldg}_${flatNo}_${area}` : '';
                                        
                                        if (measurementType === 'frame_sample' || measurementType === 'regular_frame') {
                                          newItems[index].location_of_fitting = generatedLocation;
                                        } else if (measurementType === 'shutter_sample' || measurementType === 'regular_shutter') {
                                          newItems[index].location = generatedLocation;
                                          
                                          // Auto-calculate minus_width and minus_height when area is selected
                                          if (area && areaMinusValues[area]) {
                                            const width = newItems[index].width || '';
                                            const height = newItems[index].height || '';
                                            
                                            if (width && areaMinusValues[area].width) {
                                              const widthNum = parseFloat(width);
                                              const minusWidthNum = parseFloat(areaMinusValues[area].width);
                                              if (!isNaN(widthNum) && !isNaN(minusWidthNum)) {
                                                const minusWidth = (widthNum - minusWidthNum).toString();
                                                newItems[index].minus_width = minusWidth;
                                                // Calculate act_width from minus_width (convert mm to inches)
                                                const minusWidthValue = parseFloat(minusWidth);
                                                if (!isNaN(minusWidthValue)) {
                                                  const actWidth = (minusWidthValue / 25.4).toFixed(2);
                                                  newItems[index].act_width = actWidth;
                                                  // Calculate ro_width from act_width using round-up rule
                                                  const actWidthNum = parseFloat(actWidth);
                                                  if (!isNaN(actWidthNum) && actWidthNum > 0) {
                                                    newItems[index].ro_width = roundUpForRO(actWidthNum).toString();
                                                  }
                                                }
                                              }
                                            }
                                            if (height && areaMinusValues[area].height) {
                                              const heightNum = parseFloat(height);
                                              const minusHeightNum = parseFloat(areaMinusValues[area].height);
                                              if (!isNaN(heightNum) && !isNaN(minusHeightNum)) {
                                                const minusHeight = (heightNum - minusHeightNum).toString();
                                                newItems[index].minus_height = minusHeight;
                                                // Calculate act_height from minus_height (convert mm to inches)
                                                const minusHeightValue = parseFloat(minusHeight);
                                                if (!isNaN(minusHeightValue)) {
                                                  const actHeight = (minusHeightValue / 25.4).toFixed(2);
                                                  newItems[index].act_height = actHeight;
                                                  // Calculate ro_height from act_height using round-up rule
                                                  const actHeightNum = parseFloat(actHeight);
                                                  if (!isNaN(actHeightNum) && actHeightNum > 0) {
                                                    newItems[index].ro_height = roundUpForRO(actHeightNum).toString();
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                        
                                        // Auto-focus next field after selection
                                        if (e.target.value) {
                                          focusNextField(index, field);
                                        }
                                      }
                                      setItems(newItems);
                                    }}
                                    title="Select area code"
                                  >
                                    <option value="">Select Area</option>
                                    {AREA_OPTIONS.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                )
                              ) : (field === 'act_width' || field === 'act_height') && (measurementType === 'shutter_sample' || measurementType === 'regular_shutter') ? (
                                <input
                                  type="text"
                                  data-row-index={index}
                                  data-field={field}
                                  readOnly
                                  className="w-full px-3 py-2 text-sm border border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed min-w-[90px] rounded"
                                  value={item[field] || ''}
                                  placeholder={getFieldPlaceholder(field, measurementType)}
                                  title={`${getFieldPlaceholder(field, measurementType)} (Auto-calculated from ${field === 'act_width' ? 'Act Width(mm)' : 'Act Height (mm)'})`}
                                />
                              ) : (field === 'ro_width' || field === 'ro_height' || field === 'act_sq_ft') && (measurementType === 'shutter_sample' || measurementType === 'regular_shutter') ? (
                                <input
                                  type="text"
                                  data-row-index={index}
                                  data-field={field}
                                  readOnly
                                  className="w-full px-3 py-2 text-sm border border-gray-300 bg-gray-50 text-gray-700 cursor-not-allowed min-w-[90px] rounded"
                                  value={item[field] || ''}
                                  placeholder={getFieldPlaceholder(field, measurementType)}
                                  title={field === 'act_sq_ft' 
                                    ? `${getFieldPlaceholder(field, measurementType)} (Auto-calculated from Act Width(mm) and Act Height (mm))`
                                    : `${getFieldPlaceholder(field, measurementType)} (Auto-calculated from ${field === 'ro_width' ? 'Act Width' : 'Act Height'} using round-up rule)`}
                                />
                              ) : (
                                <input
                                  type="text"
                                  data-row-index={index}
                                  data-field={field}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[90px]"
                                  value={item[field] || ''}
                                  onChange={(e) => handleItemFieldChange(index, field, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      focusNextField(index, field);
                                    }
                                  }}
                                  placeholder={getFieldPlaceholder(field, measurementType)}
                                  title={getFieldPlaceholder(field, measurementType)}
                                />
                              )
                            }
                            </td>
                          ))}
                          <td className="px-1 sm:px-2 py-1 border border-gray-300 sticky right-0 bg-white z-10">
                            <button
                              type="button"
                              onClick={() => handleRemoveClick(index)}
                              disabled={items.length === 1}
                              className="px-2 py-1 text-xs sm:text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
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
                  </div>
                  {/* Add Row Button at Bottom */}
                  <div className="mt-2 sm:mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium shadow-sm hover:shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Add Row
                    </button>
                  </div>
                  {/* Scroll indicator hint for mobile */}
                  <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-500 text-center md:hidden">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                      Scroll horizontally to see all columns
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes (e.g., actual measurement in inches, as per exa after minus for play)"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Attachments (Image, PDF, Excel, Audio File)
                </label>
                <div className="mt-1 space-y-2 sm:space-y-3">
                  <label className="flex items-center justify-center w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                      <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-500 text-center px-2">
                        Images, PDF, Excel, Audio files (Max 10MB per file)
                      </span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.xls,.xlsx,.xlsm,audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  
                  {/* Record Audio Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-xs sm:text-sm font-medium"
                      >
                        <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Record Audio</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium"
                      >
                        <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="whitespace-nowrap">Stop Recording ({formatTime(recordingTime)})</span>
                      </button>
                    )}
                    {isRecording && (
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-red-600">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-600 rounded-full animate-pulse"></div>
                        <span className="text-xs sm:text-sm font-medium">Recording...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 sm:mt-4 space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-700">
                      Uploaded Files ({uploadedFiles.length})
                    </p>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              {getFileIcon(file)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleViewFile(file)}
                              className="p-1 sm:p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              title="View file"
                            >
                              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="p-1 sm:p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isLoading ? 'Creating...' : 'Create Measurement'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (hasUnsavedChanges()) {
                      setShowConfirmDialog(true);
                      setPendingNavigation(() => () => navigate('/measurements'));
                    } else {
                      navigate('/measurements');
                    }
                  }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
