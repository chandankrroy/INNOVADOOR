import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { ArrowLeft, FileText, Building2, MapPin, Phone, Mail, User, Hash, Eye, Edit, Save, X, History, ClipboardList, FileText as FileTextIcon, Plus, AlertCircle, Trash2, Ruler, Upload, File, Download } from 'lucide-react';

type Party = {
  id: number;
  party_type: string;
  name: string;
  display_name: string | null;
  customer_code: string | null;
  business_type: string | null;
  contact_persons: any[] | null;
  office_address: any;
  office_city: string | null;
  office_state: string | null;
  gstin_number: string | null;
  pan_number: string | null;
  customer_category: string | null;
  customer_status: string | null;
  approval_status: string | null;
  assigned_sales_executive: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_by_username: string | null;
  created_at: string;
  [key: string]: any;
};

// Helper function to parse frame requirements from party data
function parseFrameRequirements(party: Party): Array<{
  site_name: string;
  site_location: string;
  total_quantity: string;
  product_area: string;
  concept: string;
  frame_design: string;
  wall_type: string;
  laminate: string;
  rebate: string;
  sub_frame: string;
  construction: string;
  cover_moulding: string;
  remark: string;
}> {
  console.log('Party frame_requirements raw:', party.frame_requirements);
  if (party.frame_requirements) {
    try {
      let frameReq: any;
      if (typeof party.frame_requirements === 'string') {
        frameReq = JSON.parse(party.frame_requirements);
      } else {
        frameReq = party.frame_requirements;
      }
      console.log('Frame requirements parsed:', frameReq, 'Type:', Array.isArray(frameReq) ? 'Array' : typeof frameReq);

      if (Array.isArray(frameReq) && frameReq.length > 0) {
        // Map array of requirements
        const mapped = frameReq.map((req: any) => ({
          site_name: req.site_name || '',
          site_location: req.site_location || '',
          total_quantity: req.total_quantity || '',
          product_area: req.product_area || '',
          concept: req.concept || '',
          frame_design: req.frame_design || '',
          wall_type: req.wall_type || req.wall || '',
          laminate: req.laminate || '',
          rebate: req.rebate || '',
          sub_frame: req.sub_frame || '',
          construction: req.construction || '',
          cover_moulding: req.cover_moulding || '',
          remark: req.remark || '',
        }));
        console.log('Frame requirements mapped:', mapped);
        return mapped;
      } else if (frameReq && typeof frameReq === 'object' && !Array.isArray(frameReq)) {
        // Single object (non-array)
        const mapped = [{
          site_name: frameReq.site_name || '',
          site_location: frameReq.site_location || '',
          total_quantity: frameReq.total_quantity || '',
          product_area: frameReq.product_area || '',
          concept: frameReq.concept || '',
          frame_design: frameReq.frame_design || '',
          wall_type: frameReq.wall_type || frameReq.wall || '',
          laminate: frameReq.laminate || '',
          rebate: frameReq.rebate || '',
          sub_frame: frameReq.sub_frame || '',
          construction: frameReq.construction || '',
          cover_moulding: frameReq.cover_moulding || '',
          remark: frameReq.remark || '',
        }];
        console.log('Frame requirements mapped (single object):', mapped);
        return mapped;
      } else {
        // Empty array or invalid data
        console.log('Frame requirements empty or invalid, setting empty array');
        return [];
      }
    } catch (e) {
      console.error('Error parsing frame requirements:', e, party.frame_requirements);
      return [];
    }
  } else {
    console.log('No frame requirements in party data');
    return [];
  }
}

// Helper function to parse door requirements from party data
function parseDoorRequirements(party: Party): Array<{
  site_name: string;
  site_location: string;
  total_quantity: string;
  product_area: string;
  concept: string;
  thickness: string;
  frontside_design: string;
  backside_design: string;
  frontside_laminate: string;
  backside_laminate: string;
  gel_colour: string;
  grade: string;
  side_frame: string;
  filler: string;
  foam_bottom: string;
  frp_coating: string;
  core: string;
}> {
  console.log('Party door_requirements raw:', party.door_requirements);
  if (party.door_requirements) {
    try {
      let doorReq: any;
      if (typeof party.door_requirements === 'string') {
        doorReq = JSON.parse(party.door_requirements);
      } else {
        doorReq = party.door_requirements;
      }
      console.log('Door requirements parsed:', doorReq, 'Type:', Array.isArray(doorReq) ? 'Array' : typeof doorReq);

      if (Array.isArray(doorReq) && doorReq.length > 0) {
        // Map array of requirements
        const mapped = doorReq.map((req: any) => ({
          site_name: req.site_name || '',
          site_location: req.site_location || req.site_name_2 || '',
          total_quantity: req.total_quantity || '',
          product_area: req.product_area || req.area || '',
          concept: req.concept || '',
          thickness: req.thickness || '',
          // Handle both new format (frontside/backside) and old format (single design/laminate)
          frontside_design: req.frontside_design || req.design || '',
          backside_design: req.backside_design || (req.design ? 'same as front' : '') || '',
          frontside_laminate: req.frontside_laminate || req.laminate || '',
          backside_laminate: req.backside_laminate || (req.laminate ? 'same as front' : '') || '',
          gel_colour: req.gel_colour || req.gel_color || '',
          grade: req.grade || '',
          side_frame: req.side_frame || req.sub_frame || '',
          filler: req.filler || '',
          foam_bottom: req.foam_bottom || '',
          frp_coating: req.frp_coating || '',
          core: req.core || 'D/C',
        }));
        console.log('Door requirements mapped:', mapped);
        return mapped;
      } else if (doorReq && typeof doorReq === 'object' && !Array.isArray(doorReq)) {
        // Single object (non-array)
        const mapped = [{
          site_name: doorReq.site_name || '',
          site_location: doorReq.site_location || doorReq.site_name_2 || '',
          total_quantity: doorReq.total_quantity || '',
          product_area: doorReq.product_area || doorReq.area || '',
          concept: doorReq.concept || '',
          thickness: doorReq.thickness || '',
          // Handle both new format (frontside/backside) and old format (single design/laminate)
          frontside_design: doorReq.frontside_design || doorReq.design || '',
          backside_design: doorReq.backside_design || (doorReq.design ? 'same as front' : '') || '',
          frontside_laminate: doorReq.frontside_laminate || doorReq.laminate || '',
          backside_laminate: doorReq.backside_laminate || (doorReq.laminate ? 'same as front' : '') || '',
          gel_colour: doorReq.gel_colour || doorReq.gel_color || '',
          grade: doorReq.grade || '',
          side_frame: doorReq.side_frame || doorReq.sub_frame || '',
          filler: doorReq.filler || '',
          foam_bottom: doorReq.foam_bottom || '',
          frp_coating: doorReq.frp_coating || '',
          core: doorReq.core || 'D/C',
        }];
        console.log('Door requirements mapped (single object):', mapped);
        return mapped;
      } else {
        // Empty array or invalid data
        console.log('Door requirements empty or invalid, setting empty array');
        return [];
      }
    } catch (e) {
      console.error('Error parsing door requirements:', e, party.door_requirements);
      return [];
    }
  } else {
    console.log('No door requirements in party data');
    return [];
  }
}


