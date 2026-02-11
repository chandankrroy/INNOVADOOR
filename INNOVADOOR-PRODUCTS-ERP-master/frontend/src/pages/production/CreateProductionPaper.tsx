import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Save, X, ChevronDown, Ruler, Trash2, CheckCircle2 } from 'lucide-react';

type Party = {
  id: number;
  name: string;
  display_name?: string | null;
};

type Measurement = {
  id: number;
  measurement_number: string;
  measurement_type?: string;
  party_name?: string;
  party_id?: number;
  measurement_date?: string | null;
  items?: any[] | string;
};

type Product = {
  id: number;
  product_code: string;
  product_category: string;
  product_type: string;
  sub_type: string | null;
  variant: string | null;
  description: string | null;
  is_active: boolean;
};

export default function CreateProductionPaper() {
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [parties, setParties] = useState<Party[]>([]);
  const [allMeasurements, setAllMeasurements] = useState<Measurement[]>([]);
  const [filteredMeasurements, setFilteredMeasurements] = useState<Measurement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [designs, setDesigns] = useState<Array<{ id: number; design_name: string; design_code: string }>>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [designSearchTerms, setDesignSearchTerms] = useState<{ frontside: string; backside: string }>({ frontside: '', backside: '' });
  const [openDesignDropdowns, setOpenDesignDropdowns] = useState<{ frontside: boolean; backside: boolean }>({ frontside: false, backside: false });
  const [formData, setFormData] = useState({
    description: '',
    party_id: searchParams.get('party_id') || '',
    measurement_id: '',
    product_category: '',
    order_type: 'Regular',
    site_name: '',
    site_location: '',
    area: '',
    concept: '',
    thickness: '',
    frontside_design: '',
    backside_design: '',
    gel_colour: '',
    laminate: '',
    remark: '',
    // Frame-specific fields
    frame_design: '',
    total_quantity: '',
    wall_type: '',
    rebate: '',
    sub_frame: '',
    construction: '',
    cover_moulding: '',
    // Shutter-specific fields
    frontside_laminate: '',
    backside_laminate: '',
    grade: '',
    side_frame: '',
    filler: '',
    foam_bottom: '',
    frp_coating: '',
    core: '',
  });
  const [generatedPaperNumber, setGeneratedPaperNumber] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMeasurementDropdownOpen, setIsMeasurementDropdownOpen] = useState(false);
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [partySearchQuery, setPartySearchQuery] = useState('');
  const [customAreaValue, setCustomAreaValue] = useState('');
  const measurementDropdownRef = useRef<HTMLDivElement>(null);
  const partyDropdownRef = useRef<HTMLDivElement>(null);
  const [showCustomInputCore, setShowCustomInputCore] = useState(false);
  const [tempCustomValueCore, setTempCustomValueCore] = useState('');
  const clientRequirementsDropdownRef = useRef<HTMLDivElement>(null);
  const partyIdFromUrl = searchParams.get('party_id');
  const [selectedMeasurementItems, _setSelectedMeasurementItems] = useState<Measurement | null>(null);
  const [selectedItemIndices, setSelectedItemIndices] = useState<number[]>([]);
  const [showMeasurementItems, _setShowMeasurementItems] = useState(false);
  const [partyClientRequirements, setPartyClientRequirements] = useState<{
    frame_requirements?: any[];
    door_requirements?: any[];
  }>({});
  const [filteredClientRequirements, setFilteredClientRequirements] = useState<any[]>([]);
  const [selectedClientRequirementIndex, setSelectedClientRequirementIndex] = useState<number | null>(null);
  const [isClientRequirementsDropdownOpen, setIsClientRequirementsDropdownOpen] = useState(false);
  const [clientRequirementsStatus, setClientRequirementsStatus] = useState<{
    frame_requirements_status: Array<{ index: number; has_production_paper: boolean; production_papers?: Array<{ id: number; paper_number: string; status: string }> }>;
    door_requirements_status: Array<{ index: number; has_production_paper: boolean; production_papers?: Array<{ id: number; paper_number: string; status: string }> }>;
  } | null>(null);
  const [showProductionPaperDialog, setShowProductionPaperDialog] = useState(false);
  const [selectedRequirementPapers, setSelectedRequirementPapers] = useState<Array<{ id: number; paper_number: string; status: string }>>([]);
  const [pendingRequirementIndex, setPendingRequirementIndex] = useState<number | null>(null);
  const [selectedTableRowIndex, setSelectedTableRowIndex] = useState<number | null>(null);

  // All Measurements View state
  const [showAllMeasurementsView, setShowAllMeasurementsView] = useState(false);
  const [allMeasurementsData, setAllMeasurementsData] = useState<any[]>([]);
  const [loadingAllMeasurements, setLoadingAllMeasurements] = useState(false);
  const [filterBldg, setFilterBldg] = useState<string>('');
  const [filterMeasurementType, setFilterMeasurementType] = useState<string>('All');
  const [filterMeasurementNumber, setFilterMeasurementNumber] = useState<string>('');
  const [filterArea, setFilterArea] = useState<string>('');
  const [selectedItemsMap, setSelectedItemsMap] = useState<{ [key: string]: boolean }>({});
  const [availableBldgs, setAvailableBldgs] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [pendingSelectedItems, setPendingSelectedItems] = useState<Array<{ measurement_id: number; item_index: number; item_type: string }> | null>(null);
  const [pendingPartyId, setPendingPartyId] = useState<string | null>(null);

  const getMeasurementTypeLabel = (type?: string): string => {
    if (!type) return '-';
    const labels: { [key: string]: string } = {
      frame_sample: 'Sample Frame',
      shutter_sample: 'Sample Shutter',
      regular_frame: 'Regular Frame',
      regular_shutter: 'Regular Shutter',
    };
    return labels[type] || type;
  };

  // Removed unused functions: getItemCount, formatDate

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (measurementDropdownRef.current && !measurementDropdownRef.current.contains(event.target as Node)) {
        setIsMeasurementDropdownOpen(false);
      }
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target as Node)) {
        setIsPartyDropdownOpen(false);
      }
      if (clientRequirementsDropdownRef.current && !clientRequirementsDropdownRef.current.contains(event.target as Node)) {
        setIsClientRequirementsDropdownOpen(false);
      }
      if (!(event.target as HTMLElement).closest('.design-dropdown-container')) {
        setOpenDesignDropdowns({ frontside: false, backside: false });
      }
    };

    if (isMeasurementDropdownOpen || isPartyDropdownOpen || isClientRequirementsDropdownOpen || openDesignDropdowns.frontside || openDesignDropdowns.backside) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMeasurementDropdownOpen, isPartyDropdownOpen, isClientRequirementsDropdownOpen, openDesignDropdowns]);

  useEffect(() => {
    loadOptions();
    loadDesigns();
  }, []);

  // Handle navigation state from All Measurements modal
  useEffect(() => {
    if (location.state?.fromAllMeasurements && location.state?.selectedItems) {
      const { selectedItems, partyId, productCategory } = location.state;



      // Set party if provided
      if (partyId) {
        setFormData(prev => ({ ...prev, party_id: partyId }));
        const party = parties.find(p => p.id === parseInt(partyId));
        if (party) {
          setPartySearchQuery(party.display_name || party.name);
        }
      }

      // Set product category if provided
      if (productCategory) {
        setFormData(prev => ({ ...prev, product_category: productCategory }));
      }

      // Store selected items in React state to restore after measurements load
      if (selectedItems && selectedItems.length > 0) {
        setPendingSelectedItems(selectedItems);
        setPendingPartyId(partyId || null);

      }

      // Clear the navigation state to prevent re-processing
      window.history.replaceState({}, document.title);
    }
  }, [location.state, parties]);

  // Auto-select party when party_id is in URL (backup to loadOptions)
  useEffect(() => {
    if (partyIdFromUrl && parties.length > 0 && !formData.party_id) {
      const party = parties.find(p => p.id === parseInt(partyIdFromUrl));
      if (party) {
        setFormData(prev => ({ ...prev, party_id: partyIdFromUrl }));
        setPartySearchQuery(party.display_name || party.name);
      }
    }
  }, [partyIdFromUrl, parties]);

  useEffect(() => {
    if (formData.product_category) {
      loadNextPaperNumber(formData.product_category);
      loadProducts(formData.product_category);
    } else {
      setProducts([]);
      setFormData(prev => ({ ...prev, concept: '' }));
    }
    // Clear client requirement selection when category changes
    setSelectedClientRequirementIndex(null);
  }, [formData.product_category]);

  useEffect(() => {
    if (formData.party_id && allMeasurements.length > 0) {
      filterMeasurementsByParty(parseInt(formData.party_id));
      // Update search query when party is selected
      const selected = parties.find(p => p.id === parseInt(formData.party_id));
      if (selected) {
        setPartySearchQuery(selected.display_name || selected.name);
      }
    } else if (!formData.party_id) {
      setFilteredMeasurements([]);
      setFormData(prev => ({ ...prev, measurement_id: '' }));
      setPartySearchQuery('');
    } else if (formData.party_id && allMeasurements.length === 0) {
      // If party is selected but measurements aren't loaded yet, clear filtered measurements
      setFilteredMeasurements([]);
    }
  }, [formData.party_id, parties, allMeasurements]);

  // Load client requirements when party is selected
  useEffect(() => {
    if (formData.party_id) {
      loadPartyClientRequirements(parseInt(formData.party_id));
      // Reset selection when party changes
      setSelectedClientRequirementIndex(null);
      // Clear prefilled fields when party changes (optional - user might want to keep them)
      // Commenting out to allow user to keep prefilled data if they change party
      // setFormData(prev => ({
      //   ...prev,
      //   site_name: '',
      //   site_location: '',
      //   area: '',
      //   concept: '',
      //   thickness: '',
      //   design: '',
      //   gel_colour: '',
      //   laminate: '',
      // }));
    } else {
      setPartyClientRequirements({});
      setFilteredClientRequirements([]);
      setSelectedClientRequirementIndex(null);
    }
  }, [formData.party_id]);

  // Filter client requirements when product category changes or requirements are loaded
  useEffect(() => {
    filterClientRequirementsByCategory();
    // Reset selection when category changes
    setSelectedClientRequirementIndex(null);
  }, [formData.product_category, partyClientRequirements]);

  // Load all measurements when All Measurements View is opened
  useEffect(() => {
    if (showAllMeasurementsView) {
      loadAllMeasurements();
    } else {
      // Reset data when modal is closed
      setAllMeasurementsData([]);
      setAvailableBldgs([]);
      setAvailableAreas([]);
      setSelectedItemsMap({});
    }
  }, [showAllMeasurementsView, formData.party_id]);

  // Auto-match building/wing when measurements are loaded
  useEffect(() => {
    if (showAllMeasurementsView && availableBldgs.length > 0 && formData.site_location && !filterBldg) {
      const locationUpper = formData.site_location.toUpperCase().trim();
      const matched = availableBldgs.find(b => {
        const bUpper = b.toUpperCase().trim();
        return bUpper === locationUpper ||
          locationUpper.includes(bUpper) ||
          bUpper.includes(locationUpper);
      });
      if (matched) {
        setFilterBldg(matched);
      }
    }
  }, [availableBldgs, showAllMeasurementsView, formData.site_location]);

  // Restore selected items after measurements are loaded
  useEffect(() => {
    if (pendingSelectedItems && pendingSelectedItems.length > 0 && allMeasurementsData.length > 0) {
      console.log('Attempting to restore selected items:', {
        pendingItemsCount: pendingSelectedItems.length,
        measurementsLoaded: allMeasurementsData.length,
        pendingPartyId,
        currentPartyId: formData.party_id
      });

      // Check if party matches (or if no party was specified, proceed anyway)
      const shouldRestore = !pendingPartyId || formData.party_id === pendingPartyId;

      if (shouldRestore) {
        // Find items in loaded measurements and restore selection
        const restoredMap: { [key: string]: boolean } = {};

        allMeasurementsData.forEach((measurement: any) => {
          if (Array.isArray(measurement.items)) {
            measurement.items.forEach((item: any, index: number) => {
              const matchingItem = pendingSelectedItems.find((pi: any) =>
                pi.measurement_id === measurement.id &&
                pi.item_index === index
              );

              if (matchingItem && item.bldg) {
                const itemType = matchingItem.item_type || (measurement.measurement_type?.includes('frame') ? 'frame' : 'shutter');
                const key = getItemKey(item.bldg, measurement.id, index, itemType as "frame" | "shutter");
                restoredMap[key] = true;
              }
            });
          }
        });

        if (Object.keys(restoredMap).length > 0) {
          console.log('Restored', Object.keys(restoredMap).length, 'selected items');
          setSelectedItemsMap(restoredMap);
          // Open the All Measurements view to show selections
          setShowAllMeasurementsView(true);
          // Clear pending items after successful restoration
          setPendingSelectedItems(null);
          setPendingPartyId(null);
        } else {
          console.warn('No items were restored. Check if measurement IDs and item indices match.');
        }
      } else {
        console.log('Party ID mismatch, waiting for correct party to be selected');
      }
    }
  }, [allMeasurementsData, formData.party_id, pendingSelectedItems, pendingPartyId]);

  const loadNextPaperNumber = async (productCategory?: string) => {
    try {
      const url = productCategory
        ? `/production/production-papers/next-number?product_category=${encodeURIComponent(productCategory)}`
        : '/production/production-papers/next-number';
      const data = await api.get(url, true);
      setGeneratedPaperNumber(data.next_paper_number);
    } catch (err: any) {
      console.error('Failed to load next paper number:', err);
      setGeneratedPaperNumber('P0001');
    }
  };

  const loadProducts = async (category: string) => {
    try {
      const data = await api.get(`/production/products?category=${encodeURIComponent(category)}`, true);
      setProducts(data || []);
      // Reset concept if current value is not in the new filtered list
      if (formData.concept) {
        const productTypes = (data || []).map((p: Product) => p.product_type);
        if (!productTypes.includes(formData.concept)) {
          setFormData(prev => ({ ...prev, concept: '' }));
        }
      }
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setProducts([]);
    }
  };

  const loadDesigns = async () => {
    try {
      setLoadingDesigns(true);
      const designsData = await api.get('/production/designs?is_active=true', true);
      setDesigns(designsData.map((d: any) => ({ id: d.id, design_name: d.design_name, design_code: d.design_code })));
    } catch (err) {
      console.error('Failed to load designs:', err);
      setDesigns([]);
    } finally {
      setLoadingDesigns(false);
    }
  };

  // Helper function to filter designs based on search term
  const getFilteredDesigns = (searchTerm: string, includeSameAsFront: boolean = false) => {
    const term = searchTerm.toLowerCase();
    const filtered = designs.filter(design =>
      design.design_name.toLowerCase().includes(term) ||
      design.design_code.toLowerCase().includes(term)
    );

    if (includeSameAsFront && 'same as front'.includes(term)) {
      return [{ id: -1, design_name: 'same as front', design_code: '' }, ...filtered];
    }

    return filtered;
  };

  const loadAllMeasurements = async () => {
    try {
      setLoadingAllMeasurements(true);
      let measurementsData: any[] = [];

      if (formData.party_id) {
        // Load measurements filtered by party
        const data = await api.get(`/production/measurements?limit=1000`, true);
        measurementsData = (data || []).filter((m: any) =>
          m.party_id === parseInt(formData.party_id) &&
          m.party_id !== null &&
          !m.is_deleted
        );
      } else {
        // Load all measurements
        const data = await api.get('/production/measurements?limit=1000', true);
        measurementsData = (data || []).filter((m: any) => !m.is_deleted);
      }

      // Parse items for each measurement
      const measurementsWithParsedItems = measurementsData.map((measurement: any) => {
        let items: any[] = [];
        try {
          if (Array.isArray(measurement.items)) {
            items = measurement.items;
          } else if (typeof measurement.items === 'string') {
            items = JSON.parse(measurement.items || '[]');
          }
        } catch (e) {
          console.error('Error parsing measurement items:', e);
          items = [];
        }
        return { ...measurement, items };
      });

      setAllMeasurementsData(measurementsWithParsedItems);

      // Extract unique BLDG values and Areas
      const bldgs = new Set<string>();
      const areas = new Set<string>();
      measurementsWithParsedItems.forEach((measurement: any) => {
        if (Array.isArray(measurement.items)) {
          measurement.items.forEach((item: any) => {
            if (item.bldg) {
              bldgs.add(item.bldg);
            }
            const itemArea = item.product_area || item.area;
            if (itemArea) {
              areas.add(itemArea);
            }
          });
        }
      });
      setAvailableBldgs(Array.from(bldgs).sort());
      setAvailableAreas(Array.from(areas).sort());
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Failed to load all measurements:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load measurements';
      setError(errorMessage);
      setAllMeasurementsData([]);
      setAvailableBldgs([]);
      setAvailableAreas([]);
    } finally {
      setLoadingAllMeasurements(false);
    }
  };


  const loadOptions = async () => {
    try {
      // Load parties
      const partiesData = await api.get('/production/parties?limit=1000', true);
      const partiesList = partiesData || [];
      setParties(partiesList);

      // Load measurements
      const measurementsData = await api.get('/production/measurements?limit=1000', true);
      setAllMeasurements(measurementsData || []);

      // If party_id is in URL, set it and filter measurements
      if (partyIdFromUrl) {
        setFormData(prev => ({ ...prev, party_id: partyIdFromUrl }));
        filterMeasurementsByParty(parseInt(partyIdFromUrl));
        // Set search query to show selected party name
        const selectedPartyFromUrl = partiesList.find((p: Party) => p.id === parseInt(partyIdFromUrl));
        if (selectedPartyFromUrl) {
          setPartySearchQuery(selectedPartyFromUrl.display_name || selectedPartyFromUrl.name);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load options');
    }
  };

  const filterMeasurementsByParty = (partyId: number) => {
    if (!allMeasurements || allMeasurements.length === 0) {
      setFilteredMeasurements([]);
      return;
    }
    // Filter measurements by party_id, excluding deleted ones and null party_ids
    const filtered = allMeasurements.filter(m =>
      m.party_id === partyId &&
      m.party_id !== null &&
      m.party_id !== undefined &&
      !(m as any).is_deleted
    );
    setFilteredMeasurements(filtered);
  };

  // Removed unused function: loadMeasurementDetails

  const loadPartyClientRequirements = async (partyId: number) => {
    try {
      const party = await api.get(`/production/parties/${partyId}`, true);

      // Parse frame_requirements and door_requirements
      let frameRequirements: any[] = [];
      let doorRequirements: any[] = [];

      if (party.frame_requirements) {
        if (typeof party.frame_requirements === 'string') {
          try {
            frameRequirements = JSON.parse(party.frame_requirements);
          } catch (e) {
            console.error('Error parsing frame_requirements:', e);
            frameRequirements = [];
          }
        } else if (Array.isArray(party.frame_requirements)) {
          frameRequirements = party.frame_requirements;
        }
      }

      if (party.door_requirements) {
        if (typeof party.door_requirements === 'string') {
          try {
            doorRequirements = JSON.parse(party.door_requirements);
          } catch (e) {
            console.error('Error parsing door_requirements:', e);
            doorRequirements = [];
          }
        } else if (Array.isArray(party.door_requirements)) {
          doorRequirements = party.door_requirements;
        }
      }

      setPartyClientRequirements({
        frame_requirements: frameRequirements,
        door_requirements: doorRequirements
      });

      // Load client requirements status (which have production papers)
      await loadClientRequirementsStatus(partyId);
    } catch (err: any) {
      console.error('Failed to load party client requirements:', err);
      setPartyClientRequirements({});
      setClientRequirementsStatus(null);
    }
  };

  const loadClientRequirementsStatus = async (partyId: number) => {
    try {
      const status = await api.get(`/production/parties/${partyId}/client-requirements-status`, true);
      setClientRequirementsStatus(status);
    } catch (err: any) {
      console.error('Failed to load client requirements status:', err);
      setClientRequirementsStatus(null);
    }
  };

  const filterClientRequirementsByCategory = () => {
    if (!formData.product_category) {
      setFilteredClientRequirements([]);
      return;
    }

    if (formData.product_category === 'Frame') {
      setFilteredClientRequirements(partyClientRequirements.frame_requirements || []);
    } else if (formData.product_category === 'Shutter') {
      setFilteredClientRequirements(partyClientRequirements.door_requirements || []);
    } else {
      setFilteredClientRequirements([]);
    }
  };

  const handleCoreSelect = (value: string) => {
    if (value === 'custom') {
      setShowCustomInputCore(true);
      setTempCustomValueCore('');
      setFormData(prev => ({ ...prev, core: '' }));
    } else {
      setShowCustomInputCore(false);
      setFormData(prev => ({ ...prev, core: value }));
    }
  };

  const handleCoreSubmit = () => {
    if (tempCustomValueCore.trim()) {
      setFormData(prev => ({ ...prev, core: tempCustomValueCore.trim() }));
      setShowCustomInputCore(false);
    }
  };

  const handleCoreCancel = () => {
    setShowCustomInputCore(false);
    setFormData(prev => ({ ...prev, core: 'D/C' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_category) {
      setError('Product Category is required');
      return;
    }

    if (!formData.party_id) {
      setError('Party is required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const paperData: any = {
        product_category: formData.product_category,
        order_type: formData.order_type,
        status: 'draft', // Default status
        description: formData.description || null,
        site_name: formData.site_name || null,
        site_location: formData.site_location || null,
        area: formData.area || null,
        concept: formData.concept || null,
        thickness: formData.thickness || null,
        frontside_design: formData.frontside_design || null,
        backside_design: formData.backside_design || null,
        gel_colour: formData.gel_colour || null,
        laminate: formData.laminate || null,
        remark: formData.remark || null,
        // Common fields
        total_quantity: formData.total_quantity || null,
        // Frame-specific fields
        wall_type: formData.wall_type || null,
        rebate: formData.rebate || null,
        sub_frame: formData.sub_frame || null,
        construction: formData.construction || null,
        cover_moulding: formData.cover_moulding || null,
        // Shutter-specific fields
        frontside_laminate: formData.frontside_laminate || null,
        backside_laminate: formData.backside_laminate || null,
        grade: formData.grade || null,
        side_frame: formData.side_frame || null,
        filler: formData.filler || null,
        foam_bottom: formData.foam_bottom || null,
        frp_coating: formData.frp_coating || null,
      };

      // Party is now required
      paperData.party_id = parseInt(formData.party_id);

      // Handle selected measurement items
      // Priority: All Measurements View selection > Pending items from navigation > Single measurement selection
      let selectedItems: Array<{ measurement_id: number; item_index: number; item_type: string }> | number[] | null = null;

      if (Object.keys(selectedItemsMap).length > 0) {
        // Format for multiple measurements from "All Measurements View"
        selectedItems = Object.keys(selectedItemsMap)
          .filter(key => selectedItemsMap[key])
          .map(key => {
            const [_bldg, measurementId, itemIndex, itemType] = key.split('-');
            return {
              measurement_id: parseInt(measurementId),
              item_index: parseInt(itemIndex),
              item_type: itemType
            };
          });
        console.log('Using selectedItemsMap:', selectedItems.length, 'items');
      } else if (pendingSelectedItems && pendingSelectedItems.length > 0) {
        // Use pending items from navigation state if selectedItemsMap is empty
        selectedItems = pendingSelectedItems;
        console.log('Using pendingSelectedItems from navigation state:', selectedItems.length, 'items');
      } else if (formData.measurement_id && selectedItemIndices.length > 0) {
        // Single measurement with selected indices
        selectedItems = selectedItemIndices;
        console.log('Using selectedItemIndices:', selectedItems.length, 'items');
      } else if (formData.measurement_id) {
        // Single measurement selected but no items selected - include all items
        selectedItems = null;
        console.log('No items selected, will include all items from measurement');
      }

      // Set selected_measurement_items and measurement_id
      if (selectedItems) {
        paperData.selected_measurement_items = selectedItems;
        // If items are selected, set measurement_id to the first one
        if (Array.isArray(selectedItems) && selectedItems.length > 0) {
          if (typeof selectedItems[0] === 'object' && 'measurement_id' in selectedItems[0]) {
            paperData.measurement_id = (selectedItems[0] as any).measurement_id;
          } else if (formData.measurement_id) {
            paperData.measurement_id = parseInt(formData.measurement_id);
          }
        }
        console.log('Final paperData.selected_measurement_items:', paperData.selected_measurement_items);
      } else if (formData.measurement_id) {
        paperData.measurement_id = parseInt(formData.measurement_id);
        paperData.selected_measurement_items = null;
        console.log('No items selected, using measurement_id only:', paperData.measurement_id);
      } else {
        // No items and no measurement_id - this is an error
        setError('Measurement is required. Please select a measurement or items from "All Measurements" view.');
        setIsLoading(false);
        return;
      }

      // Final validation: Ensure we have either selected items or measurement_id
      if (!paperData.selected_measurement_items && !paperData.measurement_id) {
        setError('Measurement is required. Please select a measurement or items.');
        setIsLoading(false);
        return;
      }

      // Handle client requirement reference if a client requirement was selected
      if (selectedClientRequirementIndex !== null && filteredClientRequirements.length > 0) {
        const requirementType = formData.product_category === 'Frame' ? 'frame' : 'door';
        paperData.client_requirement_type = requirementType;
        paperData.client_requirement_index = selectedClientRequirementIndex;
      }

      // Log final data being sent
      console.log('Submitting production paper with:', {
        selected_measurement_items: paperData.selected_measurement_items,
        measurement_id: paperData.measurement_id,
        selectedItemsCount: Array.isArray(paperData.selected_measurement_items) ? paperData.selected_measurement_items.length : 0,
        client_requirement_type: paperData.client_requirement_type,
        client_requirement_index: paperData.client_requirement_index
      });

      await api.post('/production/production-papers', paperData, true);

      // Refresh client requirements status if a client requirement was used
      if (formData.party_id && selectedClientRequirementIndex !== null) {
        await loadClientRequirementsStatus(parseInt(formData.party_id));
      }

      alert('Production paper created successfully');

      // Redirect to party details page
      navigate(`/parties/${formData.party_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create production paper');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedParty = parties.find(p => p.id === parseInt(formData.party_id || '0'));
  const selectedMeasurement = filteredMeasurements.find(m => m.id === parseInt(formData.measurement_id || '0'));

  // Handlers for measurement item selection
  const handleSelectMeasurementItem = (index: number) => {
    setSelectedItemIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleSelectAllMeasurementItems = () => {
    if (!selectedMeasurementItems || !selectedMeasurementItems.items) return;
    const items = Array.isArray(selectedMeasurementItems.items) ? selectedMeasurementItems.items : [];
    if (selectedItemIndices.length === items.length) {
      setSelectedItemIndices([]);
    } else {
      setSelectedItemIndices(items.map((_, index) => index));
    }
  };

  // Handler for client requirement selection and prefill
  const handleClientRequirementSelect = (index: number) => {
    // Check if this requirement has a production paper
    const requirementType = formData.product_category === 'Frame' ? 'frame' : 'door';
    const statusArray = requirementType === 'frame'
      ? clientRequirementsStatus?.frame_requirements_status
      : clientRequirementsStatus?.door_requirements_status;
    const requirementStatus = statusArray?.find(
      (status: { index: number; has_production_paper: boolean; production_papers?: Array<{ id: number; paper_number: string; status: string }> }) =>
        status.index === index
    );
    const hasProductionPaper = requirementStatus?.has_production_paper || false;
    const productionPapers = requirementStatus?.production_papers || [];

    // If requirement has production papers, show dialog
    if (hasProductionPaper && productionPapers.length > 0) {
      setSelectedRequirementPapers(productionPapers);
      setPendingRequirementIndex(index);
      setShowProductionPaperDialog(true);
      setIsClientRequirementsDropdownOpen(false);
      return;
    }

    // Otherwise, proceed with normal selection
    proceedWithRequirementSelection(index);
  };

  const proceedWithRequirementSelection = (index: number) => {
    setSelectedClientRequirementIndex(index);
    setSelectedTableRowIndex(index);

    const selectedItem = filteredClientRequirements[index];
    if (!selectedItem) return;

    // Helper to get value case-insensitively and handle spaces
    const getValue = (item: any, key: string) => {
      if (item[key] !== undefined && item[key] !== null) return item[key];
      // Try capitalized version
      const capKey = key.charAt(0).toUpperCase() + key.slice(1);
      if (item[capKey] !== undefined && item[capKey] !== null) return item[capKey];
      // Try all caps
      const upperKey = key.toUpperCase();
      if (item[upperKey] !== undefined && item[upperKey] !== null) return item[upperKey];
      // Try all caps with spaces instead of underscores (matches UI headers sometimes used as keys)
      const spaceKey = key.toUpperCase().replace(/_/g, ' ');
      if (item[spaceKey] !== undefined && item[spaceKey] !== null) return item[spaceKey];
      return undefined;
    };

    // Prefill form fields based on product category
    if (formData.product_category === 'Frame') {
      // Frame requirements structure - map ALL available fields
      setFormData(prev => ({
        ...prev,
        site_name: getValue(selectedItem, 'site_name') || prev.site_name,
        site_location: getValue(selectedItem, 'site_location') || prev.site_location,
        total_quantity: getValue(selectedItem, 'total_quantity') || prev.total_quantity,
        area: getValue(selectedItem, 'product_area') || getValue(selectedItem, 'area') || prev.area,
        concept: getValue(selectedItem, 'concept') || prev.concept,
        frame_design: getValue(selectedItem, 'frame_design') || prev.frame_design,
        wall_type: getValue(selectedItem, 'wall_type') || prev.wall_type,
        laminate: getValue(selectedItem, 'laminate') || prev.laminate,
        rebate: getValue(selectedItem, 'rebate') || prev.rebate,
        sub_frame: getValue(selectedItem, 'sub_frame') || prev.sub_frame,
        construction: getValue(selectedItem, 'construction') || prev.construction,
        cover_moulding: getValue(selectedItem, 'cover_moulding') || prev.cover_moulding,
        remark: getValue(selectedItem, 'remark') || prev.remark,
      }));
    } else if (formData.product_category === 'Shutter') {
      // Door/Shutter requirements structure - map ALL available fields
      const fsDesign = getValue(selectedItem, 'frontside_design') || getValue(selectedItem, 'design');
      const bsDesign = getValue(selectedItem, 'backside_design') || (getValue(selectedItem, 'design') ? 'same as front' : undefined);

      setFormData(prev => ({
        ...prev,
        site_name: getValue(selectedItem, 'site_name') || prev.site_name,
        site_location: getValue(selectedItem, 'site_name_2') || getValue(selectedItem, 'site_location') || prev.site_location,
        total_quantity: getValue(selectedItem, 'total_quantity') || prev.total_quantity,
        area: getValue(selectedItem, 'product_area') || getValue(selectedItem, 'area') || prev.area,
        concept: getValue(selectedItem, 'concept') || prev.concept,
        thickness: getValue(selectedItem, 'thickness') || prev.thickness,
        frontside_design: fsDesign || prev.frontside_design,
        backside_design: bsDesign || prev.backside_design,
        laminate: getValue(selectedItem, 'laminate') || getValue(selectedItem, 'frontside_laminate') || prev.laminate,
        frontside_laminate: getValue(selectedItem, 'frontside_laminate') || getValue(selectedItem, 'laminate') || prev.frontside_laminate,
        backside_laminate: getValue(selectedItem, 'backside_laminate') || (getValue(selectedItem, 'laminate') ? 'same as front' : prev.backside_laminate),
        gel_colour: getValue(selectedItem, 'gel_colour') || prev.gel_colour,
        grade: getValue(selectedItem, 'grade') || prev.grade,
        side_frame: getValue(selectedItem, 'side_frame') || prev.side_frame,
        filler: getValue(selectedItem, 'filler') || prev.filler,
        foam_bottom: getValue(selectedItem, 'foam_bottom') || getValue(selectedItem, 'foam_bottom_external_internal') || prev.foam_bottom,
        frp_coating: getValue(selectedItem, 'frp_coating') || getValue(selectedItem, 'frp_coating_on_bottom') || prev.frp_coating,
        core: getValue(selectedItem, 'core') || prev.core,
        remark: getValue(selectedItem, 'remark') || prev.remark,
      }));

      // Update design search terms to ensure the UI shows the prefilled values and doesn't shadow them with empty defaults
      setDesignSearchTerms(prev => ({
        ...prev,
        frontside: fsDesign || prev.frontside,
        backside: bsDesign || prev.backside
      }));
    }
  };

  // Handler for table row selection
  const handleTableRowSelect = (index: number) => {
    // Use the same logic as handleClientRequirementSelect
    handleClientRequirementSelect(index);
  };

  // Filter parties based on search query
  const filteredParties = parties.filter(party => {
    if (!partySearchQuery.trim()) return true;
    const searchLower = partySearchQuery.toLowerCase();
    const name = (party.name || '').toLowerCase();
    const displayName = (party.display_name || '').toLowerCase();
    return name.includes(searchLower) || displayName.includes(searchLower);
  });

  // Get selected items count
  const getSelectedItemsCount = (): number => {
    return Object.keys(selectedItemsMap).filter(key => selectedItemsMap[key]).length;
  };

  // Handle Continue with Production button click
  const handleContinueWithProduction = () => {
    const selectedCount = getSelectedItemsCount();
    if (selectedCount === 0) {
      return; // Button should be disabled, but safety check
    }

    // Extract selected items
    const selectedItems = Object.keys(selectedItemsMap)
      .filter(key => selectedItemsMap[key])
      .map(key => {
        const [_bldg, measurementId, itemIndex, itemType] = key.split('-');
        return {
          measurement_id: parseInt(measurementId),
          item_index: parseInt(itemIndex),
          item_type: itemType
        };
      });

    // Determine product category based on selected items
    const frameItems = selectedItems.filter(item => item.item_type === 'frame');
    const shutterItems = selectedItems.filter(item => item.item_type === 'shutter');

    let productCategory = '';
    if (frameItems.length > 0 && shutterItems.length === 0) {
      productCategory = 'Frame';
    } else if (shutterItems.length > 0 && frameItems.length === 0) {
      productCategory = 'Shutter';
    } else if (frameItems.length > 0 && shutterItems.length > 0) {
      // Mixed selection - default to Frame or prompt user
      // For now, default to Frame
      productCategory = 'Frame';
    }

    // Get party ID from form or selected party
    const partyId = formData.party_id || (selectedParty ? selectedParty.id.toString() : '');

    // Close modal and reset filters
    setShowAllMeasurementsView(false);
    setFilterBldg('');
    setFilterMeasurementType('All');
    setFilterMeasurementNumber('');
    setFilterArea('');

    // Navigate to production paper creation with state
    navigate('/production-papers/create', {
      state: {
        selectedItems: selectedItems,
        partyId: partyId,
        productCategory: productCategory,
        fromAllMeasurements: true
      }
    });
  };

  // Filter and process measurements for display
  const processMeasurementsForDisplay = () => {
    if (!allMeasurementsData || allMeasurementsData.length === 0) {
      return { groupedData: {}, frameItems: [], shutterItems: [] };
    }

    try {
      let filteredMeasurements = allMeasurementsData;

      // Filter by measurement number
      if (filterMeasurementNumber) {
        filteredMeasurements = filteredMeasurements.filter(m =>
          m.measurement_number?.toLowerCase().includes(filterMeasurementNumber.toLowerCase())
        );
      }

      // Collect all frame and shutter items
      const allFrameItems: any[] = [];
      const allShutterItems: any[] = [];

      filteredMeasurements.forEach((measurement: any) => {
        if (!Array.isArray(measurement.items)) return;

        measurement.items.forEach((item: any, index: number) => {
          const itemWithMeta = {
            ...item,
            _measurement_id: measurement.id,
            _measurement_number: measurement.measurement_number,
            _measurement_date: measurement.measurement_date,
            _measurement_type: measurement.measurement_type,
            _item_index: index
          };

          if (measurement.measurement_type === 'frame_sample' || measurement.measurement_type === 'regular_frame') {
            allFrameItems.push(itemWithMeta);
          } else if (measurement.measurement_type === 'shutter_sample' || measurement.measurement_type === 'regular_shutter') {
            allShutterItems.push(itemWithMeta);
          }
        });
      });

      // Filter by measurement type
      let frameItems = allFrameItems;
      let shutterItems = allShutterItems;
      if (filterMeasurementType === 'Frame') {
        shutterItems = [];
      } else if (filterMeasurementType === 'Shutter') {
        frameItems = [];
      }

      // Filter by area
      if (filterArea && filterArea !== 'All' && filterArea !== '') {
        frameItems = frameItems.filter(item => {
          const itemArea = item.product_area || item.area;
          return itemArea === filterArea;
        });
        shutterItems = shutterItems.filter(item => {
          const itemArea = item.product_area || item.area;
          return itemArea === filterArea;
        });
      }

      // Get all unique BLDGs
      const allBldgs = new Set<string>();
      frameItems.forEach(item => {
        if (item.bldg) allBldgs.add(item.bldg);
      });
      shutterItems.forEach(item => {
        if (item.bldg) allBldgs.add(item.bldg);
      });

      // Filter by BLDG
      let filteredBldgs = Array.from(allBldgs).sort();
      if (filterBldg && filterBldg !== 'All') {
        filteredBldgs = filteredBldgs.filter(b => b === filterBldg);
      }

      // Group by BLDG
      const groupedData: { [bldg: string]: { frame: any[]; shutter: any[] } } = {};
      filteredBldgs.forEach(bldg => {
        groupedData[bldg] = {
          frame: frameItems.filter(item => (item.bldg || 'Unknown') === bldg),
          shutter: shutterItems.filter(item => (item.bldg || 'Unknown') === bldg)
        };
      });

      return { groupedData, frameItems, shutterItems };
    } catch (error) {
      console.error('Error in processMeasurementsForDisplay:', error);
      return { groupedData: {}, frameItems: [], shutterItems: [] };
    }
  };

  // Process measurements when view is shown
  let processedMeasurements: { groupedData: { [bldg: string]: { frame: any[]; shutter: any[] } }; frameItems: any[]; shutterItems: any[] } | null = null;

  if (showAllMeasurementsView) {
    try {
      processedMeasurements = processMeasurementsForDisplay();
    } catch (error) {
      console.error('Error processing measurements:', error);
      processedMeasurements = { groupedData: {}, frameItems: [], shutterItems: [] };
    }
  }

  // Get selected client requirement item for display
  const selectedClientRequirement = selectedClientRequirementIndex !== null
    ? filteredClientRequirements[selectedClientRequirementIndex]
    : null;

  // Helper function to format client requirement display label
  const getClientRequirementLabel = (item: any): string => {
    if (formData.product_category === 'Frame') {
      return `${item.site_name || 'N/A'} - ${item.product_area || 'N/A'} - ${item.concept || 'N/A'}`;
    } else if (formData.product_category === 'Shutter') {
      return `${item.site_name || 'N/A'} - ${item.product_area || 'N/A'} - ${item.concept || 'N/A'}`;
    }
    return 'N/A';
  };

  // Selection handlers for All Measurements View
  const getItemKey = (bldg: string, measurementId: number, itemIndex: number, itemType: 'frame' | 'shutter'): string => {
    return `${bldg}-${measurementId}-${itemIndex}-${itemType}`;
  };

  const handleSelectItem = (bldg: string, measurementId: number, itemIndex: number, itemType: 'frame' | 'shutter') => {
    const key = getItemKey(bldg, measurementId, itemIndex, itemType);
    setSelectedItemsMap(prev => {
      const newMap = { ...prev };
      if (newMap[key]) {
        delete newMap[key];
      } else {
        newMap[key] = true;
      }
      return newMap;
    });
  };

  const handleSelectAllInBldg = (bldg: string, frameItems: any[], shutterItems: any[]) => {
    const allKeys: string[] = [];
    frameItems.forEach(item => {
      allKeys.push(getItemKey(bldg, item._measurement_id, item._item_index, 'frame'));
    });
    shutterItems.forEach(item => {
      allKeys.push(getItemKey(bldg, item._measurement_id, item._item_index, 'shutter'));
    });

    const allSelected = allKeys.every(key => selectedItemsMap[key]);

    setSelectedItemsMap(prev => {
      const newMap = { ...prev };
      if (allSelected) {
        allKeys.forEach(key => delete newMap[key]);
      } else {
        allKeys.forEach(key => newMap[key] = true);
      }
      return newMap;
    });
  };

  const handleSelectAll = (filteredItems: { frame: any[]; shutter: any[] }) => {
    const allKeys: string[] = [];
    filteredItems.frame.forEach(item => {
      if (item.bldg) {
        allKeys.push(getItemKey(item.bldg, item._measurement_id, item._item_index, 'frame'));
      }
    });
    filteredItems.shutter.forEach(item => {
      if (item.bldg) {
        allKeys.push(getItemKey(item.bldg, item._measurement_id, item._item_index, 'shutter'));
      }
    });

    const allSelected = allKeys.length > 0 && allKeys.every(key => selectedItemsMap[key]);

    setSelectedItemsMap(prev => {
      const newMap = { ...prev };
      if (allSelected) {
        allKeys.forEach(key => delete newMap[key]);
      } else {
        allKeys.forEach(key => newMap[key] = true);
      }
      return newMap;
    });
  };

  const handleClearFilters = () => {
    setFilterBldg('');
    setFilterMeasurementType('All');
    setFilterMeasurementNumber('');
    setFilterArea('');
  };

  // Get detailed information for selected measurement items
  const getSelectedMeasurementsDetails = () => {
    const selectedDetails: Array<{
      key: string;
      bldg: string;
      measurementId: number;
      itemIndex: number;
      itemType: 'frame' | 'shutter';
      measurementNumber: string;
      measurementDate: string;
      item: any;
    }> = [];

    Object.keys(selectedItemsMap).forEach(key => {
      if (selectedItemsMap[key]) {
        const [bldg, measurementIdStr, itemIndexStr, itemType] = key.split('-');
        const measurementId = parseInt(measurementIdStr);
        const itemIndex = parseInt(itemIndexStr);

        // Find the measurement in allMeasurementsData
        const measurement = allMeasurementsData.find(m => m.id === measurementId);
        if (measurement) {
          // Get the items array
          let items: any[] = [];
          if (measurement.items) {
            if (typeof measurement.items === 'string') {
              try {
                items = JSON.parse(measurement.items);
              } catch (e) {
                console.error('Error parsing items:', e);
                items = [];
              }
            } else if (Array.isArray(measurement.items)) {
              items = measurement.items;
            }
          }

          // Get the specific item
          const item = items[itemIndex];
          if (item) {
            selectedDetails.push({
              key,
              bldg: bldg || '',
              measurementId,
              itemIndex,
              itemType: itemType as 'frame' | 'shutter',
              measurementNumber: measurement.measurement_number || `MP${String(measurement.id).padStart(5, '0')}`,
              measurementDate: measurement.measurement_date || '-',
              item
            });
          }
        }
      }
    });

    return selectedDetails;
  };

  // Handle removing a selected item
  const handleRemoveSelectedItem = (key: string) => {
    setSelectedItemsMap(prev => {
      const newMap = { ...prev };
      delete newMap[key];
      return newMap;
    });
  };

  // Render selected measurements display component
  const renderSelectedMeasurementsDisplay = (showInModal: boolean = false) => {
    const selectedDetails = getSelectedMeasurementsDetails();

    if (selectedDetails.length === 0) {
      return null;
    }

    // Group by measurement to show summary
    const measurementGroups = selectedDetails.reduce((acc, detail) => {
      const key = `${detail.measurementId}`;
      if (!acc[key]) {
        acc[key] = {
          measurementNumber: detail.measurementNumber,
          measurementDate: detail.measurementDate,
          count: 0
        };
      }
      acc[key].count++;
      return acc;
    }, {} as Record<string, { measurementNumber: string; measurementDate: string; count: number }>);

    const uniqueMeasurementsCount = Object.keys(measurementGroups).length;

    return (
      <div className={`mb-8 ${showInModal ? 'mt-4' : 'mt-6'}`}>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-400 rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-purple-600 flex-shrink-0" />
              <h3 className="text-xl font-bold text-purple-900">
                Selected Measurements
              </h3>
              <span className="px-3 py-1.5 bg-purple-600 text-white rounded-full text-sm font-bold shadow-md">
                {selectedDetails.length} {selectedDetails.length === 1 ? 'item' : 'items'} selected
              </span>
              {uniqueMeasurementsCount > 1 && (
                <span className="text-sm font-medium text-purple-800 bg-purple-200 px-2 py-1 rounded">
                  from {uniqueMeasurementsCount} measurements
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedItemsMap({})}
              className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          </div>

          <div className="overflow-x-auto rounded-md border border-purple-300">
            <table className="min-w-full divide-y divide-purple-200">
              <thead className="bg-purple-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">Measurement #</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">SR NO</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">BLDG/Wings</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">Flat No</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">Area</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">Location</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">Width</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">Height</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">Act Width(mm)</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">Act Height(mm)</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">Act Width(inch)</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">Act Height(inch)</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">RO Width</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">RO Height</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-purple-900 uppercase tracking-wider border-r border-purple-300">act_sq_ft</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-purple-900 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-purple-200">
                {selectedDetails.map((detail) => {
                  const getDim = (val: any) => {
                    if (!val || val === '-') return 0;
                    const num = typeof val === 'string' ? parseFloat(val.replace('"', '')) : val;
                    return isNaN(num) ? 0 : num;
                  };

                  const w = getDim(detail.item.act_width || detail.item.width || detail.item.w);
                  const h = getDim(detail.item.act_height || detail.item.height || detail.item.h);

                  const isInch = (v: number) => v < 150; // Threshold for inches

                  const w_mm = isInch(w) ? Math.round(w * 25.4) : Math.round(w);
                  const h_mm = isInch(h) ? Math.round(h * 25.4) : Math.round(h);
                  const w_inch = isInch(w) ? w.toFixed(2) : (w / 25.4).toFixed(2);
                  const h_inch = isInch(h) ? h.toFixed(2) : (h / 25.4).toFixed(2);

                  const qty = Number(detail.item.qty) || Number(detail.item.quantity) || 1;
                  const sqft = (parseFloat(w_inch) * parseFloat(h_inch) / 144) * qty;

                  return (
                    <tr key={detail.key} className="hover:bg-purple-50 transition-colors duration-150">
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200">
                        {detail.measurementNumber}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200">
                        {detail.measurementDate ? new Date(detail.measurementDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200">
                        {detail.item.sr_no || detail.item.sr_number || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200">
                        {detail.bldg || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200">
                        {detail.item.flat_no || detail.item.flat || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200">
                        {detail.item.product_area || detail.item.area || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200">
                        {detail.item.location || detail.item.location_of_fitting || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200 font-bold">
                        {w}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200 font-bold">
                        {h}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200">
                        {w_mm}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200">
                        {h_mm}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200">
                        {w_inch}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200">
                        {h_inch}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200">
                        {detail.item.ro_width || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200">
                        {detail.item.ro_height || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-purple-200 font-bold">
                        {sqft.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedItem(detail.key)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render selected measurements in a separate table matching the image format
  const renderSelectedMeasurementsTable = () => {
    const selectedDetails = getSelectedMeasurementsDetails();

    if (selectedDetails.length === 0) {
      return null;
    }

    // Separate Frame and Shutter items
    const frameItems = selectedDetails.filter(detail => detail.itemType === 'frame');
    const shutterItems = selectedDetails.filter(detail => detail.itemType === 'shutter');

    // Format date as DD/MM/YYYY
    const formatDate = (dateString: string) => {
      if (!dateString || dateString === '-') return '-';
      try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        return dateString;
      }
    };

    return (
      <div className="mb-8">
        {/* Frame Items Table */}
        {frameItems.length > 0 && (
          <div className="mb-6">
            <div className="mb-4 pb-3 border-b-2 border-gray-300">
              <h3 className="text-lg font-bold text-gray-900">Frame Items</h3>
            </div>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">MEASUREMENT #</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">DATE</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">SR NO</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">BLDG/Wings</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">AREA</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">WIDTH</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">HEIGHT</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">WALL</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">SUB FRAME</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">QTY</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">LOCATION OF FITTING</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {frameItems.map((detail, index) => (
                      <tr
                        key={detail.key}
                        className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {detail.measurementNumber}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {formatDate(detail.measurementDate)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {detail.item.sr_no || detail.item.sr_number || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {detail.item.bldg || detail.item.flat_no || detail.item.flat_number || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {detail.item.area || detail.item.product_area || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {detail.item.width || detail.item.act_width || detail.item.w || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {detail.item.height || detail.item.act_height || detail.item.h || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {detail.item.wall || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {detail.item.sub_frame || detail.item.subframe_side || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                          {detail.item.qty || detail.item.quantity || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {detail.item.location_of_fitting || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Shutter Items Table */}
        {shutterItems.length > 0 && (
          <div className="mb-6">
            <div className="mb-4 pb-3 border-b-2 border-gray-300">
              <h3 className="text-lg font-bold text-gray-900">Shutter Items</h3>
            </div>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">MEASUREMENT #</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">DATE</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">SR NO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">BLDG/Wings</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">FLAT NO</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">AREA</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">LOCATION</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">WIDTH</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">HEIGHT</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">Act Width(mm)</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">Act Height (mm)</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">Act Width (inch)</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">Act Height (inch)</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">RO Width</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">RO Height</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">act_sq_ft</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shutterItems.map((detail, index) => {
                      const getDim = (val: any) => {
                        if (!val || val === '-') return 0;
                        const num = typeof val === 'string' ? parseFloat(val.replace('"', '')) : val;
                        return isNaN(num) ? 0 : num;
                      };

                      const w = getDim(detail.item.act_width || detail.item.width || detail.item.w);
                      const h = getDim(detail.item.act_height || detail.item.height || detail.item.h);

                      // Improved threshold for inches
                      const isInchVal = (v: number) => v < 150 && v > 0;

                      const w_mm = isInchVal(w) ? Math.round(w * 25.4) : Math.round(w);
                      const h_mm = isInchVal(h) ? Math.round(h * 25.4) : Math.round(h);
                      const w_inch = isInchVal(w) ? w.toFixed(2) : (w / 25.4).toFixed(2);
                      const h_inch = isInchVal(h) ? h.toFixed(2) : (h / 25.4).toFixed(2);

                      const qty = Number(detail.item.qty) || Number(detail.item.quantity) || 1;
                      const sqft = (parseFloat(w_inch) * parseFloat(h_inch) / 144) * qty;

                      return (
                        <tr
                          key={detail.key}
                          className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200">
                            {detail.measurementNumber}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200">
                            {formatDate(detail.measurementDate)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200">
                            {detail.item.sr_no || detail.item.sr_number || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200">
                            {detail.bldg || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200">
                            {detail.item.flat_no || detail.item.flat || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200">
                            {detail.item.area || detail.item.product_area || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200">
                            {detail.item.location || detail.item.location_of_fitting || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200 font-bold">
                            {w}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200 font-bold">
                            {h}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200">
                            {w_mm}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200">
                            {h_mm}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200">
                            {w_inch}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200">
                            {h_inch}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200">
                            {detail.item.ro_width || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 border-r border-gray-200">
                            {detail.item.ro_height || '-'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900 font-bold">
                            {sqft.toFixed(3)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'
          }`}
      >
        <Navbar />
        <div className="p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Create Production Paper</h1>
                <p className="text-gray-600 mt-2">Add a new production paper to the system.</p>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Product Category and Order Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Category *
                    </label>
                    <select
                      required
                      value={formData.product_category}
                      onChange={(e) => setFormData({ ...formData, product_category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Product Category</option>
                      <option value="Shutter">Shutter</option>
                      <option value="Frame">Frame</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Type
                    </label>
                    <select
                      value={formData.order_type}
                      onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Regular">Regular</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Sample">Sample</option>
                    </select>
                  </div>
                </div>

                {/* Production Code */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Production Code
                  </label>
                  <input
                    type="text"
                    value={formData.product_category ? generatedPaperNumber : 'Select product category first'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.product_category
                      ? `Production code is automatically generated (${formData.product_category === 'Shutter' ? 'S' : 'F'} prefix)`
                      : 'Production code is automatically generated based on product category'
                    }
                  </p>
                </div>

                {/* Party (Required) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Party <span className="text-red-500">*</span>
                  </label>
                  <div className="relative" ref={partyDropdownRef}>
                    <input
                      type="text"
                      value={isPartyDropdownOpen ? partySearchQuery : (selectedParty ? (selectedParty.display_name || selectedParty.name) : '')}
                      onChange={(e) => {
                        setPartySearchQuery(e.target.value);
                        setIsPartyDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setIsPartyDropdownOpen(true);
                        if (selectedParty) {
                          setPartySearchQuery(selectedParty.display_name || selectedParty.name);
                        }
                      }}
                      onBlur={(e) => {
                        // Don't close if clicking on dropdown items
                        if (!partyDropdownRef.current?.contains(e.relatedTarget as Node)) {
                          setTimeout(() => setIsPartyDropdownOpen(false), 200);
                        }
                      }}
                      placeholder="Search party name..."
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {isPartyDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        {filteredParties.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-500">No parties found</div>
                        ) : (
                          filteredParties.map((party) => (
                            <button
                              key={party.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, party_id: party.id.toString(), measurement_id: '' });
                                setPartySearchQuery('');
                                setIsPartyDropdownOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              <div className="font-medium text-gray-900">{party.display_name || party.name}</div>
                              {party.display_name && party.name !== party.display_name && (
                                <div className="text-sm text-gray-500">{party.name}</div>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Requirements */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Requirements
                  </label>
                  {!formData.product_category ? (
                    <input
                      type="text"
                      value="Please select product category first"
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  ) : !formData.party_id ? (
                    <input
                      type="text"
                      value="Please select a party first"
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  ) : (
                    <div className="relative" ref={clientRequirementsDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsClientRequirementsDropdownOpen(!isClientRequirementsDropdownOpen)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <span className={selectedClientRequirement ? 'text-gray-900' : 'text-gray-500'}>
                          {selectedClientRequirement
                            ? getClientRequirementLabel(selectedClientRequirement)
                            : 'Select a client requirement'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </button>
                      {isClientRequirementsDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                          {filteredClientRequirements.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              No client requirements found for this party
                            </div>
                          ) : (
                            filteredClientRequirements.map((item, index) => {
                              // Check if this requirement has a production paper
                              const requirementType = formData.product_category === 'Frame' ? 'frame' : 'door';
                              const statusArray = requirementType === 'frame'
                                ? clientRequirementsStatus?.frame_requirements_status
                                : clientRequirementsStatus?.door_requirements_status;
                              const requirementStatus = statusArray?.find(
                                (status: { index: number; has_production_paper: boolean }) =>
                                  status.index === index
                              );
                              const hasProductionPaper = requirementStatus?.has_production_paper || false;

                              return (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handleClientRequirementSelect(index)}
                                  className={`w-full px-4 py-2 text-left transition-colors focus:outline-none ${selectedClientRequirementIndex === index
                                    ? 'bg-blue-50'
                                    : hasProductionPaper
                                      ? 'bg-green-50 hover:bg-green-100 focus:bg-green-100'
                                      : 'bg-white hover:bg-gray-100 focus:bg-gray-100'
                                    }`}
                                >
                                  <div className="font-medium text-gray-900">
                                    {getClientRequirementLabel(item)}
                                  </div>
                                  {item.site_location && (
                                    <div className="text-sm text-gray-500">
                                      {item.site_location}
                                    </div>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Client Requirements Tables */}
                {formData.product_category && formData.party_id && filteredClientRequirements.length > 0 && (
                  <div className="mb-6 -mx-4 md:mx-0">
                    {formData.product_category === 'Frame' ? (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-3 md:px-4 py-2 md:py-3 border-b border-gray-200">
                          <h3 className="text-base md:text-lg font-semibold text-gray-900">Frame Client Requirements</h3>
                        </div>
                        <div className="overflow-x-auto -mx-4 md:mx-0">
                          <div className="inline-block min-w-full align-middle px-4 md:px-0">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">ITEM NUMBER</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">SITE NAME</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">SITE LOCATION</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">TOTAL QUANTITY</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">PRODUCT AREA</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">CONCEPT</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">WALL TYPE</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">LAMINATE</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">REBATE</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">SUB FRAME</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">CONSTRUCTION</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">COVER MOULDING</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">REMARK</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {filteredClientRequirements.map((item, index) => {
                                  // Check if this requirement has a production paper
                                  const requirementStatus = clientRequirementsStatus?.frame_requirements_status?.find(
                                    (status: { index: number; has_production_paper: boolean }) =>
                                      status.index === index
                                  );
                                  const hasProductionPaper = requirementStatus?.has_production_paper || false;

                                  return (
                                    <tr
                                      key={index}
                                      onClick={() => handleTableRowSelect(index)}
                                      className={`cursor-pointer transition-colors ${selectedTableRowIndex === index
                                        ? 'bg-blue-100 ring-2 ring-blue-500'
                                        : hasProductionPaper
                                          ? 'bg-green-50 hover:bg-green-100'
                                          : 'bg-white hover:bg-blue-50'
                                        }`}
                                    >
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{index + 1}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.site_name || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.site_location || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.total_quantity || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.product_area || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.concept || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.wall_type || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.laminate || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.rebate || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.sub_frame || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.construction || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.cover_moulding || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.remark || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : formData.product_category === 'Shutter' ? (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-3 md:px-4 py-2 md:py-3 border-b border-gray-200">
                          <h3 className="text-base md:text-lg font-semibold text-gray-900">Shutter Client Requirements</h3>
                        </div>
                        <div className="overflow-x-auto -mx-4 md:mx-0">
                          <div className="inline-block min-w-full align-middle px-4 md:px-0">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">ITEM NUMBER</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">SITE NAME</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">SITE LOCATION</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">TOTAL QUANTITY</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">PRODUCT AREA</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">CONCEPT</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">FRAME DESIGN</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">THICKNESS</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">FRONTSIDE DESIGN</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">BACKSIDE DESIGN</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">FRONTSIDE LAMINATE</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">BACKSIDE LAMINATE</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">GEL COLOUR</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">Grade</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">Side Frame</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">Filler</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">FOAM Bottom</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">FRP coating</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {filteredClientRequirements.map((item, index) => {
                                  // Check if this requirement has a production paper
                                  const requirementStatus = clientRequirementsStatus?.door_requirements_status?.find(
                                    (status: { index: number; has_production_paper: boolean }) =>
                                      status.index === index
                                  );
                                  const hasProductionPaper = requirementStatus?.has_production_paper || false;

                                  return (
                                    <tr
                                      key={index}
                                      onClick={() => handleTableRowSelect(index)}
                                      className={`cursor-pointer transition-colors ${selectedTableRowIndex === index
                                        ? 'bg-blue-100 ring-2 ring-blue-500'
                                        : hasProductionPaper
                                          ? 'bg-green-50 hover:bg-green-100'
                                          : 'bg-white hover:bg-blue-50'
                                        }`}
                                    >
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{index + 1}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.site_name || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.site_name_2 || item.site_location || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.total_quantity || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.product_area || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.concept || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.frame_design || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.thickness || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.frontside_design || item.design || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.backside_design || (item.design ? 'same as front' : '-')}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.frontside_laminate || item.laminate || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.backside_laminate || (item.laminate ? 'same as front' : '-')}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.gel_colour || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.grade || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.side_frame || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.filler || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">{item.foam_bottom || '-'}</td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.frp_coating || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Area and Concept */}


                {/* Measurement (Optional) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measurement <span className="text-red-500">*</span>
                  </label>
                  {!formData.party_id ? (
                    <input
                      type="text"
                      value="Please select a party first"
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  ) : (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAllMeasurementsView(true);
                          setSelectedItemsMap({});
                          // Pre-fill filters based on current form data
                          setFilterArea(formData.area || '');
                          setFilterMeasurementType(formData.product_category || 'All');

                          // Default filterBldg to site_location if it's likely a building/wing code
                          if (formData.site_location && formData.site_location.length <= 5) {
                            setFilterBldg(formData.site_location);
                          }
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
                      >
                        <span>View All Measurements</span>
                        {getSelectedItemsCount() > 0 && (
                          <span className="px-2 py-0.5 bg-purple-800 rounded-full text-xs">
                            {getSelectedItemsCount()} selected
                          </span>
                        )}
                      </button>
                      {formData.measurement_id && (
                        <span className="px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 flex items-center">
                          {selectedMeasurement?.measurement_number}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Measurement Items Table */}
                {showMeasurementItems && selectedMeasurementItems && selectedMeasurementItems.items && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <label className="block text-sm font-medium text-gray-700">
                          {selectedMeasurementItems.measurement_type?.includes('shutter')
                            ? 'Shutter Measurement Items'
                            : 'Measurement Items'}
                        </label>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getMeasurementTypeLabel(selectedMeasurementItems.measurement_type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {selectedItemIndices.length} of {Array.isArray(selectedMeasurementItems.items) ? selectedMeasurementItems.items.length : 0} items selected
                        </span>
                        <button
                          type="button"
                          onClick={handleSelectAllMeasurementItems}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          {selectedItemIndices.length === (Array.isArray(selectedMeasurementItems.items) ? selectedMeasurementItems.items.length : 0)
                            ? 'Deselect All'
                            : 'Select All'}
                        </button>
                      </div>
                    </div>
                    <div className="border border-gray-300 rounded-md overflow-hidden">
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left">
                                <input
                                  type="checkbox"
                                  checked={Boolean(selectedMeasurementItems.items && Array.isArray(selectedMeasurementItems.items) && selectedItemIndices.length === selectedMeasurementItems.items.length && selectedMeasurementItems.items.length > 0)}
                                  onChange={handleSelectAllMeasurementItems}
                                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                              </th>
                              {selectedMeasurementItems.measurement_type === 'shutter_sample' || selectedMeasurementItems.measurement_type === 'regular_shutter' ? (
                                <>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SR No</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location of Fitting</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Act Width (inch)</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Act Height (inch)</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">H</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">W</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                </>
                              ) : (
                                <>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SR No</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location of Fitting</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACT Width (MM)</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACT Height (MM)</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wall</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subframe Side</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Array.isArray(selectedMeasurementItems.items) && selectedMeasurementItems.items.length > 0 ? (
                              selectedMeasurementItems.items.map((item: any, index: number) => {
                                const isSelected = selectedItemIndices.includes(index);
                                return (
                                  <tr
                                    key={index}
                                    className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                                  >
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleSelectMeasurementItem(index)}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                      />
                                    </td>
                                    {selectedMeasurementItems.measurement_type === 'shutter_sample' || selectedMeasurementItems.measurement_type === 'regular_shutter' ? (
                                      <>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.sr_no || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.location || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.area || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.act_width || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.act_height || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.h || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.w || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.qty || '-'}</td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.sr_no || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.location_of_fitting || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.area || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.act_width || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.act_height || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.wall || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.subframe_side || '-'}</td>
                                      </>
                                    )}
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={selectedMeasurementItems.measurement_type?.includes('shutter') ? 9 : 8} className="px-4 py-8 text-center text-sm text-gray-500">
                                  No items found in this measurement
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Measurements Display - Prominently displayed above Site Name/Location */}
                {getSelectedItemsCount() > 0 && (
                  <div className="mb-8">
                    {renderSelectedMeasurementsDisplay(false)}
                  </div>
                )}

                {/* Selected Measurements Table - Separate section showing selected items in table format */}
                {getSelectedItemsCount() > 0 && (
                  <div className="mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Selected Measurement Items</h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Review the selected items that will be included in this production paper
                        </p>
                      </div>
                      {renderSelectedMeasurementsTable()}
                    </div>
                  </div>
                )}

                {/* Site Name and Site Location */}
                {/* Dynamic Form Fields based on Product Category */}
                {formData.product_category === 'Frame' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Production Paper – Frame</h3>

                      {/* Row 1: Site Name, Site Location */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Site Name
                          </label>
                          <input
                            type="text"
                            value={formData.site_name}
                            onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Site Location
                          </label>
                          <input
                            type="text"
                            value={formData.site_location}
                            onChange={(e) => setFormData({ ...formData, site_location: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Row 2: Product Area, Total Quantity */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Area
                          </label>
                          {(() => {
                            const predefinedAreas = ['MD', 'CB', 'MB', 'CHB', 'CT', 'MT', 'CHT', 'TR', 'KG', 'DRB', 'WC-Bath', 'Top-Ter', 'STR', 'Safety-MD'];
                            const isCustomArea = formData.area && !predefinedAreas.includes(formData.area);
                            const selectedValue = isCustomArea ? 'Custom' : (formData.area || '');

                            return (
                              <>
                                <select
                                  value={selectedValue}
                                  onChange={(e) => {
                                    if (e.target.value === 'Custom') {
                                      if (!customAreaValue && formData.area && !predefinedAreas.includes(formData.area)) {
                                        setCustomAreaValue(formData.area);
                                      } else {
                                        setCustomAreaValue('');
                                      }
                                    } else {
                                      setFormData({ ...formData, area: e.target.value });
                                      setCustomAreaValue('');
                                    }
                                  }}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value="">Select Area</option>
                                  {predefinedAreas.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                  ))}
                                  <option value="Custom">Custom</option>
                                </select>
                                {selectedValue === 'Custom' && (
                                  <input
                                    type="text"
                                    value={customAreaValue || (isCustomArea ? formData.area : '')}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setCustomAreaValue(value);
                                      setFormData({ ...formData, area: value });
                                    }}
                                    placeholder="Enter custom area"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mt-2"
                                  />
                                )}
                              </>
                            );
                          })()}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Quantity
                          </label>
                          <input
                            type="text"
                            value={formData.total_quantity}
                            onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter total quantity"
                          />
                        </div>
                      </div>

                      {/* Row 3: Concept, Construction */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Concept
                          </label>
                          <select
                            value={formData.concept}
                            onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select Concept</option>
                            {products
                              .filter((product) => product.is_active)
                              .map((product) => product.product_type)
                              .filter((value, index, self) => self.indexOf(value) === index)
                              .map((productType) => (
                                <option key={productType} value={productType}>
                                  {productType}
                                </option>
                              ))}
                          </select>
                          {products.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1">No products available for this category</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Construction
                          </label>
                          <select
                            value={formData.construction}
                            onChange={(e) => setFormData({ ...formData, construction: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select Construction</option>
                            <option value="25+18(43MM)">25+18(43MM)</option>
                            <option value="18+18(36MM)">18+18(36MM)</option>
                            <option value="18+12(30MM)">18+12(30MM)</option>
                            <option value="18MM">18MM</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 4: Frame Design, Wall Type */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Frame Design
                          </label>
                          <input
                            type="text"
                            value={formData.frame_design}
                            onChange={(e) => setFormData({ ...formData, frame_design: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter frame design"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Wall Type
                          </label>
                          <select
                            value={formData.wall_type}
                            onChange={(e) => setFormData({ ...formData, wall_type: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select Wall Type</option>
                            <option value="WALL TO WALL">WALL TO WALL</option>
                            <option value="FIX">FIX</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 5: Laminate, Rebate */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Laminate
                          </label>
                          <input
                            type="text"
                            value={formData.laminate}
                            onChange={(e) => setFormData({ ...formData, laminate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter laminate"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rebate
                          </label>
                          <select
                            value={formData.rebate}
                            onChange={(e) => setFormData({ ...formData, rebate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select Rebate</option>
                            <option value="Single Rebate">Single Rebate</option>
                            <option value="Double Rebate">Double Rebate</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 6: Sub Frame, Cover Moulding */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sub Frame
                          </label>
                          <select
                            value={formData.sub_frame}
                            onChange={(e) => setFormData({ ...formData, sub_frame: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select Sub Frame</option>
                            <option value="YES">YES</option>
                            <option value="NO">NO</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cover Moulding
                          </label>
                          <select
                            value={formData.cover_moulding}
                            onChange={(e) => setFormData({ ...formData, cover_moulding: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select Cover Moulding</option>
                            <option value="LENGTH 55MM">LENGTH 55MM</option>
                            <option value="LENGTH 43MM">LENGTH 43MM</option>
                            <option value="LENGTH 37MM">LENGTH 37MM</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 7: Remark */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Remark
                        </label>
                        <textarea
                          value={formData.remark}
                          onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.product_category === 'Shutter' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Production Paper – Shutter</h3>

                      {/* Row 1: Site Name, Site Location */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Site Name
                          </label>
                          <input
                            type="text"
                            value={formData.site_name}
                            onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Site Location
                          </label>
                          <input
                            type="text"
                            value={formData.site_location}
                            onChange={(e) => setFormData({ ...formData, site_location: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Row 2: Product Area, Total Quantity */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Area
                          </label>
                          {(() => {
                            const predefinedAreas = ['MD', 'CB', 'MB', 'CHB', 'CT', 'MT', 'CHT', 'TR', 'KG', 'DRB', 'WC-Bath', 'Top-Ter', 'STR', 'Safety-MD'];
                            const isCustomArea = formData.area && !predefinedAreas.includes(formData.area);
                            const selectedValue = isCustomArea ? 'Custom' : (formData.area || '');

                            return (
                              <>
                                <select
                                  value={selectedValue}
                                  onChange={(e) => {
                                    if (e.target.value === 'Custom') {
                                      if (!customAreaValue && formData.area && !predefinedAreas.includes(formData.area)) {
                                        setCustomAreaValue(formData.area);
                                      } else {
                                        setCustomAreaValue('');
                                      }
                                    } else {
                                      setFormData({ ...formData, area: e.target.value });
                                      setCustomAreaValue('');
                                    }
                                  }}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value="">Select Area</option>
                                  {predefinedAreas.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                  ))}
                                  <option value="Custom">Custom</option>
                                </select>
                                {selectedValue === 'Custom' && (
                                  <input
                                    type="text"
                                    value={customAreaValue || (isCustomArea ? formData.area : '')}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setCustomAreaValue(value);
                                      setFormData({ ...formData, area: value });
                                    }}
                                    placeholder="Enter custom area"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mt-2"
                                  />
                                )}
                              </>
                            );
                          })()}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Quantity
                          </label>
                          <input
                            type="text"
                            value={formData.total_quantity}
                            onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter total quantity"
                          />
                        </div>
                      </div>

                      {/* Row 3: Concept, Thickness, CORE */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Concept
                          </label>
                          <select
                            value={formData.concept}
                            onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select Concept</option>
                            {products
                              .filter((product) => product.is_active)
                              .map((product) => product.product_type)
                              .filter((value, index, self) => self.indexOf(value) === index)
                              .map((productType) => (
                                <option key={productType} value={productType}>
                                  {productType}
                                </option>
                              ))}
                          </select>
                          {products.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1">No products available for this category</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thickness
                          </label>
                          <input
                            type="text"
                            value={formData.thickness}
                            onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                            placeholder="e.g., 55MM, 45MM, 40MM"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CORE
                          </label>
                          {showCustomInputCore ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={tempCustomValueCore}
                                onChange={(e) => setTempCustomValueCore(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCoreSubmit();
                                  } else if (e.key === 'Escape') {
                                    handleCoreCancel();
                                  }
                                }}
                                placeholder="Enter core"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleCoreSubmit}
                                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm transition-all"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={handleCoreCancel}
                                className="px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 shadow-sm transition-all"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <select
                              value={formData.core || 'D/C'}
                              onChange={(e) => handleCoreSelect(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="S/C">S/C</option>
                              <option value="D/C">D/C</option>
                              <option value="T/C">T/C</option>
                              <option value="custom">custom</option>
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Row 4: Frontside Design, Backside Design */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Frontside Design
                          </label>
                          <div className="relative design-dropdown-container">
                            <input
                              type="text"
                              value={designSearchTerms.frontside !== undefined
                                ? designSearchTerms.frontside
                                : (formData.frontside_design || '')}
                              onChange={(e) => {
                                setDesignSearchTerms(prev => ({ ...prev, frontside: e.target.value }));
                                setOpenDesignDropdowns(prev => ({ ...prev, frontside: true }));
                              }}
                              onFocus={() => {
                                setOpenDesignDropdowns(prev => ({ ...prev, frontside: true }));
                                if (designSearchTerms.frontside === undefined) {
                                  setDesignSearchTerms(prev => ({ ...prev, frontside: formData.frontside_design || '' }));
                                }
                              }}
                              placeholder="Select Design"
                              disabled={loadingDesigns}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            {openDesignDropdowns.frontside && (
                              <div
                                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl"
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                {getFilteredDesigns(designSearchTerms.frontside || '').length > 0 ? (
                                  getFilteredDesigns(designSearchTerms.frontside || '').map((design) => (
                                    <div
                                      key={design.id}
                                      className="px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                                      onMouseDown={(e) => {
                                        e.preventDefault(); // Prevent input blur
                                        setFormData(prev => ({
                                          ...prev,
                                          frontside_design: design.design_name,
                                          backside_design: design.design_name ? 'same as front' : prev.backside_design
                                        }));
                                        setDesignSearchTerms(prev => ({ ...prev, frontside: design.design_name }));
                                        setOpenDesignDropdowns(prev => ({ ...prev, frontside: false }));
                                      }}
                                    >
                                      <span className="font-medium">{design.design_name}</span>
                                      {design.design_code && <span className="text-gray-500 ml-2">({design.design_code})</span>}
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-4 py-3 text-sm text-gray-400 text-center">No designs found. Try a different search term.</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Backside Design
                          </label>
                          <div className="relative design-dropdown-container">
                            <input
                              type="text"
                              value={designSearchTerms.backside !== undefined
                                ? designSearchTerms.backside
                                : (formData.backside_design || '')}
                              onChange={(e) => {
                                setDesignSearchTerms(prev => ({ ...prev, backside: e.target.value }));
                                setOpenDesignDropdowns(prev => ({ ...prev, backside: true }));
                              }}
                              onFocus={() => {
                                setOpenDesignDropdowns(prev => ({ ...prev, backside: true }));
                                if (designSearchTerms.backside === undefined) {
                                  setDesignSearchTerms(prev => ({ ...prev, backside: formData.backside_design || '' }));
                                }
                              }}
                              placeholder="Select Design"
                              disabled={loadingDesigns}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            {openDesignDropdowns.backside && (
                              <div
                                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl"
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                {getFilteredDesigns(designSearchTerms.backside || '', true).length > 0 ? (
                                  getFilteredDesigns(designSearchTerms.backside || '', true).map((design) => (
                                    <div
                                      key={design.id}
                                      className="px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                                      onMouseDown={(e) => {
                                        e.preventDefault(); // Prevent input blur
                                        setFormData(prev => ({ ...prev, backside_design: design.design_name }));
                                        setDesignSearchTerms(prev => ({ ...prev, backside: design.design_name }));
                                        setOpenDesignDropdowns(prev => ({ ...prev, backside: false }));
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
                                  <div className="px-4 py-3 text-sm text-gray-400 text-center">No designs found. Try a different search term.</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Row 5: Frontside Laminate, Backside Laminate */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Frontside Laminate
                          </label>
                          <input
                            type="text"
                            value={formData.frontside_laminate}
                            onChange={(e) => setFormData({ ...formData, frontside_laminate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter frontside laminate"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Backside Laminate
                          </label>
                          <input
                            type="text"
                            value={formData.backside_laminate}
                            onChange={(e) => setFormData({ ...formData, backside_laminate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter backside laminate"
                          />
                        </div>
                      </div>

                      {/* Row 6: Gel Colour, Grade */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gel Colour
                          </label>
                          <input
                            type="text"
                            value={formData.gel_colour}
                            onChange={(e) => setFormData({ ...formData, gel_colour: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter gel colour"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grade
                          </label>
                          <input
                            type="text"
                            value={formData.grade}
                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter grade"
                          />
                        </div>
                      </div>

                      {/* Row 7: Side Frame, Filler */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Side Frame
                          </label>
                          <input
                            type="text"
                            value={formData.side_frame}
                            onChange={(e) => setFormData({ ...formData, side_frame: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter side frame"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filler
                          </label>
                          <input
                            type="text"
                            value={formData.filler}
                            onChange={(e) => setFormData({ ...formData, filler: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter filler"
                          />
                        </div>
                      </div>

                      {/* Row 8: Foam Bottom, FRP Coating */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            FOAM Bottom (External/Internal)
                          </label>
                          <input
                            type="text"
                            value={formData.foam_bottom}
                            onChange={(e) => setFormData({ ...formData, foam_bottom: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter FOAM bottom"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            FRP Coating on Bottom
                          </label>
                          <input
                            type="text"
                            value={formData.frp_coating}
                            onChange={(e) => setFormData({ ...formData, frp_coating: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter FRP coating"
                          />
                        </div>
                      </div>

                      {/* Row 9: Remark */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Remark
                        </label>
                        <textarea
                          value={formData.remark}
                          onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Fallback/Description for when no category is selected or generic fields needed (Currently covering all logic via optional chaining above) */}
                {!formData.product_category && (
                  <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    Please select a Product Category to view the form fields.
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate('/production-papers')}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? 'Creating...' : 'Create Production Paper'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* All Measurements View Modal */}
      {showAllMeasurementsView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                All Measurements{selectedParty ? ` - ${selectedParty.display_name || selectedParty.name}` : ''}
              </h2>
              <div className="flex items-center gap-4">
                {getSelectedItemsCount() > 0 && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-md text-sm font-medium">
                    {getSelectedItemsCount()} items selected
                  </span>
                )}
                <button
                  onClick={() => {
                    setShowAllMeasurementsView(false);
                    setFilterBldg('');
                    setFilterMeasurementType('All');
                    setFilterMeasurementNumber('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Error Display */}
              {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Selected Measurements Display */}
              {renderSelectedMeasurementsDisplay(true)}

              {/* Filters */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">BLDG/Wing</label>
                    <select
                      value={filterBldg}
                      onChange={(e) => setFilterBldg(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All</option>
                      {availableBldgs.map(bldg => (
                        <option key={bldg} value={bldg}>{bldg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Measurement Type</label>
                    <select
                      value={filterMeasurementType}
                      onChange={(e) => setFilterMeasurementType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="All">All</option>
                      <option value="Frame">Frame</option>
                      <option value="Shutter">Shutter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">By Area</label>
                    <select
                      value={filterArea || ''}
                      onChange={(e) => setFilterArea(e.target.value || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All</option>
                      {availableAreas.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Measurement Number</label>
                    <input
                      type="text"
                      value={filterMeasurementNumber}
                      onChange={(e) => setFilterMeasurementNumber(e.target.value)}
                      placeholder="Search..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
                {processedMeasurements && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSelectAll({ frame: processedMeasurements.frameItems, shutter: processedMeasurements.shutterItems })}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                    >
                      {(() => {
                        const allKeys: string[] = [];
                        processedMeasurements.frameItems.forEach(item => {
                          if (item.bldg) allKeys.push(getItemKey(item.bldg, item._measurement_id, item._item_index, 'frame'));
                        });
                        processedMeasurements.shutterItems.forEach(item => {
                          if (item.bldg) allKeys.push(getItemKey(item.bldg, item._measurement_id, item._item_index, 'shutter'));
                        });
                        const allSelected = allKeys.length > 0 && allKeys.every(key => selectedItemsMap[key]);
                        return allSelected ? 'Deselect All' : 'Select All';
                      })()}
                    </button>
                  </div>
                )}
              </div>

              {/* Measurements Display */}
              {loadingAllMeasurements ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading measurements...</p>
                </div>
              ) : !processedMeasurements || !processedMeasurements.groupedData || Object.keys(processedMeasurements.groupedData).length === 0 ? (
                <div className="text-center py-8">
                  <Ruler className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {allMeasurementsData.length === 0
                      ? 'No measurements found. Please ensure measurements exist for this party.'
                      : 'No measurements match the current filters'}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(processedMeasurements.groupedData).map(([bldg, data]) => {
                    const { frame, shutter } = data;
                    if (frame.length === 0 && shutter.length === 0) return null;

                    const allKeysInBldg: string[] = [];
                    frame.forEach(item => allKeysInBldg.push(getItemKey(bldg, item._measurement_id, item._item_index, 'frame')));
                    shutter.forEach(item => allKeysInBldg.push(getItemKey(bldg, item._measurement_id, item._item_index, 'shutter')));
                    const allSelectedInBldg = allKeysInBldg.length > 0 && allKeysInBldg.every(key => selectedItemsMap[key]);

                    return (
                      <div key={bldg} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        {/* BLDG Header */}
                        <div className="mb-4 pb-4 border-b border-gray-300">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">BLDG/Wing: {bldg}</h3>
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                {frame.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">Frame Items:</span> {frame.length}
                                  </span>
                                )}
                                {shutter.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">Shutter Items:</span> {shutter.length}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectAllInBldg(bldg, frame, shutter)}
                              className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            >
                              {allSelectedInBldg ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                        </div>

                        {/* Frame Items Table */}
                        {frame.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-md font-semibold text-gray-800 mb-3">Frame Items</h4>
                            <div className="overflow-x-auto border border-gray-200 rounded-md">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">
                                      <input
                                        type="checkbox"
                                        checked={frame.length > 0 && frame.every(item => {
                                          const key = getItemKey(bldg, item._measurement_id, item._item_index, 'frame');
                                          return selectedItemsMap[key];
                                        })}
                                        onChange={() => {
                                          const frameKeys = frame.map(item => getItemKey(bldg, item._measurement_id, item._item_index, 'frame'));
                                          const allSelected = frameKeys.length > 0 && frameKeys.every(key => selectedItemsMap[key]);
                                          setSelectedItemsMap(prev => {
                                            const newMap = { ...prev };
                                            if (allSelected) {
                                              frameKeys.forEach(key => delete newMap[key]);
                                            } else {
                                              frameKeys.forEach(key => newMap[key] = true);
                                            }
                                            return newMap;
                                          });
                                        }}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                      />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Measurement #</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Date</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">SR No</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">BLDG/Wings</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Area</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Width</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Height</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Wall</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Sub Frame</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Qty</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Location of Fitting</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {frame.map((item: any) => {
                                    const key = getItemKey(bldg, item._measurement_id, item._item_index, 'frame');
                                    const isSelected = selectedItemsMap[key];
                                    return (
                                      <tr key={key} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                        <td className="px-3 py-2 border-r border-gray-200">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleSelectItem(bldg, item._measurement_id, item._item_index, 'frame')}
                                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">{item._measurement_number || '-'}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700 border-r border-gray-200">
                                          {item._measurement_date ? new Date(item._measurement_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200">{item.sr_no || '-'}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700 border-r border-gray-200">{item.bldg || item.flat_no || '-'}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700 border-r border-gray-200">{item.area || '-'}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700 border-r border-gray-200">{item.width || item.act_width || '-'}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700 border-r border-gray-200">{item.height || item.act_height || '-'}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700 border-r border-gray-200">{item.wall || '-'}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700 border-r border-gray-200">{item.sub_frame || '-'}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700 border-r border-gray-200">{item.qty || '-'}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700">{item.location_of_fitting || '-'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Shutter Items Table */}
                        {shutter.length > 0 && (
                          <div>
                            <h4 className="text-md font-semibold text-gray-800 mb-3">Shutter Items</h4>
                            <div className="overflow-x-auto border border-gray-200 rounded-md">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">
                                      <input
                                        type="checkbox"
                                        checked={shutter.length > 0 && shutter.every(item => {
                                          const key = getItemKey(bldg, item._measurement_id, item._item_index, 'shutter');
                                          return selectedItemsMap[key];
                                        })}
                                        onChange={() => {
                                          const shutterKeys = shutter.map(item => getItemKey(bldg, item._measurement_id, item._item_index, 'shutter'));
                                          const allSelected = shutterKeys.length > 0 && shutterKeys.every(key => selectedItemsMap[key]);
                                          setSelectedItemsMap(prev => {
                                            const newMap = { ...prev };
                                            if (allSelected) {
                                              shutterKeys.forEach(key => delete newMap[key]);
                                            } else {
                                              shutterKeys.forEach(key => newMap[key] = true);
                                            }
                                            return newMap;
                                          });
                                        }}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                      />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Measurement #</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Date</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">SR No</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">BLDG/Wings</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Flat No</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Area</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Location</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Width</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Height</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Act Width(mm)</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Act Height(mm)</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Act Width(inch)</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Act Height(inch)</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">ro_width</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">ro_height</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">act_sq_ft</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Qty</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {shutter.map((item: any) => {
                                    const key = getItemKey(bldg, item._measurement_id, item._item_index, 'shutter');
                                    const isSelected = selectedItemsMap[key];

                                    const getDim = (val: any) => {
                                      if (!val || val === '-') return 0;
                                      const num = typeof val === 'string' ? parseFloat(val.replace('"', '')) : val;
                                      return isNaN(num) ? 0 : num;
                                    };

                                    const w = getDim(item.act_width || item.width || item.w);
                                    const h = getDim(item.act_height || item.height || item.h);

                                    const isInch = (v: number) => v < 150;

                                    const w_mm = isInch(w) ? Math.round(w * 25.4) : Math.round(w);
                                    const h_mm = isInch(h) ? Math.round(h * 25.4) : Math.round(h);
                                    const w_inch = isInch(w) ? w.toFixed(2) : (w / 25.4).toFixed(2);
                                    const h_inch = isInch(h) ? h.toFixed(2) : (h / 25.4).toFixed(2);

                                    const qty = Number(item.qty) || Number(item.quantity) || 1;
                                    const sqft = (parseFloat(w_inch) * parseFloat(h_inch) / 144) * qty;

                                    return (
                                      <tr key={key} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                        <td className="px-3 py-2 border-r border-gray-200">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleSelectItem(bldg, item._measurement_id, item._item_index, 'shutter')}
                                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-[10px] font-medium text-gray-900 border-r border-gray-200">{item._measurement_number || '-'}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200">
                                          {item._measurement_date ? new Date(item._measurement_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-[10px] text-gray-900 border-r border-gray-200">{item.sr_no || '-'}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200">{bldg}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200">{item.flat_no || item.flat || '-'}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200">{item.area || item.product_area || '-'}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200">{item.location || item.location_of_fitting || '-'}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200 font-bold">{w}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200 font-bold">{h}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200">{w_mm}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200">{h_mm}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200">{w_inch}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200">{h_inch}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200">{item.ro_width || '-'}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200">{item.ro_height || '-'}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700 border-r border-gray-200 font-bold">{sqft.toFixed(3)}</td>
                                        <td className="px-3 py-2 text-[10px] text-gray-700">{qty}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setShowAllMeasurementsView(false);
                  setFilterBldg('');
                  setFilterMeasurementType('All');
                  setFilterMeasurementNumber('');
                  setFilterArea('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleContinueWithProduction}
                disabled={getSelectedItemsCount() === 0}
                className={`px-6 py-2 rounded-md transition-colors font-medium ${getSelectedItemsCount() === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
              >
                Continue with Production
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Production Paper Dialog */}
      {showProductionPaperDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Production Paper Already Exists</h3>
              <button
                onClick={() => {
                  setShowProductionPaperDialog(false);
                  setSelectedRequirementPapers([]);
                  setPendingRequirementIndex(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                This client requirement already has {selectedRequirementPapers.length} production paper(s):
              </p>
              <div className="space-y-2 mb-4">
                {selectedRequirementPapers.map((paper) => (
                  <div key={paper.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium text-gray-900">{paper.paper_number}</p>
                      <p className="text-xs text-gray-500">Status: {paper.status}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigate(`/production-papers/${paper.id}`);
                        setShowProductionPaperDialog(false);
                        setSelectedRequirementPapers([]);
                        setPendingRequirementIndex(null);
                      }}
                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Do you want to proceed with creating another production paper for this requirement?
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowProductionPaperDialog(false);
                  setSelectedRequirementPapers([]);
                  setPendingRequirementIndex(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pendingRequirementIndex !== null) {
                    proceedWithRequirementSelection(pendingRequirementIndex);
                  }
                  setShowProductionPaperDialog(false);
                  setSelectedRequirementPapers([]);
                  setPendingRequirementIndex(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