export default function ViewParty() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isCollapsed, isHovered } = useSidebar();
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [isEditingOrderDetails, setIsEditingOrderDetails] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    payment_terms: '',
    credit_limit: '',
    credit_days: '',
    security_cheque_pdc: false,
    preferred_delivery_location: '',
    unloading_responsibility: '',
    working_hours_at_site: '',
    special_instructions: '',
    change_reason: ''
  });
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [clientRequirementsHistory, setClientRequirementsHistory] = useState<any[]>([]);
  const [loadingClientRequirementsHistory, setLoadingClientRequirementsHistory] = useState(false);
  const [showClientRequirementsHistory, setShowClientRequirementsHistory] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [productionPapers, setProductionPapers] = useState<any[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [showProductionPapers, setShowProductionPapers] = useState(false);
  const [showAllMeasurements, setShowAllMeasurements] = useState(false);
  const [measurementsWithPapers, setMeasurementsWithPapers] = useState<any[]>([]);

  // Filter state for All Measurements modal
  const [filterMeasurementType, setFilterMeasurementType] = useState<'all' | 'frame' | 'shutter'>('all');
  const [filterBldg, setFilterBldg] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterFlatNo, setFilterFlatNo] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterMeasurementNumber, setFilterMeasurementNumber] = useState<string>('');
  const [filterSrNo, setFilterSrNo] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [isEditingClientRequirements, setIsEditingClientRequirements] = useState(false);
  const [clientSpecialInstructions, setClientSpecialInstructions] = useState('');
  const [isEditingPurchaseOrderStatus, setIsEditingPurchaseOrderStatus] = useState(false);
  const [purchaseOrderStatus, setPurchaseOrderStatus] = useState('');
  const [poStatusHistory, setPoStatusHistory] = useState<any[]>([]);
  const [showPoStatusHistory, setShowPoStatusHistory] = useState(false);
  const [poDocument, setPoDocument] = useState<File | null>(null);
  const [poDocumentPreview, setPoDocumentPreview] = useState<string | null>(null);
  const [partyDocuments, setPartyDocuments] = useState<any[]>([]);



  // Products for dynamic CONCEPT dropdowns
  const [frameProducts, setFrameProducts] = useState<Array<{ id: number; product_type: string }>>([]);
  const [shutterProducts, setShutterProducts] = useState<Array<{ id: number; product_type: string }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Designs for dynamic DESIGN dropdown
  const [designs, setDesigns] = useState<Array<{ id: number; design_name: string; design_code: string; product_category: string }>>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);

  // State for searchable design dropdowns
  const [designSearchTerms, setDesignSearchTerms] = useState<{ [key: string]: string }>({});
  const [openDesignDropdowns, setOpenDesignDropdowns] = useState<{ [key: string]: boolean }>({});

  // State for searchable laminate dropdowns
  const [laminateSearchTerms, setLaminateSearchTerms] = useState<{ [key: string]: string }>({});
  const [openLaminateDropdowns, setOpenLaminateDropdowns] = useState<{ [key: string]: boolean }>({});
  const [laminateSuggestions, setLaminateSuggestions] = useState<string[]>([]);

  // Custom Area Options
  const [customAreaOptions, setCustomAreaOptions] = useState<string[]>([]);

  // State to track if custom input should be shown for each row
  const [showCustomInputFrame, setShowCustomInputFrame] = useState<{ [key: number]: boolean }>({});
  const [showCustomInputShutter, setShowCustomInputShutter] = useState<{ [key: number]: boolean }>({});

  // Temporary custom value being entered
  const [tempCustomValueFrame, setTempCustomValueFrame] = useState<{ [key: number]: string }>({});
  const [tempCustomValueShutter, setTempCustomValueShutter] = useState<{ [key: number]: string }>({});

  // Custom CORE state
  const [showCustomInputCoreShutter, setShowCustomInputCoreShutter] = useState<{ [key: number]: boolean }>({});
  const [tempCustomValueCoreShutter, setTempCustomValueCoreShutter] = useState<{ [key: number]: string }>({});

  // Predefined area options
  const predefinedAreaOptions = ['MD', 'CB', 'MB', 'CHB', 'CT', 'MT', 'CHT', 'TR', 'KG', 'DRB', 'WC-Bath', 'Top-Ter', 'STR', 'Safety-MD'];

  // Add custom area to the list
  const addCustomArea = (area: string) => {
    if (area && !customAreaOptions.includes(area)) {
      setCustomAreaOptions(prev => [...prev, area]);
    }
  };

  // Handle product area selection change
  const handleProductAreaSelect = (
    value: string,
    index: number,
    isFrame: boolean,
    updateFunction: (value: string) => void
  ) => {
    if (value === 'custom') {
      // Show custom input
      if (isFrame) {
        setShowCustomInputFrame(prev => ({ ...prev, [index]: true }));
        setTempCustomValueFrame(prev => ({ ...prev, [index]: '' }));
      } else {
        setShowCustomInputShutter(prev => ({ ...prev, [index]: true }));
        setTempCustomValueShutter(prev => ({ ...prev, [index]: '' }));
      }
      // Clear the product_area value
      updateFunction('');
    } else {
      // Hide custom input if it was shown
      if (isFrame) {
        setShowCustomInputFrame(prev => ({ ...prev, [index]: false }));
        setTempCustomValueFrame(prev => {
          const newState = { ...prev };
          delete newState[index];
          return newState;
        });
      } else {
        setShowCustomInputShutter(prev => ({ ...prev, [index]: false }));
        setTempCustomValueShutter(prev => {
          const newState = { ...prev };
          delete newState[index];
          return newState;
        });
      }
      // Set the selected value
      updateFunction(value);
    }
  };

  // Handle custom value submission
  const handleCustomValueSubmit = (
    index: number,
    isFrame: boolean,
    updateFunction: (value: string) => void
  ) => {
    const customValue = isFrame
      ? tempCustomValueFrame[index]?.trim()
      : tempCustomValueShutter[index]?.trim();

    if (customValue) {
      // Add to custom options if not already exists
      addCustomArea(customValue);
      // Set the value
      updateFunction(customValue);
      // Hide custom input
      if (isFrame) {
        setShowCustomInputFrame(prev => ({ ...prev, [index]: false }));
        setTempCustomValueFrame(prev => {
          const newState = { ...prev };
          delete newState[index];
          return newState;
        });
      } else {
        setShowCustomInputShutter(prev => ({ ...prev, [index]: false }));
        setTempCustomValueShutter(prev => {
          const newState = { ...prev };
          delete newState[index];
          return newState;
        });
      }
    }
  };

  // Handle custom value cancellation
  const handleCustomValueCancel = (index: number, isFrame: boolean) => {
    if (isFrame) {
      setShowCustomInputFrame(prev => ({ ...prev, [index]: false }));
      setTempCustomValueFrame(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    } else {
      setShowCustomInputShutter(prev => ({ ...prev, [index]: false }));
      setTempCustomValueShutter(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }
  };

  // Handle CORE selection change
  const handleCoreSelect = (value: string, index: number) => {
    if (value === 'custom') {
      setShowCustomInputCoreShutter(prev => ({ ...prev, [index]: true }));
      setTempCustomValueCoreShutter(prev => ({ ...prev, [index]: '' }));
      updateDoorRequirement(index, 'core', '');
    } else {
      setShowCustomInputCoreShutter(prev => ({ ...prev, [index]: false }));
      updateDoorRequirement(index, 'core', value);
    }
  };

  // Handle custom CORE submission
  const handleCoreSubmit = (index: number) => {
    const customValue = tempCustomValueCoreShutter[index]?.trim();
    if (customValue) {
      updateDoorRequirement(index, 'core', customValue);
      setShowCustomInputCoreShutter(prev => ({ ...prev, [index]: false }));
    }
  };

  // Handle custom CORE cancel
  const handleCoreCancel = (index: number) => {
    setShowCustomInputCoreShutter(prev => ({ ...prev, [index]: false }));
    updateDoorRequirement(index, 'core', 'D/C'); // Revert to default
  };

  const [frameRequirements, setFrameRequirements] = useState<Array<{
    site_name: string;
    site_location: string;
    total_quantity: string;
    product_area: string;
    concept: string;
    frame_design: string;
    wall_type: string;
    laminate: string;
    rebate: string;
    sub_frame: string;
    construction: string;
    cover_moulding: string;
    remark: string;
  }>>([{
    site_name: '',
    site_location: '',
    total_quantity: '',
    product_area: '',
    concept: '',
    frame_design: '',
    wall_type: '',
    laminate: '',
    rebate: '',
    sub_frame: '',
    construction: '',
    cover_moulding: '',
    remark: '',
  }]);
  const [doorRequirements, setDoorRequirements] = useState<Array<{
    site_name: string;
    site_location: string;
    total_quantity: string;
    product_area: string;
    concept: string;
    thickness: string;
    frontside_design: string;
    backside_design: string;
    frontside_laminate: string;
    backside_laminate: string;
    gel_colour: string;
    grade: string;
    side_frame: string;
    filler: string;
    foam_bottom: string;
    frp_coating: string;
    core: string;
  }>>([{
    site_name: '',
    site_location: '',
    total_quantity: '',
    product_area: '',
    concept: '',
    thickness: '',
    frontside_design: '',
    backside_design: '',
    frontside_laminate: '',
    backside_laminate: '',
    gel_colour: '',
    grade: '',
    side_frame: '',
    filler: '',
    foam_bottom: '',
    frp_coating: '',
    core: 'D/C',
  }]);

  // Function to load products for CONCEPT dropdowns
  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      // Fetch Frame products
      const frameData = await api.get('/production/products?category=Frame', true);
      setFrameProducts(frameData.map((p: any) => ({ id: p.id, product_type: p.product_type })));

      // Fetch Shutter products
      const shutterData = await api.get('/production/products?category=Shutter', true);
      setShutterProducts(shutterData.map((p: any) => ({ id: p.id, product_type: p.product_type })));
    } catch (err: any) {
      console.error('Failed to load products:', err);
      // Set empty arrays on error to prevent crashes
      setFrameProducts([]);
      setShutterProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Function to load designs for DESIGN dropdown
  const loadDesigns = async () => {
    try {
      setLoadingDesigns(true);
      const designsData = await api.get('/production/designs?is_active=true', true);
      setDesigns(designsData.map((d: any) => ({
        id: d.id,
        design_name: d.design_name,
        design_code: d.design_code,
        product_category: d.product_category
      })));
    } catch (err: any) {
      console.error('Failed to load designs:', err);
      setDesigns([]);
    } finally {
      setLoadingDesigns(false);
    }
  };

  // Helper function to filter designs based on search term
  const getFilteredDesigns = (searchTerm: string, category?: string, includeSameAsFront: boolean = false) => {
    const term = searchTerm.toLowerCase();
    const filtered = designs.filter(design => {
      const matchesSearch = design.design_name.toLowerCase().includes(term) ||
        design.design_code.toLowerCase().includes(term);

      if (!category) return matchesSearch;

      return matchesSearch && design.product_category.toLowerCase() === category.toLowerCase();
    });

    if (includeSameAsFront && 'same as front'.includes(term)) {
      return [{ id: -1, design_name: 'same as front', design_code: '', product_category: 'Shutter' }, ...filtered];
    }

    return filtered;
  };

  // Helper function to get dropdown key for designs
  const getDropdownKey = (index: number, type: string, category?: string) => {
    return `design-${category || 'shutter'}-${index}-${type}`;
  };

  // Helper function to get laminate dropdown key
  const getLaminateDropdownKey = (index: number, type: 'frontside' | 'backside') => {
    return `laminate-shutter-${index}-${type}`;
  };

  // Helper function to filter laminate suggestions
  const getFilteredLaminates = (searchTerm: string, includeSameAsFront: boolean = false) => {
    if (!searchTerm) {
      const suggestions = laminateSuggestions.slice(0, 10);
      if (includeSameAsFront) {
        return ['same as front', ...suggestions, 'custom'];
      }
      return [...suggestions, 'custom'];
    }

    const term = searchTerm.toLowerCase();
    const filtered = laminateSuggestions.filter(laminate =>
      laminate.toLowerCase().includes(term)
    );

    if (includeSameAsFront && 'same as front'.includes(term)) {
      return ['same as front', ...filtered, 'custom'];
    }

    return [...filtered, 'custom'];
  };

  // Update laminate suggestions from doorRequirements
  useEffect(() => {
    const allLaminates = new Set<string>();

    // Collect laminates from door requirements only (not frame requirements)
    doorRequirements.forEach(req => {
      if (req.frontside_laminate && req.frontside_laminate.trim() && req.frontside_laminate !== 'custom' && req.frontside_laminate !== 'same as front') {
        allLaminates.add(req.frontside_laminate.trim());
      }
      if (req.backside_laminate && req.backside_laminate.trim() && req.backside_laminate !== 'custom' && req.backside_laminate !== 'same as front') {
        allLaminates.add(req.backside_laminate.trim());
      }
    });

    setLaminateSuggestions(Array.from(allLaminates).sort());
  }, [doorRequirements]);

  useEffect(() => {
    if (id) {
      loadParty();
    }
    loadProducts();
    loadDesigns();
  }, [id]);

  useEffect(() => {
    if (party?.id) {
      if (showHistory) {
        loadHistory();
      }
      // Initialize order details from party data
      setOrderDetails({
        payment_terms: party.payment_terms || '',
        credit_limit: party.credit_limit || '',
        credit_days: party.credit_days?.toString() || '',
        security_cheque_pdc: party.security_cheque_pdc || false,
        preferred_delivery_location: party.preferred_delivery_location || '',
        unloading_responsibility: party.unloading_responsibility || '',
        working_hours_at_site: party.working_hours_at_site || '',
        special_instructions: party.special_instructions || '',
        change_reason: ''
      });

      // Initialize special instructions for client requirements section
      setClientSpecialInstructions(party.special_instructions || '');

      // Initialize Purchase Order Status
      setPurchaseOrderStatus(party.customer_status || '');

      // Initialize documents
      if (party.documents) {
        try {
          const parsed = typeof party.documents === 'string' ? JSON.parse(party.documents) : party.documents;
          setPartyDocuments(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.error('Error parsing documents:', e);
          setPartyDocuments([]);
        }
      } else {
        setPartyDocuments([]);
      }

      // Initialize frame and door requirements from party data using helper functions
      setFrameRequirements(parseFrameRequirements(party));
      setDoorRequirements(parseDoorRequirements(party));
    }
  }, [party?.id, party?.frame_requirements, party?.door_requirements]);



  // Load measurements when party is loaded
  useEffect(() => {
    if (party?.id) {
      loadMeasurements();
      loadProductionPapers();
    }
  }, [party?.id]);

  // Process measurements with papers when both are available
  useEffect(() => {
    if (measurements.length === 0) {
      setMeasurementsWithPapers([]);
      return;
    }

    // Create a map of measurement_id to production papers
    const paperMap = new Map<number, any[]>();
    productionPapers.forEach((paper: any) => {
      if (paper.measurement_id) {
        if (!paperMap.has(paper.measurement_id)) {
          paperMap.set(paper.measurement_id, []);
        }
        paperMap.get(paper.measurement_id)!.push(paper);
      }
    });

    // Process each measurement and link production papers
    const processed = measurements.map((measurement: any) => {
      const linkedPapers = paperMap.get(measurement.id) || [];
      return {
        ...measurement,
        productionPapers: linkedPapers
      };
    });

    // Sort by measurement date (newest first) or measurement number
    processed.sort((a: any, b: any) => {
      if (a.measurement_date && b.measurement_date) {
        return new Date(b.measurement_date).getTime() - new Date(a.measurement_date).getTime();
      }
      return (b.measurement_number || '').localeCompare(a.measurement_number || '');
    });

    setMeasurementsWithPapers(processed);
  }, [measurements, productionPapers]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('Frame requirements state:', frameRequirements);
    console.log('Door requirements state:', doorRequirements);
  }, [frameRequirements, doorRequirements]);

  // Ensure at least one row exists when editing
  useEffect(() => {
    if (isEditingClientRequirements) {
      if (frameRequirements.length === 0) {
        setFrameRequirements([{
          site_name: '',
          site_location: '',
          total_quantity: '',
          product_area: '',
          concept: '',
          frame_design: '',
          wall_type: '',
          laminate: '',
          rebate: '',
          sub_frame: '',
          construction: '',
          cover_moulding: '',
          remark: '',
        }]);
      }
      if (doorRequirements.length === 0) {
        setDoorRequirements([{
          site_name: '',
          site_location: '',
          total_quantity: '',
          product_area: '',
          concept: '',
          thickness: '',
          frontside_design: '',
          backside_design: '',
          frontside_laminate: '',
          backside_laminate: '',
          gel_colour: '',
          grade: '',
          side_frame: '',
          filler: '',
          foam_bottom: '',
          frp_coating: '',
          core: 'D/C',
        }]);
      }
    }
  }, [isEditingClientRequirements]);

  const loadProductionPapers = async () => {
    if (!party?.id) return;
    try {
      setLoadingPapers(true);
      const allPapers = await api.get('/production/production-papers', true);
      // Filter papers by party_id or party_name
      const partyPapers = (allPapers || []).filter(
        (p: any) => p.party_id === party.id || p.party_name === party.name
      );
      setProductionPapers(partyPapers);
    } catch (err: any) {
      console.error('Failed to load production papers:', err);
    } finally {
      setLoadingPapers(false);
    }
  };

  const handleShowProductionPapers = () => {
    setShowProductionPapers(true);
    if (productionPapers.length === 0) {
      loadProductionPapers();
    }
  };

  const handleShowSummary = () => {
    setShowSummary(true);
    if (productionPapers.length === 0) {
      loadProductionPapers();
    }
  };

  const handleShowAllMeasurements = async () => {
    setShowAllMeasurements(true);
    if (measurements.length === 0 && party?.id) {
      await loadMeasurements();
    }
    // Also load production papers to link with measurements
    if (productionPapers.length === 0 && party?.id) {
      await loadProductionPapers();
    }
    // Process and link measurements with production papers
    if (measurements.length > 0) {
      processMeasurementsWithPapers();
    }
  };

  const loadParty = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get(`/production/parties/${id}`, true);
      setParty(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load party');
    } finally {
      setLoading(false);
    }
  };

  const loadMeasurements = async () => {
    if (!party?.id) {
      setMeasurements([]);
      return;
    }
    try {
      setLoadingMeasurements(true);
      // Fetch measurements with a high limit to get all measurements
      const allMeasurements = await api.get('/production/measurements?limit=10000', true);
      // Filter measurements by party_id, ensuring type consistency
      const partyMeasurements = (allMeasurements || []).filter(
        (m: any) => m.party_id !== null && m.party_id !== undefined && Number(m.party_id) === Number(party.id)
      );
      setMeasurements(partyMeasurements);
    } catch (err: any) {
      console.error('Failed to load measurements:', err);
      setMeasurements([]);
    } finally {
      setLoadingMeasurements(false);
    }
  };

  // Helper function to process measurements and link with production papers
  const processMeasurementsWithPapers = () => {
    // Create a map of measurement_id to production papers
    const paperMap = new Map<number, any[]>();
    productionPapers.forEach((paper: any) => {
      if (paper.measurement_id) {
        if (!paperMap.has(paper.measurement_id)) {
          paperMap.set(paper.measurement_id, []);
        }
        paperMap.get(paper.measurement_id)!.push(paper);
      }
    });

    // Process each measurement and link production papers
    const processed = measurements.map((measurement: any) => {
      const linkedPapers = paperMap.get(measurement.id) || [];
      return {
        ...measurement,
        productionPapers: linkedPapers
      };
    });

    // Sort by measurement date (newest first) or measurement number
    processed.sort((a: any, b: any) => {
      if (a.measurement_date && b.measurement_date) {
        return new Date(b.measurement_date).getTime() - new Date(a.measurement_date).getTime();
      }
      return (b.measurement_number || '').localeCompare(a.measurement_number || '');
    });

    setMeasurementsWithPapers(processed);
  };

  // Helper function to group items by BLDG
  // Helper function to group items by building (currently unused but kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const groupItemsByBldg = (items: any[]): { [key: string]: any[] } => {
    const grouped: { [key: string]: any[] } = {};
    items.forEach((item: any) => {
      const bldg = item.bldg || 'Unknown';
      if (!grouped[bldg]) {
        grouped[bldg] = [];
      }
      grouped[bldg].push(item);
    });
    return grouped;
  };
  // Suppress unused variable warning for future use
  void groupItemsByBldg;

  // Helper function to get production paper for a measurement
  const getProductionPaperForMeasurement = (measurementId: number): any | null => {
    const measurement = measurementsWithPapers.find((m: any) => m.id === measurementId);
    return measurement?.productionPapers?.[0] || null;
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

  const getItemsCount = (items: any): number => {
    if (Array.isArray(items)) {
      return items.length;
    }
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const loadHistory = async () => {
    if (!id) return;
    try {
      setLoadingHistory(true);
      const data = await api.get(`/production/parties/${id}/history`, true);
      setHistory(data || []);
      console.log('History loaded:', data);
    } catch (err: any) {
      console.error('Failed to load history:', err);
      console.error('Error details:', err.response?.data);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadClientRequirementsHistory = async () => {
    if (!id) return;
    try {
      setLoadingClientRequirementsHistory(true);
      const data = await api.get(`/production/parties/${id}/history`, true);
      // Filter to only show client requirements related changes
      const clientReqFields = ['frame_requirements', 'door_requirements', 'special_instructions'];
      const filteredHistory = (data || []).filter((entry: any) =>
        clientReqFields.includes(entry.field_name)
      );
      setClientRequirementsHistory(filteredHistory);
      console.log('Client Requirements History loaded:', filteredHistory);
    } catch (err: any) {
      console.error('Failed to load client requirements history:', err);
      console.error('Error details:', err.response?.data);
      setClientRequirementsHistory([]);
    } finally {
      setLoadingClientRequirementsHistory(false);
    }
  };

  const handleSaveOrderDetails = async () => {
    if (!id) return;
    try {
      const updateData = {
        ...orderDetails,
        credit_days: orderDetails.credit_days ? parseInt(orderDetails.credit_days) : null,
        security_cheque_pdc: orderDetails.security_cheque_pdc
      };

      const updatedParty = await api.put(`/production/parties/${id}/order-details`, updateData, true);
      setParty(updatedParty);
      setIsEditingOrderDetails(false);
      setOrderDetails({ ...orderDetails, change_reason: '' });
      await loadHistory(); // Refresh history
      alert('Order details updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update order details');
    }
  };

  const handleCancelEdit = () => {
    if (party) {
      setOrderDetails({
        payment_terms: party.payment_terms || '',
        credit_limit: party.credit_limit || '',
        credit_days: party.credit_days?.toString() || '',
        security_cheque_pdc: party.security_cheque_pdc || false,
        preferred_delivery_location: party.preferred_delivery_location || '',
        unloading_responsibility: party.unloading_responsibility || '',
        working_hours_at_site: party.working_hours_at_site || '',
        special_instructions: party.special_instructions || '',
        change_reason: ''
      });
    }
    setIsEditingOrderDetails(false);
  };

  // Helper functions for frame requirements
  const addFrameRequirement = () => {
    setFrameRequirements([...frameRequirements, {
      site_name: '',
      site_location: '',
      total_quantity: '',
      product_area: '',
      concept: '',
      frame_design: '',
      wall_type: '',
      laminate: '',
      rebate: '',
      sub_frame: '',
      construction: '',
      cover_moulding: '',
      remark: '',
    }]);
  };

  const removeFrameRequirement = (index: number) => {
    if (frameRequirements.length > 1) {
      setFrameRequirements(frameRequirements.filter((_, i) => i !== index));
    }
  };

  const updateFrameRequirement = (index: number, field: string, value: string) => {
    const updated = [...frameRequirements];
    updated[index] = { ...updated[index], [field]: value };
    setFrameRequirements(updated);
  };

  // Helper functions for door requirements
  const addDoorRequirement = () => {
    setDoorRequirements([...doorRequirements, {
      site_name: '',
      site_location: '',
      total_quantity: '',
      product_area: '',
      concept: '',
      thickness: '',
      frontside_design: '',
      backside_design: '',
      frontside_laminate: '',
      backside_laminate: '',
      gel_colour: '',
      grade: '',
      side_frame: '',
      filler: '',
      foam_bottom: '',
      frp_coating: '',
      core: 'D/C',
    }]);
  };

  const removeDoorRequirement = (index: number) => {
    if (doorRequirements.length > 1) {
      setDoorRequirements(doorRequirements.filter((_, i) => i !== index));
    }
  };

  const updateDoorRequirement = (index: number, field: string, value: string) => {
    const updated = [...doorRequirements];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-set backside_design to "same as front" when frontside_design changes
    if (field === 'frontside_design' && value) {
      updated[index].backside_design = 'same as front';
    }

    setDoorRequirements(updated);
  };



  // Excel-like functionality for FOR FRAME table
  const doorTableRef = useRef<HTMLTableElement>(null);

  const handleSaveClientRequirements = async () => {
    if (!id) return;
    try {
      const updateData: any = {
        frame_requirements: JSON.stringify(frameRequirements),
        door_requirements: JSON.stringify(doorRequirements),
        special_instructions: clientSpecialInstructions ?? '',
      };

      const updatedParty = await api.put(`/production/parties/${id}`, updateData, true);
      setParty(updatedParty);

      setIsEditingClientRequirements(false);
      if (showClientRequirementsHistory) {
        await loadClientRequirementsHistory();
      }
      alert('Client requirements updated successfully');
    } catch (err: any) {
      alert(getErrorMessage(err) || 'Failed to update client requirements');
    }
  };

  const handleEditClientRequirements = () => {
    // Ensure at least one row exists when entering edit mode
    if (frameRequirements.length === 0) {
      setFrameRequirements([{
        site_name: '',
        site_location: '',
        total_quantity: '',
        product_area: '',
        concept: '',
        frame_design: '',
        wall_type: '',
        laminate: '',
        rebate: '',
        sub_frame: '',
        construction: '',
        cover_moulding: '',
        remark: '',
      }]);
    }
    if (doorRequirements.length === 0) {
      setDoorRequirements([{
        site_name: '',
        site_location: '',
        total_quantity: '',
        product_area: '',
        concept: '',
        thickness: '',
        frontside_design: '',
        backside_design: '',
        frontside_laminate: '',
        backside_laminate: '',
        gel_colour: '',
        grade: '',
        side_frame: '',
        filler: '',
        foam_bottom: '',
        frp_coating: '',
        core: 'D/C',
      }]);
    }
    setIsEditingClientRequirements(true);
  };

  const handleCancelEditClientRequirements = () => {
    if (party) {
      // Use helper functions to parse requirements and reset to original values
      setFrameRequirements(parseFrameRequirements(party));
      setDoorRequirements(parseDoorRequirements(party));
      setClientSpecialInstructions(party.special_instructions || '');
      setIsEditingClientRequirements(false);
    }
  };

  const handleSavePurchaseOrderStatus = async () => {
    if (!id) {
      alert('Party ID is missing');
      return;
    }

    if (!purchaseOrderStatus || purchaseOrderStatus.trim() === '') {
      alert('Please select or enter a Purchase Order Status');
      return;
    }

    try {
      // Convert PO document to base64 if present
      let poDocumentBase64: string | undefined = undefined;
      let documentsArray = [...partyDocuments];

      if (poDocument) {
        poDocumentBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64Content = result.split(',')[1] || result;
            resolve(base64Content);
          };
          reader.onerror = reject;
          reader.readAsDataURL(poDocument);
        });

        // Add new document to the array
        // Format as data URL for the url field, matching Document schema
        const dataUrl = `data:${poDocument.type};base64,${poDocumentBase64}`;
        const newDocument = {
          type: 'PO_Reference',
          filename: poDocument.name,
          url: dataUrl
        };
        documentsArray.push(newDocument);
      }

      const updateData: any = {
        customer_status: purchaseOrderStatus.trim(),
      };

      // Only update documents if a new document was uploaded
      if (poDocument) {
        updateData.documents = JSON.stringify(documentsArray);
      }

      await api.put(`/production/parties/${id}`, updateData, true);

      // Reload party data
      await loadParty();

      // Reset document upload state
      setPoDocument(null);
      setPoDocumentPreview(null);
      setIsEditingPurchaseOrderStatus(false);

      // Refresh history if it's currently shown
      if (showPoStatusHistory) {
        try {
          const historyData = await api.get(`/production/parties/${id}/history`, true);
          const poHistory = (historyData || []).filter((entry: any) =>
            entry.field_name === 'customer_status' || entry.field_name === 'documents'
          );
          setPoStatusHistory(poHistory);
        } catch (err: any) {
          console.error('Failed to refresh PO status history:', err);
        }
      }

      alert('Purchase Order Status updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update Purchase Order Status');
    }
  };

  const handleLoadPoStatusHistory = async () => {
    if (!id) {
      alert('Party ID is missing');
      return;
    }

    if (!showPoStatusHistory) {
      setShowPoStatusHistory(true);
      setLoadingHistory(true);
      try {
        const historyData = await api.get(`/production/parties/${id}/history`, true);
        const poHistory = (historyData || []).filter((entry: any) =>
          entry.field_name === 'customer_status' || entry.field_name === 'documents'
        );
        setPoStatusHistory(poHistory);
      } catch (err: any) {
        console.error('Failed to load PO status history:', err);
        alert(err.response?.data?.detail || 'Failed to load Purchase Order Status history');
        setPoStatusHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    } else {
      setShowPoStatusHistory(false);
    }
  };

  const handleViewDocument = (docUrl: string, filename: string) => {
    if (!docUrl) return;

    try {
      // If it's already a data URL, use it directly
      if (docUrl.startsWith('data:')) {
        // Open in a new window for better viewing experience
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>${filename}</title>
                <style>
                  body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
                  img { max-width: 100%; max-height: 90vh; object-fit: contain; }
                  iframe { width: 100%; height: 90vh; border: none; }
                  .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                </style>
              </head>
              <body>
                <div class="container">
                  ${docUrl.includes('image/') || docUrl.includes('jpeg') || docUrl.includes('jpg') || docUrl.includes('png') || docUrl.includes('gif')
              ? `<img src="${docUrl}" alt="${filename}" />`
              : `<iframe src="${docUrl}"></iframe>`
            }
                </div>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      } else {
        // If it's a regular URL, open it
        window.open(docUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Unable to view document. Please try downloading it instead.');
    }
  };

  // Helper function to parse and format requirements for history display
  const formatRequirementsForHistory = (value: string | null, _type: 'frame' | 'door'): any[] => {
    if (!value || value === 'null' || value === 'None') return [];
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
    } catch (e) {
      return [];
    }
  };

  const getFieldLabel = (fieldName: string): string => {
    const labels: { [key: string]: string } = {
      payment_terms: 'Payment Terms',
      credit_limit: 'Credit Limit',
      credit_days: 'Credit Days',
      frame_requirements: 'Frame Requirements',
      door_requirements: 'Shutter Requirements',
      security_cheque_pdc: 'Security Cheque PDC',
      preferred_delivery_location: 'Preferred Delivery Location',
      unloading_responsibility: 'Unloading Responsibility',
      working_hours_at_site: 'Working Hours at Site',
      special_instructions: 'Special Instructions'
    };
    return labels[fieldName] || fieldName;
  };

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

  if (error || !party) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Navbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <main className="p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error || 'Party not found'}
            </div>
            <Link
              to="/parties"
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to Parties
            </Link>
          </main>
        </div>
      </div>
    );
  }

  const getContactPersons = () => {
    if (!party.contact_persons) return [];
    if (Array.isArray(party.contact_persons)) return party.contact_persons;
    if (typeof party.contact_persons === 'string') {
      try {
        return JSON.parse(party.contact_persons);
      } catch {
        return [];
      }
    }
    return [];
  };

  const getOfficeAddress = () => {
    if (!party.office_address) return null;
    if (typeof party.office_address === 'string') {
      try {
        return JSON.parse(party.office_address);
      } catch {
        return null;
      }
    }
    return party.office_address;
  };

  const getSiteAddresses = () => {
    if (!party.site_addresses) return [];
    if (Array.isArray(party.site_addresses)) return party.site_addresses;
    if (typeof party.site_addresses === 'string') {
      try {
        return JSON.parse(party.site_addresses);
      } catch {
        return [];
      }
    }
    return [];
  };

  const contactPersons = getContactPersons();
  const officeAddress = getOfficeAddress();
  const siteAddresses = getSiteAddresses();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-6">
            <button
              onClick={() => navigate('/parties')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Parties
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Party Details</h1>
                <p className="text-gray-600 mt-2">View complete party information</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleShowSummary}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  View Summary
                </button>
                <button
                  onClick={handleShowProductionPapers}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FileTextIcon className="w-4 h-4" />
                  Production Papers
                </button>
                <button
                  onClick={handleShowAllMeasurements}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                >
                  <Ruler className="w-4 h-4" />
                  All Measurement
                </button>
                <Link
                  to={`/production-papers/create?party_id=${party.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Production Paper
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 overflow-x-auto">
                <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6 flex-shrink-0">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Party Name</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">{party.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6 flex-shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Party Type</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">{party.party_type || '-'}</p>
                  </div>
                </div>
                {party.customer_status && (
                  <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6 flex-shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${party.customer_status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : party.customer_status === 'On Hold'
                            ? 'bg-yellow-100 text-yellow-800'
                            : party.customer_status === 'Blacklisted'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                          {party.customer_status}
                        </span>
                        {party.approval_status && (
                          <span className="text-xs text-gray-600">{party.approval_status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {party.phone && (
                  <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6 flex-shrink-0">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">{party.phone}</p>
                    </div>
                  </div>
                )}
                {party.email && (
                  <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6 flex-shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 break-all max-w-[200px] sm:max-w-none">{party.email}</p>
                    </div>
                  </div>
                )}
                {contactPersons.length > 0 && contactPersons[0].name && (
                  <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6 flex-shrink-0">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Primary Contact</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">{contactPersons[0].name}</p>
                      {contactPersons[0].designation && (
                        <p className="text-xs text-gray-600">{contactPersons[0].designation}</p>
                      )}
                    </div>
                  </div>
                )}
                {contactPersons.length > 0 && contactPersons[0].mobile_number && (
                  <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6 flex-shrink-0">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Contact Mobile</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">{contactPersons[0].mobile_number}</p>
                    </div>
                  </div>
                )}
                {contactPersons.length > 0 && contactPersons[0].email && !party.email && (
                  <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6 flex-shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Contact Email</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 break-all max-w-[200px] sm:max-w-none">{contactPersons[0].email}</p>
                    </div>
                  </div>
                )}
                {contactPersons.length > 1 && (
                  <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6 flex-shrink-0">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Total Contacts</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">{contactPersons.length} Persons</p>
                    </div>
                  </div>
                )}
                {(officeAddress?.city || party.office_city) && (
                  <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6 flex-shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">City</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">
                        {officeAddress?.city || party.office_city}
                        {(officeAddress?.state || party.office_state) && `, ${officeAddress?.state || party.office_state}`}
                      </p>
                    </div>
                  </div>
                )}
                {siteAddresses.length > 0 && (
                  <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6 flex-shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Site Addresses</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">{siteAddresses.length} Site{siteAddresses.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}
                {party.customer_code && (
                  <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6 flex-shrink-0">
                    <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Customer Code</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">{party.customer_code}</p>
                    </div>
                  </div>
                )}
                {party.assigned_sales_executive && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Sales Executive</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">{party.assigned_sales_executive}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {(party.phone || party.email || contactPersons.length > 0) && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
              </div>
              <div className="p-6">
                {party.phone && (
                  <div className="flex items-center gap-3 mb-4">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-lg font-semibold text-gray-900">{party.phone}</p>
                    </div>
                  </div>
                )}
                {party.email && (
                  <div className="flex items-center gap-3 mb-4">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-lg font-semibold text-gray-900">{party.email}</p>
                    </div>
                  </div>
                )}
                {contactPersons.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Contact Persons</p>
                    <div className="space-y-3">
                      {contactPersons.map((contact: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <p className="font-semibold text-gray-900">{contact.name || 'N/A'}</p>
                          {contact.designation && (
                            <p className="text-sm text-gray-600">{contact.designation}</p>
                          )}
                          {contact.mobile_number && (
                            <p className="text-sm text-gray-600">Phone: {contact.mobile_number}</p>
                          )}
                          {contact.email && (
                            <p className="text-sm text-gray-600">Email: {contact.email}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address Information */}
          {(officeAddress || party.office_city || party.address) && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Address Information</h2>
              </div>
              <div className="p-6">
                {officeAddress && (
                  <div className="space-y-2">
                    {officeAddress.line1 && <p className="text-gray-900">{officeAddress.line1}</p>}
                    {officeAddress.line2 && <p className="text-gray-900">{officeAddress.line2}</p>}
                    {officeAddress.area && <p className="text-gray-900">{officeAddress.area}</p>}
                    <p className="text-gray-900">
                      {officeAddress.city || party.office_city || ''}
                      {officeAddress.city && officeAddress.state && ', '}
                      {officeAddress.state || party.office_state || ''}
                      {officeAddress.pinCode && ` - ${officeAddress.pinCode}`}
                    </p>
                    {officeAddress.country && <p className="text-gray-900">{officeAddress.country}</p>}
                  </div>
                )}
                {!officeAddress && party.address && (
                  <p className="text-gray-900">{party.address}</p>
                )}
                {!officeAddress && !party.address && (party.office_city || party.office_state) && (
                  <p className="text-gray-900">
                    {party.office_city || ''}
                    {party.office_city && party.office_state && ', '}
                    {party.office_state || ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tax Information */}
          {(party.gstin_number || party.pan_number) && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Tax Information</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-6">
                {party.gstin_number && (
                  <div>
                    <p className="text-sm text-gray-500">GSTIN</p>
                    <p className="text-lg font-semibold text-gray-900">{party.gstin_number}</p>
                  </div>
                )}
                {party.pan_number && (
                  <div>
                    <p className="text-sm text-gray-500">PAN Number</p>
                    <p className="text-lg font-semibold text-gray-900">{party.pan_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Purchase Order Status Section */}
          <div id="purchase-order-status" className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Purchase Order Status</h2>
                  <p className="text-sm text-gray-500 mt-1">View and update purchase order status</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleLoadPoStatusHistory}
                    disabled={loadingHistory}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <History className="w-4 h-4" />
                    {loadingHistory ? 'Loading...' : (showPoStatusHistory ? 'Hide' : 'Show') + ' History'}
                  </button>
                  {!isEditingPurchaseOrderStatus ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingPurchaseOrderStatus(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSavePurchaseOrderStatus}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingPurchaseOrderStatus(false);
                          setPurchaseOrderStatus(party?.customer_status || '');
                          setPoDocument(null);
                          setPoDocumentPreview(null);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Order Status
                  </label>
                  {isEditingPurchaseOrderStatus ? (
                    purchaseOrderStatus === 'Custom' || (purchaseOrderStatus &&
                      purchaseOrderStatus !== 'PO_OK' &&
                      purchaseOrderStatus !== 'NO_PO' &&
                      purchaseOrderStatus !== 'PO_OK Hold By Party' &&
                      purchaseOrderStatus !== 'PO_OK No Measurement' &&
                      purchaseOrderStatus !== 'Measurement Received NO_PO' &&
                      purchaseOrderStatus !== 'Hold By Authority') ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          value={purchaseOrderStatus === 'Custom' ? '' : purchaseOrderStatus}
                          onChange={(e) => setPurchaseOrderStatus(e.target.value)}
                          onBlur={(e) => {
                            if (!e.target.value.trim()) {
                              setPurchaseOrderStatus('');
                            }
                          }}
                          placeholder="Enter custom purchase order status"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setPurchaseOrderStatus('')}
                          className="text-gray-500 hover:text-gray-700 px-2 py-2"
                          title="Back to dropdown"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <select
                        value={purchaseOrderStatus}
                        onChange={(e) => {
                          if (e.target.value === 'Custom') {
                            setPurchaseOrderStatus('Custom');
                          } else {
                            setPurchaseOrderStatus(e.target.value);
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select Purchase Order Status</option>
                        <option value="PO_OK">PO_OK</option>
                        <option value="NO_PO">NO_PO</option>
                        <option value="PO_OK Hold By Party">PO_OK Hold By Party</option>
                        <option value="PO_OK No Measurement">PO_OK No Measurement</option>
                        <option value="Measurement Received NO_PO">Measurement Received NO_PO</option>
                        <option value="Hold By Authority">Hold By Authority</option>
                        <option value="Custom">Custom</option>
                      </select>
                    )
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md">
                      <p className="text-lg font-semibold text-gray-900">
                        {purchaseOrderStatus || '-'}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Status
                  </label>
                  <div className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-md">
                    <p className="text-lg font-semibold text-gray-900">
                      Auto-set based on your role
                    </p>
                  </div>
                </div>
              </div>

              {/* PO Or other Reference Upload */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PO Or other Reference
                </label>
                {isEditingPurchaseOrderStatus ? (
                  <>
                    {!poDocument ? (
                      <div className="mt-1">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 10 * 1024 * 1024) {
                                  alert('File size must be less than 10MB');
                                  return;
                                }
                                setPoDocument(file);
                                // Create preview for images
                                if (file.type.startsWith('image/')) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setPoDocumentPreview(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                } else {
                                  setPoDocumentPreview(null);
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="mt-1 p-4 border border-gray-300 rounded-lg bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <File className="w-8 h-8 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{poDocument.name}</p>
                              <p className="text-xs text-gray-500">
                                {(poDocument.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPoDocument(null);
                              setPoDocumentPreview(null);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        {poDocumentPreview && (
                          <div className="mt-4">
                            <img
                              src={poDocumentPreview}
                              alt="Preview"
                              className="max-w-full h-48 object-contain rounded border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-1">
                    {partyDocuments.length > 0 ? (
                      <div className="space-y-3">
                        {partyDocuments.map((doc: any, index: number) => (
                          <div
                            key={index}
                            className="p-4 border border-gray-300 rounded-lg bg-gray-50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <File className="w-8 h-8 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {doc.filename || `Document ${index + 1}`}
                                  </p>
                                  {doc.type && (
                                    <p className="text-xs text-gray-500">
                                      Type: {doc.type}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {doc.url && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleViewDocument(doc.url, doc.filename || 'document')}
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View
                                  </button>
                                  <a
                                    href={doc.url}
                                    download={doc.filename || 'document'}
                                    className="text-green-600 hover:text-green-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 text-center">
                        <File className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">No documents uploaded</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* History Section */}
              {showPoStatusHistory && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Order Status History</h3>
                  {loadingHistory ? (
                    <p className="text-gray-500">Loading history...</p>
                  ) : poStatusHistory.length > 0 ? (
                    <div className="space-y-3">
                      {poStatusHistory.map((entry: any) => (
                        <div
                          key={entry.id}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Changed by: {entry.changed_by_username || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(entry.changed_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Previous Value</p>
                              <p className="text-sm font-medium text-gray-700">
                                {entry.old_value || '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">New Value</p>
                              <p className="text-sm font-medium text-green-700">
                                {entry.new_value || '-'}
                              </p>
                            </div>
                          </div>
                          {entry.change_reason && (
                            <p className="text-xs text-gray-500 mt-2">
                              Reason: {entry.change_reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No history available</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order Details Section */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newShowHistory = !showHistory;
                      setShowHistory(newShowHistory);
                      if (newShowHistory && !history.length && !loadingHistory) {
                        loadHistory();
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <History className="w-4 h-4" />
                    {showHistory ? 'Hide' : 'Show'} History
                  </button>
                  {!isEditingOrderDetails ? (
                    <button
                      onClick={() => setIsEditingOrderDetails(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveOrderDetails}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6">
              {isEditingOrderDetails ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                      <input
                        type="text"
                        value={orderDetails.payment_terms}
                        onChange={(e) => setOrderDetails({ ...orderDetails, payment_terms: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Advance, 50% Advance – 50% Delivery, Credit"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                      <input
                        type="text"
                        value={orderDetails.credit_limit}
                        onChange={(e) => setOrderDetails({ ...orderDetails, credit_limit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter credit limit"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Credit Days</label>
                      <input
                        type="number"
                        value={orderDetails.credit_days}
                        onChange={(e) => setOrderDetails({ ...orderDetails, credit_days: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter credit days"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Delivery Location</label>
                      <select
                        value={orderDetails.preferred_delivery_location}
                        onChange={(e) => setOrderDetails({ ...orderDetails, preferred_delivery_location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        <option value="Factory Pickup">Factory Pickup</option>
                        <option value="Site Delivery">Site Delivery</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unloading Responsibility</label>
                      <select
                        value={orderDetails.unloading_responsibility}
                        onChange={(e) => setOrderDetails({ ...orderDetails, unloading_responsibility: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        <option value="Company">Company</option>
                        <option value="Customer">Customer</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="security_cheque_pdc"
                        checked={orderDetails.security_cheque_pdc}
                        onChange={(e) => setOrderDetails({ ...orderDetails, security_cheque_pdc: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="security_cheque_pdc" className="ml-2 text-sm font-medium text-gray-700">
                        Security Cheque PDC
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours at Site</label>
                    <input
                      type="text"
                      value={orderDetails.working_hours_at_site}
                      onChange={(e) => setOrderDetails({ ...orderDetails, working_hours_at_site: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 9:00 AM - 6:00 PM"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                    <textarea
                      value={orderDetails.special_instructions}
                      onChange={(e) => setOrderDetails({ ...orderDetails, special_instructions: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter special instructions..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Change (Optional)</label>
                    <input
                      type="text"
                      value={orderDetails.change_reason}
                      onChange={(e) => setOrderDetails({ ...orderDetails, change_reason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter reason for this change..."
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {party.payment_terms && (
                    <div>
                      <p className="text-sm text-gray-500">Payment Terms</p>
                      <p className="text-lg font-semibold text-gray-900">{party.payment_terms}</p>
                    </div>
                  )}
                  {party.credit_limit && (
                    <div>
                      <p className="text-sm text-gray-500">Credit Limit</p>
                      <p className="text-lg font-semibold text-gray-900">{party.credit_limit}</p>
                    </div>
                  )}
                  {party.credit_days !== null && party.credit_days !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Credit Days</p>
                      <p className="text-lg font-semibold text-gray-900">{party.credit_days} days</p>
                    </div>
                  )}
                  {party.preferred_delivery_location && (
                    <div>
                      <p className="text-sm text-gray-500">Preferred Delivery Location</p>
                      <p className="text-lg font-semibold text-gray-900">{party.preferred_delivery_location}</p>
                    </div>
                  )}
                  {party.unloading_responsibility && (
                    <div>
                      <p className="text-sm text-gray-500">Unloading Responsibility</p>
                      <p className="text-lg font-semibold text-gray-900">{party.unloading_responsibility}</p>
                    </div>
                  )}
                  {party.working_hours_at_site && (
                    <div>
                      <p className="text-sm text-gray-500">Working Hours at Site</p>
                      <p className="text-lg font-semibold text-gray-900">{party.working_hours_at_site}</p>
                    </div>
                  )}
                  {party.security_cheque_pdc && (
                    <div>
                      <p className="text-sm text-gray-500">Security Cheque PDC</p>
                      <p className="text-lg font-semibold text-gray-900">Yes</p>
                    </div>
                  )}
                  {party.special_instructions && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Special Instructions</p>
                      <p className="text-lg font-semibold text-gray-900 whitespace-pre-wrap">{party.special_instructions}</p>
                    </div>
                  )}
                  {!party.payment_terms && !party.credit_limit && !party.credit_days && !party.preferred_delivery_location && !party.unloading_responsibility && !party.working_hours_at_site && !party.special_instructions && (
                    <div className="md:col-span-2 text-center py-4 text-gray-500">
                      No order details available. Click Edit to add details.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* History Section */}
          {showHistory && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Change History</h2>
              </div>
              <div className="p-6">
                {loadingHistory ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading history...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No change history available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry) => (
                      <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{getFieldLabel(entry.field_name)}</p>
                            <p className="text-sm text-gray-500">
                              Changed by {entry.changed_by_username || 'Unknown'} on{' '}
                              {new Date(entry.changed_at).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Old Value</p>
                            <div className="bg-gray-50 border border-gray-200 rounded p-2 max-h-32 overflow-y-auto">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                {entry.old_value && entry.old_value !== 'null' && entry.old_value !== 'None'
                                  ? (entry.old_value.length > 200
                                    ? entry.old_value.substring(0, 200) + '...'
                                    : entry.old_value)
                                  : '-'}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">New Value</p>
                            <div className="bg-green-50 border border-green-200 rounded p-2 max-h-32 overflow-y-auto">
                              <p className="text-sm text-gray-900 font-medium whitespace-pre-wrap break-words">
                                {entry.new_value && entry.new_value !== 'null' && entry.new_value !== 'None'
                                  ? (entry.new_value.length > 200
                                    ? entry.new_value.substring(0, 200) + '...'
                                    : entry.new_value)
                                  : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                        {entry.change_reason && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500">Reason</p>
                            <p className="text-sm text-gray-700">{entry.change_reason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Client Requirements Section */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Client Requirements</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Product preferences and special instructions from the client</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {!isEditingClientRequirements ? (
                    <>
                      <button
                        onClick={() => {
                          const newShow = !showClientRequirementsHistory;
                          setShowClientRequirementsHistory(newShow);
                          if (newShow && !clientRequirementsHistory.length && !loadingClientRequirementsHistory) {
                            loadClientRequirementsHistory();
                          }
                        }}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <History className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{showClientRequirementsHistory ? 'Hide' : 'Show'} History</span>
                        <span className="sm:hidden">History</span>
                      </button>
                      <button
                        onClick={handleEditClientRequirements}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveClientRequirements}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Save</span>
                      </button>
                      <button
                        onClick={handleCancelEditClientRequirements}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Cancel</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6">
              {/* FOR FRAME and FOR SHUTTER Tables */}
              <div className="flex flex-col gap-4 sm:gap-6 mt-4 sm:mt-6">
                {/* FOR FRAME Table */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800">FOR FRAME</h3>
                    {isEditingClientRequirements && (
                      <button
                        type="button"
                        onClick={addFrameRequirement}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm hover:shadow-md transition-all"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Add Row</span>
                      </button>
                    )}
                  </div>
                  {isEditingClientRequirements ? (
                    <div className="overflow-x-auto border border-gray-300 rounded-md bg-white -mx-4 sm:mx-0">
                      <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: '2050px' }}>
                        <thead>
                          <tr className="border-b border-gray-300">
                            <th style={{ width: '70px', minWidth: '70px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">ITEM NUMBER</th>
                            <th style={{ width: '150px', minWidth: '150px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">SITE NAME</th>
                            <th style={{ width: '240px', minWidth: '240px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">SITE LOCATION</th>
                            <th style={{ width: '140px', minWidth: '140px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">PRODUCT AREA</th>
                            <th style={{ width: '120px', minWidth: '120px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">TOTAL QUANTITY</th>
                            <th style={{ width: '120px', minWidth: '120px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">CONCEPT</th>
                            <th style={{ width: '150px', minWidth: '150px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">CONSTRUCTION</th>
                            <th style={{ width: '200px', minWidth: '200px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">FRAME DESIGN</th>
                            <th style={{ width: '120px', minWidth: '120px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">WALL TYPE</th>
                            <th style={{ width: '200px', minWidth: '200px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">LAMINATE</th>
                            <th style={{ width: '130px', minWidth: '130px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">REBATE</th>
                            <th style={{ width: '100px', minWidth: '100px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">SUB FRAME</th>
                            <th style={{ width: '150px', minWidth: '150px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">COVER MOULDING</th>
                            <th style={{ width: '200px', minWidth: '200px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">REMARK</th>
                            <th style={{ width: '80px', minWidth: '80px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {frameRequirements.map((req, rowIndex) => {
                            return (
                              <tr key={rowIndex}>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-r border-gray-300 text-center">
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">{rowIndex + 1}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.site_name}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'site_name', e.target.value)}
                                    placeholder="Enter site"
                                  />
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.site_location}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'site_location', e.target.value)}
                                    placeholder="Enter location"
                                  />
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  {showCustomInputFrame[rowIndex] ? (
                                    <div className="flex gap-1">
                                      <input
                                        type="text"
                                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={tempCustomValueFrame[rowIndex] || ''}
                                        onChange={(e) => setTempCustomValueFrame(prev => ({ ...prev, [rowIndex]: e.target.value }))}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleCustomValueSubmit(rowIndex, true, (value) => updateFrameRequirement(rowIndex, 'product_area', value));
                                          } else if (e.key === 'Escape') {
                                            handleCustomValueCancel(rowIndex, true);
                                          }
                                        }}
                                        placeholder="Area"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleCustomValueSubmit(rowIndex, true, (value) => updateFrameRequirement(rowIndex, 'product_area', value))}
                                        className="px-1 py-1 text-xs bg-green-600 text-white rounded"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCustomValueCancel(rowIndex, true)}
                                        className="px-1 py-1 text-xs bg-gray-400 text-white rounded"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <select
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      value={req.product_area}
                                      onChange={(e) => handleProductAreaSelect(e.target.value, rowIndex, true, (value) => updateFrameRequirement(rowIndex, 'product_area', value))}
                                    >
                                      <option value="">Select Area</option>
                                      {predefinedAreaOptions.map(area => (
                                        <option key={area} value={area}>{area}</option>
                                      ))}
                                      {customAreaOptions.length > 0 && (
                                        <>
                                          {customAreaOptions.map(area => (
                                            <option key={area} value={area}>{area}</option>
                                          ))}
                                        </>
                                      )}
                                      <option value="custom">custom</option>
                                    </select>
                                  )}
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.total_quantity}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'total_quantity', e.target.value)}
                                    placeholder="Qty"
                                  />
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.concept}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'concept', e.target.value)}
                                    disabled={loadingProducts}
                                  >
                                    <option value="">Select</option>
                                    {frameProducts.map((product) => (
                                      <option key={product.id} value={product.product_type}>
                                        {product.product_type}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.construction}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'construction', e.target.value)}
                                  >
                                    <option value="">Select</option>
                                    <option value="25+18(43MM)">25+18(43MM)</option>
                                    <option value="18+18(36MM)">18+18(36MM)</option>
                                    <option value="18+12(30MM)">18+12(30MM)</option>
                                    <option value="18MM">18MM</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      value={designSearchTerms[getDropdownKey(rowIndex, 'frame', 'frame')] !== undefined
                                        ? designSearchTerms[getDropdownKey(rowIndex, 'frame', 'frame')]
                                        : (req.frame_design || '')}
                                      onChange={(e) => {
                                        const key = getDropdownKey(rowIndex, 'frame', 'frame');
                                        setDesignSearchTerms(prev => ({ ...prev, [key]: e.target.value }));
                                        setOpenDesignDropdowns(prev => ({ ...prev, [key]: true }));
                                      }}
                                      onFocus={() => {
                                        const key = getDropdownKey(rowIndex, 'frame', 'frame');
                                        setOpenDesignDropdowns(prev => ({ ...prev, [key]: true }));
                                        if (!designSearchTerms[key]) {
                                          setDesignSearchTerms(prev => ({ ...prev, [key]: req.frame_design || '' }));
                                        }
                                      }}
                                      placeholder="Select Design"
                                      disabled={loadingDesigns}
                                    />
                                    {openDesignDropdowns[getDropdownKey(rowIndex, 'frame', 'frame')] && (
                                      <div
                                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl"
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        {getFilteredDesigns(designSearchTerms[getDropdownKey(rowIndex, 'frame', 'frame')] || '', 'Frame').length > 0 ? (
                                          getFilteredDesigns(designSearchTerms[getDropdownKey(rowIndex, 'frame', 'frame')] || '', 'Frame').map((design) => (
                                            <div
                                              key={design.id}
                                              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                updateFrameRequirement(rowIndex, 'frame_design', design.design_name);
                                                const key = getDropdownKey(rowIndex, 'frame', 'frame');
                                                setDesignSearchTerms(prev => ({ ...prev, [key]: design.design_name }));
                                                setOpenDesignDropdowns(prev => ({ ...prev, [key]: false }));
                                              }}
                                            >
                                              <span className="font-medium">{design.design_name}</span>
                                              {design.design_code && <span className="text-gray-500 ml-2">({design.design_code})</span>}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="px-4 py-3 text-sm text-gray-400 text-center">No designs found.</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.wall_type}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'wall_type', e.target.value)}
                                  >
                                    <option value="">Select</option>
                                    <option value="WALL TO WALL">WALL TO WALL</option>
                                    <option value="FIX">FIX</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.laminate}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'laminate', e.target.value)}
                                    placeholder="Laminate"
                                  />
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.rebate}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'rebate', e.target.value)}
                                  >
                                    <option value="">Select</option>
                                    <option value="Single Rebate">Single Rebate</option>
                                    <option value="Double Rebate">Double Rebate</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.sub_frame}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'sub_frame', e.target.value)}
                                  >
                                    <option value="">Select</option>
                                    <option value="YES">YES</option>
                                    <option value="NO">NO</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.cover_moulding}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'cover_moulding', e.target.value)}
                                  >
                                    <option value="">Select</option>
                                    <option value="LENGTH 55MM">LENGTH 55MM</option>
                                    <option value="LENGTH 43MM">LENGTH 43MM</option>
                                    <option value="LENGTH 37MM">LENGTH 37MM</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.remark}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'remark', e.target.value)}
                                    placeholder="Remark"
                                  />
                                </td>
                                <td className="px-2 py-2 bg-white text-center">
                                  {frameRequirements.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeFrameRequirement(rowIndex)}
                                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                      title="Remove row"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="sm:hidden px-4 py-2 text-xs text-gray-500 text-center bg-gray-50 border-t border-gray-200 sticky bottom-0">
                        ← Scroll horizontally to see all columns →
                      </div>
                    </div>
                  ) : (
                    frameRequirements.length > 0 && frameRequirements.some(req => {
                      // Check if any field has a value
                      return Object.values(req).some(val => val && String(val).trim() !== '');
                    }) ? (
                      <div className="overflow-x-auto border border-gray-300 rounded-md bg-white -mx-4 sm:mx-0 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                        <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: '2050px' }}>
                          <thead>
                            <tr className="border-b border-gray-300">
                              <th style={{ width: '70px', minWidth: '70px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">ITEM NUMBER</th>
                              <th style={{ width: '150px', minWidth: '150px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">SITE NAME</th>
                              <th style={{ width: '240px', minWidth: '240px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">SITE LOCATION</th>
                              <th style={{ width: '140px', minWidth: '140px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">PRODUCT AREA</th>
                              <th style={{ width: '120px', minWidth: '120px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">TOTAL QUANTITY</th>
                              <th style={{ width: '120px', minWidth: '120px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">CONCEPT</th>
                              <th style={{ width: '150px', minWidth: '150px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">CONSTRUCTION</th>
                              <th style={{ width: '200px', minWidth: '200px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">FRAME DESIGN</th>
                              <th style={{ width: '120px', minWidth: '120px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">WALL TYPE</th>
                              <th style={{ width: '200px', minWidth: '200px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">LAMINATE</th>
                              <th style={{ width: '130px', minWidth: '130px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">REBATE</th>
                              <th style={{ width: '100px', minWidth: '100px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">SUB FRAME</th>
                              <th style={{ width: '150px', minWidth: '150px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50 border-r border-gray-300">COVER MOULDING</th>
                              <th style={{ width: '200px', minWidth: '200px' }} className="px-2 py-2 text-xs font-bold text-gray-700 bg-gray-50">REMARK</th>
                            </tr>
                          </thead>
                          <tbody>
                            {frameRequirements.map((req, index) => (
                              <tr key={index}>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-r border-gray-300 text-center">
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">{index + 1}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.site_name || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.site_location || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.product_area || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.total_quantity || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.concept || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.construction || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.frame_design || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.wall_type || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.laminate || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.rebate || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.sub_frame || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.cover_moulding || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white">
                                  <span className="text-xs text-gray-900">{req.remark || '-'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="sm:hidden px-4 py-2 text-xs text-gray-500 text-center bg-gray-50 border-t border-gray-200">
                          ← Scroll horizontally to see all columns →
                        </div>
                      </div>
                    ) : (
                      <div className="border border-gray-300 rounded-md bg-gray-50 p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-gray-500">No frame requirements specified</p>
                      </div>
                    )
                  )}
                </div>

                {/* FOR SHUTTER Table */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800">FOR SHUTTER</h3>
                    {isEditingClientRequirements && (
                      <button
                        type="button"
                        onClick={addDoorRequirement}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm hover:shadow-md transition-all"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Add Row</span>
                      </button>
                    )}
                  </div>
                  {isEditingClientRequirements ? (
                    <div className="overflow-x-auto border border-gray-300 rounded-md bg-white -mx-4 sm:mx-0">
                      <table ref={doorTableRef} className="w-full border-collapse min-w-[1200px]">
                        <thead>
                          <tr className="border-b border-gray-300">
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">ITEM NUMBER</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">SITE NAME</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">SITE LOCATION</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap" style={{ width: '120px' }}>TOTAL QUANTITY</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">PRODUCT AREA</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">CONCEPT</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">THICKNESS</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">CORE</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">FRONTSIDE DESIGN</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">BACKSIDE DESIGN</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">FRONTSIDE LAMINATE</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">BACKSIDE LAMINATE</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">GEL COLOUR</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">Grade</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">Side Frame</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">Filler</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">FOAM Bottom (External/Internal)</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">FRP coating on bottom</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 whitespace-nowrap">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doorRequirements.map((req, index) => {
                            return (
                              <tr key={index}>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-r border-gray-300 text-center">
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">{index + 1}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.site_name}
                                    onChange={(e) => updateDoorRequirement(index, 'site_name', e.target.value)}
                                    placeholder="Enter site"
                                  />
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.site_location}
                                    onChange={(e) => updateDoorRequirement(index, 'site_location', e.target.value)}
                                    placeholder="Enter location"
                                  />
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <input
                                    type="number"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.total_quantity}
                                    onChange={(e) => updateDoorRequirement(index, 'total_quantity', e.target.value)}
                                    placeholder="Qty"
                                  />
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  {showCustomInputShutter[index] ? (
                                    <div className="flex gap-1">
                                      <input
                                        type="text"
                                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={tempCustomValueShutter[index] || ''}
                                        onChange={(e) => setTempCustomValueShutter(prev => ({ ...prev, [index]: e.target.value }))}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleCustomValueSubmit(index, false, (value) => updateDoorRequirement(index, 'product_area', value));
                                          } else if (e.key === 'Escape') {
                                            handleCustomValueCancel(index, false);
                                          }
                                        }}
                                        placeholder="Area"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleCustomValueSubmit(index, false, (value) => updateDoorRequirement(index, 'product_area', value))}
                                        className="px-1 py-1 text-xs bg-green-600 text-white rounded"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCustomValueCancel(index, false)}
                                        className="px-1 py-1 text-xs bg-gray-400 text-white rounded"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <select
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      value={req.product_area}
                                      onChange={(e) => handleProductAreaSelect(e.target.value, index, false, (value) => updateDoorRequirement(index, 'product_area', value))}
                                    >
                                      <option value="">Select Area</option>
                                      {predefinedAreaOptions.map(area => (
                                        <option key={area} value={area}>{area}</option>
                                      ))}
                                      {customAreaOptions.length > 0 && (
                                        <>
                                          {customAreaOptions.map(area => (
                                            <option key={area} value={area}>{area}</option>
                                          ))}
                                        </>
                                      )}
                                      <option value="custom">custom</option>
                                    </select>
                                  )}
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.concept}
                                    onChange={(e) => updateDoorRequirement(index, 'concept', e.target.value)}
                                    disabled={loadingProducts}
                                  >
                                    <option value="">Select</option>
                                    {shutterProducts.map((product) => (
                                      <option key={product.id} value={product.product_type}>
                                        {product.product_type}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.thickness}
                                    onChange={(e) => updateDoorRequirement(index, 'thickness', e.target.value)}
                                    placeholder="Thickness"
                                  />
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  {showCustomInputCoreShutter[index] ? (
                                    <div className="flex gap-1">
                                      <input
                                        type="text"
                                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={tempCustomValueCoreShutter[index] || ''}
                                        onChange={(e) => setTempCustomValueCoreShutter(prev => ({ ...prev, [index]: e.target.value }))}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleCoreSubmit(index);
                                          } else if (e.key === 'Escape') {
                                            handleCoreCancel(index);
                                          }
                                        }}
                                        placeholder="Core"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleCoreSubmit(index)}
                                        className="px-1 py-1 text-xs bg-green-600 text-white rounded"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCoreCancel(index)}
                                        className="px-1 py-1 text-xs bg-gray-400 text-white rounded"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <select
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      value={req.core || 'D/C'}
                                      onChange={(e) => handleCoreSelect(e.target.value, index)}
                                    >
                                      <option value="S/C">S/C</option>
                                      <option value="D/C">D/C</option>
                                      <option value="T/C">T/C</option>
                                      <option value="custom">custom</option>
                                    </select>
                                  )}
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      value={designSearchTerms[getDropdownKey(index, 'frontside', 'shutter')] !== undefined
                                        ? designSearchTerms[getDropdownKey(index, 'frontside', 'shutter')]
                                        : (req.frontside_design || '')}
                                      onChange={(e) => {
                                        const key = getDropdownKey(index, 'frontside', 'shutter');
                                        setDesignSearchTerms(prev => ({ ...prev, [key]: e.target.value }));
                                        setOpenDesignDropdowns(prev => ({ ...prev, [key]: true }));
                                      }}
                                      onFocus={() => {
                                        const key = getDropdownKey(index, 'frontside', 'shutter');
                                        setOpenDesignDropdowns(prev => ({ ...prev, [key]: true }));
                                        if (!designSearchTerms[key]) {
                                          setDesignSearchTerms(prev => ({ ...prev, [key]: req.frontside_design || '' }));
                                        }
                                      }}
                                      placeholder="Select Design"
                                      disabled={loadingDesigns}
                                    />
                                    {openDesignDropdowns[getDropdownKey(index, 'frontside', 'shutter')] && (
                                      <div
                                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl"
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        {getFilteredDesigns(designSearchTerms[getDropdownKey(index, 'frontside', 'shutter')] || '', 'Shutter').length > 0 ? (
                                          getFilteredDesigns(designSearchTerms[getDropdownKey(index, 'frontside', 'shutter')] || '', 'Shutter').map((design) => (
                                            <div
                                              key={design.id}
                                              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                updateDoorRequirement(index, 'frontside_design', design.design_name);
                                                const key = getDropdownKey(index, 'frontside', 'shutter');
                                                setDesignSearchTerms(prev => ({ ...prev, [key]: design.design_name }));
                                                setOpenDesignDropdowns(prev => ({ ...prev, [key]: false }));
                                              }}
                                            >
                                              <span className="font-medium">{design.design_name}</span>
                                              {design.design_code && <span className="text-gray-500 ml-2">({design.design_code})</span>}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="px-4 py-3 text-sm text-gray-400 text-center">No designs found.</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <div className="relative design-dropdown-container">
                                    <input
                                      type="text"
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      value={designSearchTerms[getDropdownKey(index, 'backside', 'shutter')] !== undefined
                                        ? designSearchTerms[getDropdownKey(index, 'backside', 'shutter')]
                                        : (req.backside_design || '')}
                                      onChange={(e) => {
                                        const key = getDropdownKey(index, 'backside', 'shutter');
                                        setDesignSearchTerms(prev => ({ ...prev, [key]: e.target.value }));
                                        setOpenDesignDropdowns(prev => ({ ...prev, [key]: true }));
                                      }}
                                      onFocus={() => {
                                        const key = getDropdownKey(index, 'backside', 'shutter');
                                        setOpenDesignDropdowns(prev => ({ ...prev, [key]: true }));
                                        if (!designSearchTerms[key]) {
                                          setDesignSearchTerms(prev => ({ ...prev, [key]: req.backside_design || '' }));
                                        }
                                      }}
                                      placeholder="Select Design"
                                      disabled={loadingDesigns}
                                    />
                                    {openDesignDropdowns[getDropdownKey(index, 'backside', 'shutter')] && (
                                      <div
                                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl"
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        {getFilteredDesigns(designSearchTerms[getDropdownKey(index, 'backside', 'shutter')] || '', 'Shutter', true).length > 0 ? (
                                          getFilteredDesigns(designSearchTerms[getDropdownKey(index, 'backside', 'shutter')] || '', 'Shutter', true).map((design) => (
                                            <div
                                              key={design.id}
                                              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                updateDoorRequirement(index, 'backside_design', design.design_name);
                                                const key = getDropdownKey(index, 'backside', 'shutter');
                                                setDesignSearchTerms(prev => ({ ...prev, [key]: design.design_name }));
                                                setOpenDesignDropdowns(prev => ({ ...prev, [key]: false }));
                                              }}
                                            >
                                              {design.design_name === 'same as front' ? (
                                                <span className="font-medium text-green-600">✓ same as front</span>
                                              ) : (
                                                <>
                                                  <span className="font-medium">{design.design_name}</span>
                                                  {design.design_code && <span className="text-gray-500 ml-2">({design.design_code})</span>}
                                                </>
                                              )}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="px-4 py-3 text-sm text-gray-400 text-center">No designs found.</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <div className="relative laminate-dropdown-container">
                                    <input
                                      type="text"
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      value={laminateSearchTerms[getLaminateDropdownKey(index, 'frontside')] !== undefined
                                        ? laminateSearchTerms[getLaminateDropdownKey(index, 'frontside')]
                                        : (req.frontside_laminate || '')}
                                      onChange={(e) => {
                                        const key = getLaminateDropdownKey(index, 'frontside');
                                        const value = e.target.value;
                                        setLaminateSearchTerms(prev => ({ ...prev, [key]: value }));
                                        setOpenLaminateDropdowns(prev => ({ ...prev, [key]: true }));
                                        updateDoorRequirement(index, 'frontside_laminate', value);
                                      }}
                                      onFocus={() => {
                                        const key = getLaminateDropdownKey(index, 'frontside');
                                        setOpenLaminateDropdowns(prev => ({ ...prev, [key]: true }));
                                        if (laminateSearchTerms[key] === undefined) {
                                          setLaminateSearchTerms(prev => ({ ...prev, [key]: req.frontside_laminate || '' }));
                                        }
                                      }}
                                      onBlur={(e) => {
                                        const key = getLaminateDropdownKey(index, 'frontside');
                                        const currentValue = e.target.value;
                                        if (currentValue && currentValue.trim()) {
                                          updateDoorRequirement(index, 'frontside_laminate', currentValue.trim());
                                        }
                                        setTimeout(() => {
                                          setOpenLaminateDropdowns(prev => ({ ...prev, [key]: false }));
                                        }, 200);
                                      }}
                                      placeholder="Laminate"
                                    />
                                    {openLaminateDropdowns[getLaminateDropdownKey(index, 'frontside')] && (
                                      <div
                                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl"
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        {getFilteredLaminates(laminateSearchTerms[getLaminateDropdownKey(index, 'frontside')] || '', false).length > 0 ? (
                                          getFilteredLaminates(laminateSearchTerms[getLaminateDropdownKey(index, 'frontside')] || '', false).map((laminate, idx) => (
                                            <div
                                              key={idx}
                                              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0 ${laminate === 'custom'
                                                ? 'text-blue-600 hover:bg-blue-50 font-medium'
                                                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                                                }`}
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                if (laminate === 'custom') {
                                                  const key = getLaminateDropdownKey(index, 'frontside');
                                                  const currentSearch = laminateSearchTerms[key] || '';
                                                  setOpenLaminateDropdowns(prev => ({ ...prev, [key]: false }));
                                                  setTimeout(() => {
                                                    const inputs = document.querySelectorAll(`input[placeholder="Laminate"]`);
                                                    const input = Array.from(inputs).find((inp: any) =>
                                                      inp.value === currentSearch || inp === document.activeElement
                                                    ) as HTMLInputElement;
                                                    if (input) input.focus();
                                                  }, 100);
                                                } else {
                                                  updateDoorRequirement(index, 'frontside_laminate', laminate);
                                                  const key = getLaminateDropdownKey(index, 'frontside');
                                                  setLaminateSearchTerms(prev => ({ ...prev, [key]: laminate }));
                                                  setOpenLaminateDropdowns(prev => ({ ...prev, [key]: false }));
                                                }
                                              }}
                                            >
                                              {laminate === 'custom' ? '✎ custom' : laminate}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="px-4 py-3 text-sm text-gray-400 text-center">No laminates found.</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <div className="relative laminate-dropdown-container">
                                    <input
                                      type="text"
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      value={laminateSearchTerms[getLaminateDropdownKey(index, 'backside')] !== undefined
                                        ? laminateSearchTerms[getLaminateDropdownKey(index, 'backside')]
                                        : (req.backside_laminate || '')}
                                      onChange={(e) => {
                                        const key = getLaminateDropdownKey(index, 'backside');
                                        const value = e.target.value;
                                        setLaminateSearchTerms(prev => ({ ...prev, [key]: value }));
                                        setOpenLaminateDropdowns(prev => ({ ...prev, [key]: true }));
                                        updateDoorRequirement(index, 'backside_laminate', value);
                                      }}
                                      onFocus={() => {
                                        const key = getLaminateDropdownKey(index, 'backside');
                                        setOpenLaminateDropdowns(prev => ({ ...prev, [key]: true }));
                                        if (laminateSearchTerms[key] === undefined) {
                                          setLaminateSearchTerms(prev => ({ ...prev, [key]: req.backside_laminate || '' }));
                                        }
                                      }}
                                      onBlur={(e) => {
                                        const key = getLaminateDropdownKey(index, 'backside');
                                        const currentValue = e.target.value;
                                        if (currentValue && currentValue.trim()) {
                                          updateDoorRequirement(index, 'backside_laminate', currentValue.trim());
                                        }
                                        setTimeout(() => {
                                          setOpenLaminateDropdowns(prev => ({ ...prev, [key]: false }));
                                        }, 200);
                                      }}
                                      placeholder="Laminate"
                                    />
                                    {openLaminateDropdowns[getLaminateDropdownKey(index, 'backside')] && (
                                      <div
                                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl"
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        {getFilteredLaminates(laminateSearchTerms[getLaminateDropdownKey(index, 'backside')] || '', true).length > 0 ? (
                                          getFilteredLaminates(laminateSearchTerms[getLaminateDropdownKey(index, 'backside')] || '', true).map((laminate, idx) => (
                                            <div
                                              key={idx}
                                              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0 ${laminate === 'same as front'
                                                ? 'text-green-600 hover:bg-green-50 font-medium'
                                                : laminate === 'custom'
                                                  ? 'text-blue-600 hover:bg-blue-50 font-medium'
                                                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                                                }`}
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                if (laminate === 'custom') {
                                                  const key = getLaminateDropdownKey(index, 'backside');
                                                  const currentSearch = laminateSearchTerms[key] || '';
                                                  setOpenLaminateDropdowns(prev => ({ ...prev, [key]: false }));
                                                  setTimeout(() => {
                                                    const inputs = document.querySelectorAll(`input[placeholder="Laminate"]`);
                                                    const input = Array.from(inputs).find((inp: any) =>
                                                      inp.value === currentSearch || inp === document.activeElement
                                                    ) as HTMLInputElement;
                                                    if (input) input.focus();
                                                  }, 100);
                                                } else {
                                                  updateDoorRequirement(index, 'backside_laminate', laminate);
                                                  const key = getLaminateDropdownKey(index, 'backside');
                                                  setLaminateSearchTerms(prev => ({ ...prev, [key]: laminate }));
                                                  setOpenLaminateDropdowns(prev => ({ ...prev, [key]: false }));
                                                }
                                              }}
                                            >
                                              {laminate === 'same as front' ? '✓ same as front' : (laminate === 'custom' ? '✎ custom' : laminate)}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="px-4 py-3 text-sm text-gray-400 text-center">No laminates found.</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.gel_colour}
                                    onChange={(e) => updateDoorRequirement(index, 'gel_colour', e.target.value)}
                                    placeholder="Gel colour"
                                  />
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  {req.grade === 'custom' || (req.grade && req.grade !== 'MR' && req.grade !== 'PF') ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={req.grade === 'custom' ? '' : req.grade}
                                        onChange={(e) => updateDoorRequirement(index, 'grade', e.target.value)}
                                        onBlur={(e) => {
                                          if (!e.target.value.trim()) {
                                            updateDoorRequirement(index, 'grade', '');
                                          }
                                        }}
                                        placeholder="Grade"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateDoorRequirement(index, 'grade', '')}
                                        className="text-xs text-gray-500 hover:text-gray-700 px-1"
                                        title="Back"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ) : (
                                    <select
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      value={req.grade || ''}
                                      onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                          updateDoorRequirement(index, 'grade', 'custom');
                                        } else {
                                          updateDoorRequirement(index, 'grade', e.target.value);
                                        }
                                      }}
                                    >
                                      <option value="">Select</option>
                                      <option value="MR">MR</option>
                                      <option value="PF">PF</option>
                                      <option value="custom">custom</option>
                                    </select>
                                  )}
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  {req.side_frame === 'Custom' || (req.side_frame && req.side_frame !== 'Pinewood' && req.side_frame !== 'Nimwood') ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={req.side_frame === 'Custom' ? '' : req.side_frame}
                                        onChange={(e) => updateDoorRequirement(index, 'side_frame', e.target.value)}
                                        onBlur={(e) => {
                                          if (!e.target.value.trim()) {
                                            updateDoorRequirement(index, 'side_frame', '');
                                          }
                                        }}
                                        placeholder="Side frame"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateDoorRequirement(index, 'side_frame', '')}
                                        className="text-xs text-gray-500 hover:text-gray-700 px-1"
                                        title="Back"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ) : (
                                    <select
                                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      value={req.side_frame}
                                      onChange={(e) => {
                                        if (e.target.value === 'Custom') {
                                          updateDoorRequirement(index, 'side_frame', 'Custom');
                                        } else {
                                          updateDoorRequirement(index, 'side_frame', e.target.value);
                                        }
                                      }}
                                    >
                                      <option value="">Select</option>
                                      <option value="Pinewood">Pinewood</option>
                                      <option value="Nimwood">Nimwood</option>
                                      <option value="Custom">Custom</option>
                                    </select>
                                  )}
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.filler}
                                    onChange={(e) => updateDoorRequirement(index, 'filler', e.target.value)}
                                    placeholder="Filler"
                                  />
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.foam_bottom}
                                    onChange={(e) => updateDoorRequirement(index, 'foam_bottom', e.target.value)}
                                  >
                                    <option value="">Select</option>
                                    <option value="External">External</option>
                                    <option value="Internal">Internal</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={req.frp_coating}
                                    onChange={(e) => updateDoorRequirement(index, 'frp_coating', e.target.value)}
                                    placeholder="FRP coating"
                                  />
                                </td>
                                <td className="px-2 py-2 bg-white text-center">
                                  {doorRequirements.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeDoorRequirement(index)}
                                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                      title="Remove row"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="sm:hidden px-4 py-2 text-xs text-gray-500 text-center bg-gray-50 border-t border-gray-200 sticky bottom-0">
                        ← Scroll horizontally to see all columns →
                      </div>
                    </div>
                  ) : (
                    doorRequirements.length > 0 && doorRequirements.some(req => {
                      // Check if any field has a value
                      return Object.values(req).some(val => val && String(val).trim() !== '');
                    }) ? (
                      <div className="overflow-x-auto border border-gray-300 rounded-md bg-white -mx-4 sm:mx-0">
                        <table className="w-full border-collapse min-w-[1200px]">
                          <thead>
                            <tr className="border-b border-gray-300">
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">ITEM NUMBER</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">SITE NAME</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">SITE LOCATION</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">TOTAL QUANTITY</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">PRODUCT AREA</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">CONCEPT</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">THICKNESS</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">CORE</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">FRONTSIDE DESIGN</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">BACKSIDE DESIGN</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">FRONTSIDE LAMINATE</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">BACKSIDE LAMINATE</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">GEL COLOUR</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">Grade</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">Side Frame</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">Filler</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">FOAM Bottom (External/Internal)</th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 whitespace-nowrap">FRP coating on bottom</th>
                            </tr>
                          </thead>
                          <tbody>
                            {doorRequirements.map((req, index) => (
                              <tr key={index}>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border-r border-gray-300 text-center">
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">{index + 1}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.site_name || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.site_location || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.total_quantity || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.product_area || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.concept || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.thickness || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.core || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.frontside_design || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.backside_design || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.frontside_laminate || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.backside_laminate || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.gel_colour || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.grade || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.side_frame || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.filler || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white border-r border-gray-300">
                                  <span className="text-xs text-gray-900">{req.foam_bottom || '-'}</span>
                                </td>
                                <td className="px-2 py-2 bg-white">
                                  <span className="text-xs text-gray-900">{req.frp_coating || '-'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="sm:hidden px-4 py-2 text-xs text-gray-500 text-center bg-gray-50 border-t border-gray-200 sticky bottom-0">
                          ← Scroll horizontally to see all columns →
                        </div>
                      </div>
                    ) : (
                      <div className="border border-gray-300 rounded-md bg-gray-50 p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-gray-500">No shutter requirements specified</p>
                      </div>
                    )
                  )}
                </div>

                {/* Special Instructions */}
                <div>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <AlertCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${party.special_instructions ? 'text-amber-500' : 'text-gray-400'}`} />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Special Instructions</h3>
                  </div>
                  {isEditingClientRequirements ? (
                    <textarea
                      value={clientSpecialInstructions}
                      onChange={(e) => setClientSpecialInstructions(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[100px] sm:min-h-[120px]"
                      placeholder="Enter special instructions..."
                    />
                  ) : party.special_instructions ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                      <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap break-words">{party.special_instructions}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-500">No special instructions provided</p>
                    </div>
                  )}
                </div>

                {/* Client Requirements History Section */}
                {showClientRequirementsHistory && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Requirements Change History</h3>
                    {loadingClientRequirementsHistory ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading history...</p>
                      </div>
                    ) : clientRequirementsHistory.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        No change history available for client requirements
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {[...clientRequirementsHistory].sort((a, b) => {
                          // Sort so frame_requirements comes before door_requirements
                          if (a.field_name === 'frame_requirements' && b.field_name === 'door_requirements') return -1;
                          if (a.field_name === 'door_requirements' && b.field_name === 'frame_requirements') return 1;
                          // If both are the same type, sort by changed_at (newest first) to show most recent changes first within each group
                          if (a.field_name === b.field_name) {
                            return new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime();
                          }
                          // For other field types, maintain original order
                          return 0;
                        }).map((entry) => {
                          const isFrameRequirements = entry.field_name === 'frame_requirements';
                          const isDoorRequirements = entry.field_name === 'door_requirements';
                          const oldData = isFrameRequirements || isDoorRequirements
                            ? formatRequirementsForHistory(entry.old_value, isFrameRequirements ? 'frame' : 'door')
                            : null;
                          const newData = isFrameRequirements || isDoorRequirements
                            ? formatRequirementsForHistory(entry.new_value, isFrameRequirements ? 'frame' : 'door')
                            : null;

                          return (
                            <div key={entry.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <p className="font-semibold text-gray-900 text-lg">{getFieldLabel(entry.field_name)}</p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Changed by {entry.changed_by_username || 'Unknown'} on{' '}
                                    {new Date(entry.changed_at).toLocaleString('en-GB', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>

                              {(isFrameRequirements || isDoorRequirements) ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                  {/* Old Value Table */}
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Old Value</p>
                                    {oldData && oldData.length > 0 ? (
                                      <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                          <table className="w-full text-xs border-collapse min-w-full">
                                            <thead className="bg-gray-100 sticky top-0">
                                              <tr>
                                                {isFrameRequirements ? (
                                                  <>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">ITEM NUMBER</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">SITE NAME</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">SITE LOCATION</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">TOTAL QUANTITY</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">PRODUCT AREA</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">CONCEPT</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">FRAME DESIGN</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">WALL TYPE</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">LAMINATE</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">REBATE</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">SUB FRAME</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">CONSTRUCTION</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">COVER MOULDING</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">REMARK</th>
                                                  </>
                                                ) : (
                                                  <>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">ITEM NUMBER</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">SITE NAME</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">SITE NAME</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">TOTAL QUANTITY</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">PRODUCT AREA</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">CONCEPT</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">THICKNESS</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">DESIGN</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">LAMINATE</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">GEL COLOUR</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">Grade</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">Side Frame</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">Filler</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">FOAM Bottom (External/Internal)</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">FRP coating on bottom</th>
                                                  </>
                                                )}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {oldData.map((req: any, idx: number) => (
                                                <tr key={idx} className="border-b border-gray-200">
                                                  <td className="px-2 py-2 text-gray-600 border-r border-gray-200 text-center">{idx + 1}</td>
                                                  {isFrameRequirements ? (
                                                    <>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.site_name || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.site_location || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.total_quantity || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.product_area || req.area || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.concept || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.frame_design || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.wall_type || req.wall || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.laminate || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.rebate || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.sub_frame || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.construction || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.cover_moulding || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700">{req.remark || '-'}</td>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.site_name || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.site_name_2 || req.site_name || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.total_quantity || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.product_area || req.area || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.concept || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.thickness || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.design || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.laminate || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.gel_colour || req.gel_color || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.grade || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.side_frame || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.filler || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-gray-200">{req.foam_bottom || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700">{req.frp_coating || '-'}</td>
                                                    </>
                                                  )}
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
                                        No data
                                      </div>
                                    )}
                                  </div>

                                  {/* New Value Table */}
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">New Value</p>
                                    {newData && newData.length > 0 ? (
                                      <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                          <table className="w-full text-xs border-collapse min-w-full">
                                            <thead className="bg-green-100 sticky top-0">
                                              <tr>
                                                {isFrameRequirements ? (
                                                  <>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">ITEM NUMBER</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">SITE NAME</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">SITE LOCATION</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">TOTAL QUANTITY</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">PRODUCT AREA</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">CONCEPT</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">FRAME DESIGN</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">WALL TYPE</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">LAMINATE</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">REBATE</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">SUB FRAME</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">CONSTRUCTION</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">COVER MOULDING</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">REMARK</th>
                                                  </>
                                                ) : (
                                                  <>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">ITEM NUMBER</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">SITE NAME</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">SITE NAME</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">TOTAL QUANTITY</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">PRODUCT AREA</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">CONCEPT</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">THICKNESS</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">DESIGN</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">LAMINATE</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">GEL COLOUR</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">Grade</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">Side Frame</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">Filler</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 border-r border-green-300 whitespace-nowrap">FOAM Bottom (External/Internal)</th>
                                                    <th className="px-2 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">FRP coating on bottom</th>
                                                  </>
                                                )}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {newData.map((req: any, idx: number) => (
                                                <tr key={idx} className="border-b border-green-200">
                                                  <td className="px-2 py-2 text-gray-600 border-r border-green-200 text-center">{idx + 1}</td>
                                                  {isFrameRequirements ? (
                                                    <>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.site_name || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.site_location || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.total_quantity || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.product_area || req.area || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.concept || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.frame_design || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.wall_type || req.wall || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.laminate || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.rebate || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.sub_frame || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.construction || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.cover_moulding || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700">{req.remark || '-'}</td>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.site_name || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.site_name_2 || req.site_name || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.total_quantity || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.product_area || req.area || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.concept || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.thickness || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.design || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.laminate || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.gel_colour || req.gel_color || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.grade || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.side_frame || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.filler || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700 border-r border-green-200">{req.foam_bottom || '-'}</td>
                                                      <td className="px-2 py-2 text-gray-700">{req.frp_coating || '-'}</td>
                                                    </>
                                                  )}
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center text-sm text-gray-500">
                                        No data
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Old Value</p>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                        {entry.old_value && entry.old_value !== 'null' && entry.old_value !== 'None'
                                          ? entry.old_value
                                          : '-'}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">New Value</p>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                      <p className="text-sm text-gray-900 font-medium whitespace-pre-wrap break-words">
                                        {entry.new_value && entry.new_value !== 'null' && entry.new_value !== 'None'
                                          ? entry.new_value
                                          : '-'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {entry.change_reason && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <p className="text-xs font-medium text-gray-500 mb-1">Reason</p>
                                  <p className="text-sm text-gray-700">{entry.change_reason}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Additional Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {party.customer_category && (
                  <div>
                    <p className="text-sm text-gray-500">Customer Category</p>
                    <p className="text-lg font-semibold text-gray-900">{party.customer_category}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(party.created_at).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
                {party.created_by_username && (
                  <div>
                    <p className="text-sm text-gray-500">Created By</p>
                    <p className="text-lg font-semibold text-gray-900">{party.created_by_username}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Measurements Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Measurements</h2>
                  <p className="text-sm text-gray-600 mt-1">All measurements related to this party</p>
                </div>
                <Link
                  to={`/measurements/create?party_id=${party.id}`}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Create Measurement
                </Link>
              </div>
            </div>
            <div className="p-6">
              {loadingMeasurements ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading measurements...</p>
                </div>
              ) : measurements.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No measurements found for this party</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Measurement Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thickness
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Site Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {measurements.map((measurement) => (
                        <tr key={measurement.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {measurement.measurement_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {getMeasurementTypeLabel(measurement.measurement_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {measurement.thickness || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {measurement.site_location || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              {getItemsCount(measurement.items)} items
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(measurement.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              to={`/measurements/${measurement.id}`}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              title="View measurement details"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Production Papers Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Production Papers</h2>
                  <p className="text-sm text-gray-600 mt-1">All production papers related to this party</p>
                </div>
                <Link
                  to={`/production-papers/create?party_id=${party.id}`}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Create Production Paper
                </Link>
              </div>
            </div>
            <div className="p-6">
              {loadingPapers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading production papers...</p>
                </div>
              ) : productionPapers.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No production papers found for this party</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paper Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Measurement
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productionPapers.map((paper) => (
                        <tr key={paper.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {paper.paper_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {paper.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {paper.measurement?.measurement_number || paper.measurement_id ? (
                              <span className="text-gray-900">
                                {paper.measurement?.measurement_number || `Measurement ID: ${paper.measurement_id}`}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(paper.status)}`}>
                              {paper.status || 'draft'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {paper.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(paper.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              to={`/production-papers/${paper.id}`}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              title="View production paper details"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Raw Material Requirements Section */}
          <div className="bg-white rounded-lg shadow mt-6 mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Raw materials requirements</h2>
              <p className="text-sm text-gray-600 mt-1">Raw material details categorized by item type</p>
            </div>

            <div className="p-6 space-y-8">
              {/* Raw Material for Shutters */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                  Raw material for Shutters
                </h3>
                {productionPapers.filter(p => p.product_category === 'Shutter').length === 0 ? (
                  <p className="text-gray-500 italic text-sm">No shutter production papers found</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paper Number</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {productionPapers.filter(p => p.product_category === 'Shutter').map((paper) => (
                          <tr key={paper.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{paper.paper_number}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{paper.title || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(paper.status)}`}>
                                {paper.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(paper.created_at).toLocaleDateString('en-GB')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                to={`/raw-material/production-papers/${paper.id}/raw-material-view`}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                title="View raw material details"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Raw Material for Frames */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                  Raw material for Frames
                </h3>
                {productionPapers.filter(p => p.product_category === 'Frame').length === 0 ? (
                  <p className="text-gray-500 italic text-sm">No frame production papers found</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paper Number</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {productionPapers.filter(p => p.product_category === 'Frame').map((paper) => (
                          <tr key={paper.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{paper.paper_number}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{paper.title || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(paper.status)}`}>
                                {paper.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(paper.created_at).toLocaleDateString('en-GB')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                to={`/raw-material/production-papers/${paper.id}/raw-material-view`}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                title="View raw material details"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* View Summary Modal */}
          {showSummary && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Party Summary - {party.name}</h2>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Party Name</p>
                      <p className="text-lg font-semibold text-gray-900">{party.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Party Type</p>
                      <p className="text-lg font-semibold text-gray-900">{party.party_type || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Customer Status</p>
                      <p className="text-lg font-semibold text-gray-900">{party.customer_status || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Customer Code</p>
                      <p className="text-lg font-semibold text-gray-900">{party.customer_code || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Measurements</p>
                      <p className="text-lg font-semibold text-gray-900">{measurements.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Production Papers</p>
                      <p className="text-lg font-semibold text-gray-900">{productionPapers.length}</p>
                    </div>
                    {party.payment_terms && (
                      <div>
                        <p className="text-sm text-gray-500">Payment Terms</p>
                        <p className="text-lg font-semibold text-gray-900">{party.payment_terms}</p>
                      </div>
                    )}
                    {party.credit_limit && (
                      <div>
                        <p className="text-sm text-gray-500">Credit Limit</p>
                        <p className="text-lg font-semibold text-gray-900">{party.credit_limit}</p>
                      </div>
                    )}
                    {party.credit_days !== null && party.credit_days !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500">Credit Days</p>
                        <p className="text-lg font-semibold text-gray-900">{party.credit_days} days</p>
                      </div>
                    )}
                    {party.preferred_delivery_location && (
                      <div>
                        <p className="text-sm text-gray-500">Preferred Delivery Location</p>
                        <p className="text-lg font-semibold text-gray-900">{party.preferred_delivery_location}</p>
                      </div>
                    )}
                    {party.assigned_sales_executive && (
                      <div>
                        <p className="text-sm text-gray-500">Sales Executive</p>
                        <p className="text-lg font-semibold text-gray-900">{party.assigned_sales_executive}</p>
                      </div>
                    )}
                  </div>
                  {contactPersons.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Contact Persons</p>
                      <div className="space-y-2">
                        {contactPersons.map((contact: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded p-3">
                            <p className="font-semibold text-gray-900">{contact.name || 'N/A'}</p>
                            {contact.designation && <p className="text-sm text-gray-600">{contact.designation}</p>}
                            {contact.mobile_number && <p className="text-sm text-gray-600">Phone: {contact.mobile_number}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {officeAddress && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Office Address</p>
                      <div className="text-gray-900">
                        {officeAddress.line1 && <p>{officeAddress.line1}</p>}
                        {officeAddress.line2 && <p>{officeAddress.line2}</p>}
                        <p>
                          {officeAddress.city || party.office_city || ''}
                          {officeAddress.city && officeAddress.state && ', '}
                          {officeAddress.state || party.office_state || ''}
                          {officeAddress.pinCode && ` - ${officeAddress.pinCode}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => setShowSummary(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Production Papers Modal */}
          {showProductionPapers && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Production Papers - {party.name}</h2>
                  <button
                    onClick={() => setShowProductionPapers(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6">
                  {loadingPapers ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">Loading production papers...</p>
                    </div>
                  ) : productionPapers.length === 0 ? (
                    <div className="text-center py-8">
                      <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No production papers found for this party</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Paper Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Order Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {productionPapers.map((paper) => (
                            <tr key={paper.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {paper.paper_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {paper.title || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {paper.product_category || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {paper.order_type || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${paper.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : paper.status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                  }`}>
                                  {paper.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(paper.created_at).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Link
                                  to={`/production-papers/${paper.id}`}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => setShowProductionPapers(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal removed for testing */}
        </main>
      </div>
    </div>
  );
}
