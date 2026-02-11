import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Upload, File, X, Save, CheckCircle, Plus, Trash2 } from 'lucide-react';

interface ContactPerson {
  name: string;
  designation: string;
  mobile_number: string;
  email: string;
}

interface SiteAddress {
  project_site_name: string;
  site_address: string;
  site_contact_person: string;
  site_mobile_no: string;
}

export default function CreateParty() {
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));
  const [clientRequirementsSaved, setClientRequirementsSaved] = useState(false);
  const [savingClientRequirements, setSavingClientRequirements] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdPartyId, setCreatedPartyId] = useState<number | null>(null);

  // Navigation blocking state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  // Initial form state for comparison
  const initialFormStateRef = useRef({
    partyType: '',
    name: '',
    displayName: '',
    businessType: '',
    contactPersons: [{ name: '', designation: '', mobile_number: '', email: '' }],
    officeAddress: { line1: '', line2: '', area: '', city: '', state: '', pinCode: '', country: 'India' },
    siteAddresses: [{ project_site_name: '', site_address: '', site_contact_person: '', site_mobile_no: '' }],
    taxDetails: { gst_registration_type: '', gstin_number: '', pan_number: '', msme_udyam_number: '' },
    frameRequirements: [{
      site_name: '', site_location: '', total_quantity: '', product_area: '', concept: '',
      frame_design: '', wall_type: '', laminate: '', rebate: '', sub_frame: '', construction: '', cover_moulding: '', remark: '',
    }],
    doorRequirements: [{
      site_name: '', site_name_2: '', total_quantity: '', product_area: '', concept: '', thickness: '',
      frontside_design: '', backside_design: '', frontside_laminate: '', backside_laminate: '', gel_colour: '',
      grade: '', side_frame: '', filler: '', foam_bottom: '', frp_coating: '', core: 'D/C',
    }],
    status: { customer_status: 'PO_OK', approval_status: 'Draft' },
  });

  // Products for dynamic CONCEPT dropdowns
  const [frameProducts, setFrameProducts] = useState<Array<{ id: number; product_type: string }>>([]);
  const [shutterProducts, setShutterProducts] = useState<Array<{ id: number; product_type: string }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Designs for dynamic DESIGN dropdown
  const [designs, setDesigns] = useState<Array<{ id: number; design_name: string; design_code: string }>>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);

  // Basic Party Information
  const [partyType, setPartyType] = useState('');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [businessType, setBusinessType] = useState('');

  // Contact Persons
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([
    { name: '', designation: '', mobile_number: '', email: '' }
  ]);

  // Office Address
  const [officeAddress, setOfficeAddress] = useState({
    line1: '',
    line2: '',
    area: '',
    city: '',
    state: '',
    pinCode: '',
    country: 'India',
  });

  // Site Addresses
  const [siteAddresses, setSiteAddresses] = useState<SiteAddress[]>([
    { project_site_name: '', site_address: '', site_contact_person: '', site_mobile_no: '' }
  ]);

  // Tax & Compliance
  const [taxDetails, setTaxDetails] = useState({
    gst_registration_type: '',
    gstin_number: '',
    pan_number: '',
    msme_udyam_number: '',
  });

  // Business & Sales
  const [businessInfo, setBusinessInfo] = useState({
    customer_category: '',
    industry_type: '',
    estimated_monthly_volume: '',
    estimated_yearly_volume: '',
    price_category: '',
    assigned_sales_executive: '',
    marketing_source: '',
  });

  // Credit & Payment
  const [creditTerms, setCreditTerms] = useState({
    payment_terms: '',
    credit_limit: '',
    credit_days: '',
    security_cheque_pdc: false,
  });

  // Logistics
  const [logistics, setLogistics] = useState({
    preferred_delivery_location: '',
    unloading_responsibility: '',
    working_hours_at_site: '',
    special_instructions: '',
  });

  // Product Preferences
  const [productPreferences] = useState({
    preferred_door_type: '',
    preferred_laminate_brands: '',
    standard_sizes_used: '',
    hardware_preferences: '',
  });

  // Frame Requirements (array to support multiple rows)
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

  // Door Requirements (array to support multiple rows)
  const [doorRequirements, setDoorRequirements] = useState<Array<{
    site_name: string;
    site_name_2: string;
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
    site_name_2: '',
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

  // Status
  const [status, setStatus] = useState({
    customer_status: 'PO_OK',
    approval_status: 'Draft',
  });

  // PO/Reference Document
  const [poDocument, setPoDocument] = useState<File | null>(null);
  const [poDocumentPreview, setPoDocumentPreview] = useState<string | null>(null);

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

  // State for searchable design dropdowns
  const [designSearchTerms, setDesignSearchTerms] = useState<{ [key: string]: string }>({});
  const [openDesignDropdowns, setOpenDesignDropdowns] = useState<{ [key: string]: boolean }>({});

  // State for searchable laminate dropdowns
  const [laminateSearchTerms, setLaminateSearchTerms] = useState<{ [key: string]: string }>({});
  const [openLaminateDropdowns, setOpenLaminateDropdowns] = useState<{ [key: string]: boolean }>({});
  const [laminateSuggestions, setLaminateSuggestions] = useState<string[]>([]);

  // Predefined area options (matching the reference image)
  const predefinedAreaOptions = ['MD', 'CB', 'MB', 'CHB', 'CT', 'MT', 'CHT', 'TR', 'KG', 'DRB', 'WC-Bath', 'Top-Ter', 'STR', 'Safety-MD'];

  // Close design dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Don't close dropdowns if clicking on section headers
      if (target.closest('button[type="button"]') && target.closest('button[type="button"]')?.getAttribute('aria-label')?.includes('section')) {
        return;
      }

      // Don't close dropdowns if clicking inside section header buttons
      if (target.closest('button')?.className.includes('bg-gray-50')) {
        return;
      }

      if (!target.closest('.design-dropdown-container')) {
        setOpenDesignDropdowns({});
      }
      if (!target.closest('.laminate-dropdown-container')) {
        setOpenLaminateDropdowns({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load saved client requirements and custom area options from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('client_requirements_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.frame_requirements) {
          // Handle both array and single object formats
          if (Array.isArray(parsed.frame_requirements)) {
            setFrameRequirements(parsed.frame_requirements);
          } else if (typeof parsed.frame_requirements === 'object') {
            setFrameRequirements([parsed.frame_requirements]);
          }
        }
        if (parsed.door_requirements) {
          // Handle both array and single object formats
          let doorReqs = Array.isArray(parsed.door_requirements)
            ? parsed.door_requirements
            : [parsed.door_requirements];

          // Migrate old "design" field to "frontside_design" and set "backside_design" to "same as front"
          // Migrate old "laminate" field to "frontside_laminate" and set "backside_laminate" to "same as front"
          doorReqs = doorReqs.map((req: any) => {
            const migrated: any = { ...req };

            if (req.design && !req.frontside_design) {
              migrated.frontside_design = req.design;
              migrated.backside_design = 'same as front';
            }
            // Ensure both design fields exist even if migration not needed
            migrated.frontside_design = migrated.frontside_design || '';
            migrated.backside_design = migrated.backside_design || '';

            if (req.laminate && !req.frontside_laminate) {
              migrated.frontside_laminate = req.laminate;
              migrated.backside_laminate = 'same as front';
            }
            // Ensure both laminate fields exist even if migration not needed
            migrated.frontside_laminate = migrated.frontside_laminate || '';
            migrated.backside_laminate = migrated.backside_laminate || '';
            migrated.core = migrated.core || 'D/C'; // Ensure core is set
            return migrated;
          });

          setDoorRequirements(doorReqs);
        }
      }
    } catch (err) {
      console.error('Failed to load saved client requirements:', err);
    }

    // Load custom area options from localStorage
    try {
      const saved = localStorage.getItem('custom_area_options');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out invalid/test values (like "ssddsdfsddsd" patterns)
          // Only keep valid custom options that are meaningful strings
          const validOptions = parsed.filter(option => {
            if (!option || typeof option !== 'string') return false;
            const trimmed = option.trim();
            // Filter out test/placeholder values
            if (trimmed.length < 2 || trimmed.length > 50) return false;
            // Filter out patterns that look like test data
            if (/^(.)\1{5,}$/.test(trimmed)) return false; // Same character repeated 6+ times
            // Filter out any string that starts with "ss" and contains only s, d, f characters (test patterns)
            if (/^ss[sdf]*$/i.test(trimmed)) return false; // Patterns like ss, ssd, ssdd, ssdds, etc.
            if (/^[sdf]{10,}$/i.test(trimmed)) return false; // Only s, d, f characters (10+ chars)
            // Filter out strings that are mostly repeating patterns
            if (trimmed.length >= 10 && /(.{2,})\1{3,}/.test(trimmed)) return false;
            return true;
          });
          setCustomAreaOptions(validOptions);
          // Update localStorage with cleaned data
          if (validOptions.length !== parsed.length) {
            localStorage.setItem('custom_area_options', JSON.stringify(validOptions));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load custom area options:', err);
      // If there's an error, clear the corrupted data
      localStorage.removeItem('custom_area_options');
    }

    // Load products for dynamic CONCEPT dropdowns
    loadProducts();
    // Load designs for dynamic DESIGN dropdown
    loadDesigns();

    // Check for draft data on mount and prompt user
    const draftData = localStorage.getItem('party_draft');
    if (draftData) {
      try {
        const parsed = JSON.parse(draftData);
        if (parsed && (parsed.name || parsed.frameRequirements?.length > 0 || parsed.doorRequirements?.length > 0)) {
          const shouldRestore = window.confirm('Draft data found. Would you like to restore it?');
          if (shouldRestore) {
            if (parsed.partyType) setPartyType(parsed.partyType);
            if (parsed.name) setName(parsed.name);
            if (parsed.displayName) setDisplayName(parsed.displayName);
            if (parsed.businessType) setBusinessType(parsed.businessType);
            if (parsed.contactPersons) setContactPersons(parsed.contactPersons);
            if (parsed.officeAddress) setOfficeAddress(parsed.officeAddress);
            if (parsed.siteAddresses) setSiteAddresses(parsed.siteAddresses);
            if (parsed.taxDetails) setTaxDetails(parsed.taxDetails);
            if (parsed.frameRequirements) setFrameRequirements(parsed.frameRequirements);
            if (parsed.doorRequirements) setDoorRequirements(parsed.doorRequirements);
            if (parsed.status) setStatus(parsed.status);
            // Update initial state ref after restoring
            initialFormStateRef.current = {
              partyType: parsed.partyType || '',
              name: parsed.name || '',
              displayName: parsed.displayName || '',
              businessType: parsed.businessType || '',
              contactPersons: parsed.contactPersons || [{ name: '', designation: '', mobile_number: '', email: '' }],
              officeAddress: parsed.officeAddress || { line1: '', line2: '', area: '', city: '', state: '', pinCode: '', country: 'India' },
              siteAddresses: parsed.siteAddresses || [{ project_site_name: '', site_address: '', site_contact_person: '', site_mobile_no: '' }],
              taxDetails: parsed.taxDetails || { gst_registration_type: '', gstin_number: '', pan_number: '', msme_udyam_number: '' },
              frameRequirements: parsed.frameRequirements || [{
                site_name: '', site_location: '', total_quantity: '', product_area: '', concept: '',
                wall_type: '', laminate: '', rebate: '', sub_frame: '', construction: '', cover_moulding: '', remark: '',
              }],
              doorRequirements: parsed.doorRequirements || [{
                site_name: '', site_name_2: '', total_quantity: '', product_area: '', concept: '', thickness: '',
                frontside_design: '', backside_design: '', frontside_laminate: '', backside_laminate: '', gel_colour: '',
                grade: '', side_frame: '', filler: '', foam_bottom: '', frp_coating: '',
              }],
              status: parsed.status || { customer_status: 'PO_OK', approval_status: 'Draft' },
            };
          }
        }
      } catch (err) {
        console.error('Failed to parse draft data:', err);
      }
    }
  }, []);

  // Check if form has unsaved changes
  useEffect(() => {
    const currentState = {
      partyType,
      name,
      displayName,
      businessType,
      contactPersons,
      officeAddress,
      siteAddresses,
      taxDetails,
      frameRequirements,
      doorRequirements,
      status,
    };

    const hasChanges = JSON.stringify(currentState) !== JSON.stringify(initialFormStateRef.current);
    setHasUnsavedChanges(hasChanges);
  }, [partyType, name, displayName, businessType, contactPersons, officeAddress, siteAddresses, taxDetails, frameRequirements, doorRequirements, status]);

  // Auto-save all form data to localStorage with debouncing
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      const draftData = {
        partyType,
        name,
        displayName,
        businessType,
        contactPersons,
        officeAddress,
        siteAddresses,
        taxDetails,
        frameRequirements,
        doorRequirements,
        status,
        customAreaOptions,
      };
      try {
        localStorage.setItem('party_draft', JSON.stringify(draftData));
      } catch (err) {
        console.error('Failed to save draft:', err);
      }
    }, 2000); // Debounce: save 2 seconds after last change

    return () => clearTimeout(saveTimeout);
  }, [partyType, name, displayName, businessType, contactPersons, officeAddress, siteAddresses, taxDetails, frameRequirements, doorRequirements, status, customAreaOptions]);

  // Clear draft function
  const clearDraft = () => {
    if (window.confirm('Are you sure you want to clear the draft? This cannot be undone.')) {
      localStorage.removeItem('party_draft');
      localStorage.removeItem('client_requirements_draft');
      // Reset form to initial state
      setPartyType('');
      setName('');
      setDisplayName('');
      setBusinessType('');
      setContactPersons([{ name: '', designation: '', mobile_number: '', email: '' }]);
      setOfficeAddress({
        line1: '', line2: '', area: '', city: '', state: '', pinCode: '', country: 'India',
      });
      setSiteAddresses([{ project_site_name: '', site_address: '', site_contact_person: '', site_mobile_no: '' }]);
      setTaxDetails({ gst_registration_type: '', gstin_number: '', pan_number: '', msme_udyam_number: '' });
      setFrameRequirements([{
        site_name: '', site_location: '', total_quantity: '', product_area: '', concept: '',
        frame_design: '',
        wall_type: '', laminate: '', rebate: '', sub_frame: '', construction: '', cover_moulding: '', remark: '',
      }]);
      setDoorRequirements([{
        site_name: '', site_name_2: '', total_quantity: '', product_area: '', concept: '', thickness: '',
        frontside_design: '', backside_design: '', frontside_laminate: '', backside_laminate: '', gel_colour: '',
        grade: '', side_frame: '', filler: '', foam_bottom: '', frp_coating: '',
      }]);
      setStatus({ customer_status: 'PO_OK', approval_status: 'Draft' });
      setHasUnsavedChanges(false);
    }
  };

  // Custom navigation blocking for BrowserRouter
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // Handle browser back/forward buttons
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handlePopState = () => {
      // Push the current state back to prevent navigation
      window.history.pushState(null, '', location.pathname);
      setShowSaveDialog(true);
      pendingNavigationRef.current = () => {
        // Allow navigation by going back
        window.history.back();
      };
    };

    // Push a state to track navigation
    window.history.pushState(null, '', location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, location.pathname]);

  // Intercept link clicks in the app
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;

      if (link) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/') && href !== location.pathname) {
          e.preventDefault();
          e.stopPropagation();
          setShowSaveDialog(true);
          pendingNavigationRef.current = () => {
            navigateRef.current(href);
          };
        }
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [hasUnsavedChanges, location.pathname]);

  // Handle browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle dialog actions
  const handleSaveDraft = () => {
    // Save current state to localStorage
    const draftData = {
      partyType,
      name,
      displayName,
      businessType,
      contactPersons,
      officeAddress,
      siteAddresses,
      taxDetails,
      frameRequirements,
      doorRequirements,
      status,
      customAreaOptions,
    };
    try {
      localStorage.setItem('party_draft', JSON.stringify(draftData));
      setHasUnsavedChanges(false);
      setShowSaveDialog(false);
      if (pendingNavigationRef.current) {
        pendingNavigationRef.current();
        pendingNavigationRef.current = null;
      }
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  const handleLeaveWithoutSaving = () => {
    setHasUnsavedChanges(false);
    setShowSaveDialog(false);
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
  };

  const handleCancelNavigation = () => {
    setShowSaveDialog(false);
    pendingNavigationRef.current = null;
  };

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
      setDesigns(designsData.map((d: any) => ({ id: d.id, design_name: d.design_name, design_code: d.design_code })));
    } catch (err: any) {
      console.error('Failed to load designs:', err);
      setDesigns([]);
    } finally {
      setLoadingDesigns(false);
    }
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
      // Also collect from old laminate field for backward compatibility
      if ((req as any).laminate && (req as any).laminate.trim()) {
        allLaminates.add((req as any).laminate.trim());
      }
    });

    setLaminateSuggestions(Array.from(allLaminates).sort());
  }, [doorRequirements]);

  // Function to add custom area option
  const addCustomArea = (value: string) => {
    const trimmed = value.trim();
    // Validate the value
    if (!trimmed || trimmed.length < 2 || trimmed.length > 50) return false;
    // Prevent test/placeholder patterns
    if (/^(.)\1{5,}$/.test(trimmed)) return false; // Same character repeated 6+ times
    // Prevent any string that starts with "ss" and contains only s, d, f characters (test patterns)
    if (/^ss[sdf]*$/i.test(trimmed)) return false; // Patterns like ss, ssd, ssdd, ssdds, etc.
    if (/^[sdf]{10,}$/i.test(trimmed)) return false; // Only s, d, f characters (10+ chars)
    // Prevent strings that are mostly repeating patterns
    if (trimmed.length >= 10 && /(.{2,})\1{3,}/.test(trimmed)) return false;
    if (!predefinedAreaOptions.includes(trimmed) && !customAreaOptions.includes(trimmed)) {
      const updated = [...customAreaOptions, trimmed];
      setCustomAreaOptions(updated);
      localStorage.setItem('custom_area_options', JSON.stringify(updated));
      return true;
    }
    return false;
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

  // Handle custom value cancel
  const handleCustomValueCancel = (
    index: number,
    isFrame: boolean
  ) => {
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(section)) {
        newExpanded.delete(section);
      } else {
        newExpanded.add(section);
      }
      return newExpanded;
    });
  };

  const addContactPerson = () => {
    setContactPersons([...contactPersons, { name: '', designation: '', mobile_number: '', email: '' }]);
  };

  const removeContactPerson = (index: number) => {
    setContactPersons(contactPersons.filter((_, i) => i !== index));
  };

  const updateContactPerson = (index: number, field: keyof ContactPerson, value: string) => {
    const updated = [...contactPersons];
    updated[index] = { ...updated[index], [field]: value };
    setContactPersons(updated);
  };

  const addSiteAddress = () => {
    setSiteAddresses([...siteAddresses, { project_site_name: '', site_address: '', site_contact_person: '', site_mobile_no: '' }]);
  };

  const removeSiteAddress = (index: number) => {
    setSiteAddresses(siteAddresses.filter((_, i) => i !== index));
  };

  const updateSiteAddress = (index: number, field: keyof SiteAddress, value: string) => {
    const updated = [...siteAddresses];
    updated[index] = { ...updated[index], [field]: value };
    setSiteAddresses(updated);
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
      site_name_2: '',
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

    // Auto-set backside_laminate to "same as front" when frontside_laminate changes
    if (field === 'frontside_laminate' && value) {
      updated[index].backside_laminate = 'same as front';
    }

    setDoorRequirements(updated);
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

  // Helper function to get dropdown key
  const getDropdownKey = (index: number, type: 'frontside' | 'backside') => {
    return `design-${index}-${type}`;
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

    if (includeSameAsFront) {
      const result: string[] = [];
      if ('same as front'.includes(term)) {
        result.push('same as front');
      }
      result.push(...filtered);
      if ('custom'.includes(term)) {
        result.push('custom');
      }
      return result;
    }

    const result = [...filtered];
    if ('custom'.includes(term)) {
      result.push('custom');
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation: Minimum mandatory fields
    if (!name || !partyType) {
      setError('Party Name and Party Type are mandatory fields');
      return;
    }

    // Validation: Contact Person fields are mandatory
    const firstContact = contactPersons[0];
    if (!firstContact.name || !firstContact.mobile_number || !firstContact.email || !firstContact.designation) {
      setError('All Contact Person fields (Name, Designation, Mobile Number, and Email ID) are mandatory');
      return;
    }

    // Validation: Address Details are mandatory
    if (!officeAddress.line1 || !officeAddress.city || !officeAddress.state || !officeAddress.pinCode) {
      setError('Address Line 1, City, State, and PIN Code are mandatory fields');
      return;
    }

    setIsLoading(true);

    try {
      // Convert PO document to base64 if present
      let poDocumentBase64: string | undefined = undefined;
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
      }

      const formData = {
        party_type: partyType,
        name: name,
        display_name: displayName || undefined,
        business_type: businessType || undefined,
        contact_persons: contactPersons.filter(cp =>
          cp.name && cp.designation && cp.mobile_number && cp.email
        ).map(cp => ({
          name: cp.name,
          designation: cp.designation,
          mobile_number: cp.mobile_number,
          email: cp.email,
        })),
        office_address_line1: officeAddress.line1 || undefined,
        office_address_line2: officeAddress.line2 || undefined,
        office_area: officeAddress.area || undefined,
        office_city: officeAddress.city || undefined,
        office_state: officeAddress.state || undefined,
        office_pin_code: officeAddress.pinCode || undefined,
        office_country: officeAddress.country,
        site_addresses: siteAddresses.filter(sa => sa.project_site_name || sa.site_address).map(sa => ({
          project_site_name: sa.project_site_name || undefined,
          site_address: sa.site_address || undefined,
          site_contact_person: sa.site_contact_person || undefined,
          site_mobile_no: sa.site_mobile_no || undefined,
        })),
        gst_registration_type: taxDetails.gst_registration_type || undefined,
        gstin_number: taxDetails.gstin_number || undefined,
        pan_number: taxDetails.pan_number || undefined,
        msme_udyam_number: taxDetails.msme_udyam_number || undefined,
        customer_category: businessInfo.customer_category || undefined,
        industry_type: businessInfo.industry_type || undefined,
        estimated_monthly_volume: businessInfo.estimated_monthly_volume || undefined,
        estimated_yearly_volume: businessInfo.estimated_yearly_volume || undefined,
        price_category: businessInfo.price_category || undefined,
        assigned_sales_executive: businessInfo.assigned_sales_executive || undefined,
        marketing_source: businessInfo.marketing_source || undefined,
        payment_terms: creditTerms.payment_terms || undefined,
        credit_limit: creditTerms.credit_limit || undefined,
        credit_days: creditTerms.credit_days ? parseInt(creditTerms.credit_days) : undefined,
        security_cheque_pdc: creditTerms.security_cheque_pdc,
        preferred_delivery_location: logistics.preferred_delivery_location || undefined,
        unloading_responsibility: logistics.unloading_responsibility || undefined,
        working_hours_at_site: logistics.working_hours_at_site || undefined,
        special_instructions: logistics.special_instructions || undefined,
        product_preferences: Object.values(productPreferences).some(v => v) ? productPreferences : undefined,
        frame_requirements: frameRequirements.some(req => Object.values(req).some(v => v && String(v).trim() !== '')) ? frameRequirements : undefined,
        door_requirements: doorRequirements.some(req => Object.values(req).some(v => v && String(v).trim() !== '')) ? doorRequirements : undefined,
        customer_status: status.customer_status,
        po_document: poDocumentBase64 && poDocument ? {
          filename: poDocument.name,
          content: poDocumentBase64,
          content_type: poDocument.type,
        } : undefined,
        // approval_status is automatically set by backend based on user role
        // measurement_captain -> pending_approval, production_manager -> approved
      };

      const response = await api.post('/production/parties', formData, true);

      // Clear all draft data after successful creation
      localStorage.removeItem('client_requirements_draft');
      localStorage.removeItem('party_draft');

      // For measurement_captain users, show success dialog and redirect to create measurement
      if (currentUser?.role === 'measurement_captain' && response?.id) {
        setCreatedPartyId(response.id);
        setShowSuccessDialog(true);
      } else {
        // For other roles, navigate to parties list (existing behavior)
        navigate('/parties');
      }
    } catch (err: any) {
      // Handle authentication errors
      if (err.message && (err.message.includes('authentication') || err.message.includes('Session expired') || err.message.includes('login'))) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        setError(err.message || 'Failed to create party');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClientRequirements = async () => {
    try {
      setSavingClientRequirements(true);
      setError('');

      // Save to localStorage as backup
      const clientReqData = {
        frame_requirements: frameRequirements,
        door_requirements: doorRequirements,
        saved_at: new Date().toISOString(),
      };
      localStorage.setItem('client_requirements_draft', JSON.stringify(clientReqData));

      // Show success message
      setClientRequirementsSaved(true);
      setTimeout(() => {
        setClientRequirementsSaved(false);
      }, 3000);

    } catch (err: any) {
      setError('Failed to save client requirements: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingClientRequirements(false);
    }
  };

  const SectionHeader = ({ id, title, required = false }: { id: string; title: string; required?: boolean }) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSection(id);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Only prevent default if it's not a left click to avoid interfering with onClick
      if (e.button !== 0) {
        e.preventDefault();
      }
    };

    const isExpanded = expandedSections.has(id);

    return (
      <button
        type="button"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${title} section, click to ${isExpanded ? 'collapse' : 'expand'}`}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        <h3 className="text-lg font-semibold text-gray-900 pointer-events-none">
          {title} {required && <span className="text-red-500">*</span>}
        </h3>
        <span className={`text-gray-500 text-xl transition-transform duration-200 pointer-events-none ${isExpanded ? 'rotate-0' : ''}`}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          {/* Save Confirmation Dialog */}
          {showSaveDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Unsaved Changes</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    You have unsaved changes. What would you like to do?
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleSaveDraft}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Draft
                    </button>
                    <button
                      onClick={handleLeaveWithoutSaving}
                      className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Leave Without Saving
                    </button>
                    <button
                      onClick={handleCancelNavigation}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create Party</h1>
            <p className="text-gray-600 mt-2">Add a new party/customer to the system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* 1. Basic Party Information & Contact Person Details (Mandatory) */}
            <div className="bg-white rounded-lg shadow">
              <SectionHeader id="basic" title="1. Basic Party Information & Contact Person Details" required />
              {expandedSections.has('basic') && (
                <div className="p-6 space-y-6 border-t">
                  {/* Basic Party Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Party Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Party Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          value={partyType}
                          onChange={(e) => setPartyType(e.target.value)}
                        >
                          <option value="">Select Party Type</option>
                          <option value="Builder">Builder</option>
                          <option value="Developer">Developer</option>
                          <option value="Contractor">Contractor</option>
                          <option value="Architect">Architect</option>
                          <option value="Individual Customer">Individual Customer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Party Name (Legal/Registered Name) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Name (Short name)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Type
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                        >
                          <option value="">Select Business Type</option>
                          <option value="Proprietorship">Proprietorship</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Pvt Ltd">Pvt Ltd</option>
                          <option value="LLP">LLP</option>
                          <option value="Individual">Individual</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contact Person Details - Now Mandatory */}
                  <div className="border-t pt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Contact Person Details <span className="text-red-500">*</span></h4>
                    {contactPersons.map((contact, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4 mb-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-gray-900">Contact Person {index + 1}</h4>
                          {contactPersons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeContactPerson(index)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                              value={contact.name}
                              onChange={(e) => updateContactPerson(index, 'name', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Designation <span className="text-red-500">*</span>
                            </label>
                            <select
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                              value={contact.designation}
                              onChange={(e) => updateContactPerson(index, 'designation', e.target.value)}
                            >
                              <option value="">Select Designation</option>
                              <option value="Owner">Owner</option>
                              <option value="Purchase Manager">Purchase Manager</option>
                              <option value="Site Engineer">Site Engineer</option>
                              <option value="Project Manager">Project Manager</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mobile Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                              value={contact.mobile_number}
                              onChange={(e) => updateContactPerson(index, 'mobile_number', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email ID <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                              value={contact.email}
                              onChange={(e) => updateContactPerson(index, 'email', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addContactPerson}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      + Add Contact Person
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Address Details (Mandatory) */}
            <div className="bg-white rounded-lg shadow">
              <SectionHeader id="address" title="2. Address Details" required />
              {expandedSections.has('address') && (
                <div className="p-6 space-y-6 border-t">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Office / Registered Address <span className="text-red-500">*</span></h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address Line 1 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          value={officeAddress.line1}
                          onChange={(e) => setOfficeAddress({ ...officeAddress, line1: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          value={officeAddress.line2}
                          onChange={(e) => setOfficeAddress({ ...officeAddress, line2: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Area / Locality</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          value={officeAddress.area}
                          onChange={(e) => setOfficeAddress({ ...officeAddress, area: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          value={officeAddress.city}
                          onChange={(e) => setOfficeAddress({ ...officeAddress, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          value={officeAddress.state}
                          onChange={(e) => setOfficeAddress({ ...officeAddress, state: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PIN Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          value={officeAddress.pinCode}
                          onChange={(e) => setOfficeAddress({ ...officeAddress, pinCode: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                          value={officeAddress.country}
                          onChange={(e) => setOfficeAddress({ ...officeAddress, country: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Site Address (Optional)</h4>
                    {siteAddresses.map((site, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4 mb-4">
                        <div className="flex justify-between items-center">
                          <h5 className="font-medium text-gray-900">Site {index + 1}</h5>
                          {siteAddresses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSiteAddress(index)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Project / Site Name</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                              value={site.project_site_name}
                              onChange={(e) => updateSiteAddress(index, 'project_site_name', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Site Contact Person</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                              value={site.site_contact_person}
                              onChange={(e) => updateSiteAddress(index, 'site_contact_person', e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Site Address</label>
                            <textarea
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                              value={site.site_address}
                              onChange={(e) => updateSiteAddress(index, 'site_address', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Site Mobile No</label>
                            <input
                              type="tel"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                              value={site.site_mobile_no}
                              onChange={(e) => updateSiteAddress(index, 'site_mobile_no', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSiteAddress}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      + Add Site Address
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Tax & Compliance Details */}
            <div className="bg-white rounded-lg shadow">
              <SectionHeader id="tax" title="3. Tax & Compliance Details" />
              {expandedSections.has('tax') && (
                <div className="p-6 space-y-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GST Registration Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={taxDetails.gst_registration_type}
                        onChange={(e) => setTaxDetails({ ...taxDetails, gst_registration_type: e.target.value })}
                      >
                        <option value="">Select Type</option>
                        <option value="Registered">Registered</option>
                        <option value="Unregistered">Unregistered</option>
                        <option value="Composition">Composition</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN Number</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={taxDetails.gstin_number}
                        onChange={(e) => setTaxDetails({ ...taxDetails, gstin_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={taxDetails.pan_number}
                        onChange={(e) => setTaxDetails({ ...taxDetails, pan_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">MSME / UDYAM Number</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={taxDetails.msme_udyam_number}
                        onChange={(e) => setTaxDetails({ ...taxDetails, msme_udyam_number: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Business & Sales Information */}
            <div className="bg-white rounded-lg shadow">
              <SectionHeader id="business" title="4. Business & Sales Information" />
              {expandedSections.has('business') && (
                <div className="p-6 space-y-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer Category</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={businessInfo.customer_category}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, customer_category: e.target.value })}
                      >
                        <option value="">Select Category</option>
                        <option value="Premium Builder">Premium Builder</option>
                        <option value="Regular Builder">Regular Builder</option>
                        <option value="Architect">Architect</option>
                        <option value="Walk-in">Walk-in</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Industry Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={businessInfo.industry_type}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, industry_type: e.target.value })}
                      >
                        <option value="">Select Type</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Mixed Projects">Mixed Projects</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Monthly Volume</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={businessInfo.estimated_monthly_volume}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, estimated_monthly_volume: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Yearly Volume</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={businessInfo.estimated_yearly_volume}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, estimated_yearly_volume: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price Category</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={businessInfo.price_category}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, price_category: e.target.value })}
                      >
                        <option value="">Select Category</option>
                        <option value="Retail">Retail</option>
                        <option value="Builder Price">Builder Price</option>
                        <option value="Special Contract Price">Special Contract Price</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Sales Executive</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={businessInfo.assigned_sales_executive}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, assigned_sales_executive: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Marketing Source</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={businessInfo.marketing_source}
                        onChange={(e) => setBusinessInfo({ ...businessInfo, marketing_source: e.target.value })}
                      >
                        <option value="">Select Source</option>
                        <option value="Cold Visit">Cold Visit</option>
                        <option value="Reference">Reference</option>
                        <option value="Architect">Architect</option>
                        <option value="Existing Client">Existing Client</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Credit & Payment Terms */}
            <div className="bg-white rounded-lg shadow">
              <SectionHeader id="credit" title="5. Credit & Payment Terms" />
              {expandedSections.has('credit') && (
                <div className="p-6 space-y-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={creditTerms.payment_terms}
                        onChange={(e) => setCreditTerms({ ...creditTerms, payment_terms: e.target.value })}
                      >
                        <option value="">Select Terms</option>
                        <option value="Advance">Advance</option>
                        <option value="50% Advance – 50% Delivery">50% Advance – 50% Delivery</option>
                        <option value="Credit">Credit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Credit Limit</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={creditTerms.credit_limit}
                        onChange={(e) => setCreditTerms({ ...creditTerms, credit_limit: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Credit Days</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={creditTerms.credit_days}
                        onChange={(e) => setCreditTerms({ ...creditTerms, credit_days: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="security_cheque"
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        checked={creditTerms.security_cheque_pdc}
                        onChange={(e) => setCreditTerms({ ...creditTerms, security_cheque_pdc: e.target.checked })}
                      />
                      <label htmlFor="security_cheque" className="ml-2 block text-sm text-gray-700">
                        Security Cheque / PDC
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Logistic & Dispatch Preferences */}
            <div className="bg-white rounded-lg shadow">
              <SectionHeader id="logistics" title="6. Logistic & Dispatch Preferences" />
              {expandedSections.has('logistics') && (
                <div className="p-6 space-y-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Delivery Location</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={logistics.preferred_delivery_location}
                        onChange={(e) => setLogistics({ ...logistics, preferred_delivery_location: e.target.value })}
                      >
                        <option value="">Select Location</option>
                        <option value="Factory Pickup">Factory Pickup</option>
                        <option value="Site Delivery">Site Delivery</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unloading Responsibility</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={logistics.unloading_responsibility}
                        onChange={(e) => setLogistics({ ...logistics, unloading_responsibility: e.target.value })}
                      >
                        <option value="">Select Responsibility</option>
                        <option value="Company">Company</option>
                        <option value="Customer">Customer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours at Site</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={logistics.working_hours_at_site}
                        onChange={(e) => setLogistics({ ...logistics, working_hours_at_site: e.target.value })}
                        placeholder="e.g., 9 AM - 6 PM"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={logistics.special_instructions}
                        onChange={(e) => setLogistics({ ...logistics, special_instructions: e.target.value })}
                        placeholder="e.g., Lift available, Manual unloading only"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 7. Client Requirements */}
            <div className="bg-white rounded-lg shadow">
              <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSection('preferences');
                    }}
                    onMouseDown={(e) => {
                      if (e.button !== 0) {
                        e.preventDefault();
                      }
                    }}
                    tabIndex={0}
                    aria-expanded={expandedSections.has('preferences')}
                    className="text-lg font-semibold text-gray-900 hover:text-gray-700 active:text-gray-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded px-2 py-1"
                  >
                    7. Client Requirements
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {clientRequirementsSaved && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Saved
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSaveClientRequirements();
                    }}
                    disabled={savingClientRequirements}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    title="Save Client Requirements"
                  >
                    <Save className="w-4 h-4" />
                    {savingClientRequirements ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSection('preferences');
                    }}
                    onMouseDown={(e) => {
                      if (e.button !== 0) {
                        e.preventDefault();
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Client Requirements section, click to ${expandedSections.has('preferences') ? 'collapse' : 'expand'}`}
                    className={`text-gray-500 hover:text-gray-700 transition-all duration-200 cursor-pointer text-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded px-2 py-1 ${expandedSections.has('preferences') ? 'rotate-0' : ''}`}
                  >
                    {expandedSections.has('preferences') ? '▼' : '▶'}
                  </button>
                </div>
              </div>
              {expandedSections.has('preferences') && (
                <div className="p-6 space-y-6 border-t">
                  {/* FOR FRAME Table */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-800">FOR FRAME</h3>
                      <button
                        type="button"
                        onClick={addFrameRequirement}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm hover:shadow-md transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Add Row
                      </button>
                    </div>
                    <div className="overflow-x-auto border border-gray-300 rounded-md bg-white">
                      <table className="w-full border-collapse min-w-[1200px]">
                        <thead>
                          <tr className="border-b border-gray-300">
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">ITEM NUMBER</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">SITE NAME</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">SITE LOCATION</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">TOTAL QUANTITY</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">PRODUCT AREA</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">CONCEPT</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">FRAME DESIGN</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">WALL TYPE</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">LAMINATE</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">REBATE</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">SUB FRAME</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">CONSTRUCTION</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">COVER MOULDING</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">REMARK</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 whitespace-nowrap">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {frameRequirements.map((req, rowIndex) => {
                            return (
                              <tr key={rowIndex}>
                                <td className="px-4 py-3 bg-gray-50 border-r border-gray-300 text-center">
                                  <span className="text-sm font-medium text-gray-700">{rowIndex + 1}</span>
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.site_name}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'site_name', e.target.value)}
                                    placeholder="Enter site name"
                                  />
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.site_location}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'site_location', e.target.value)}
                                    placeholder="Enter site location"
                                  />
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.total_quantity}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'total_quantity', e.target.value)}
                                    placeholder="Enter total quantity"
                                  />
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  {showCustomInputFrame[rowIndex] ? (
                                    <div className="flex gap-1">
                                      <input
                                        type="text"
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                        value={tempCustomValueFrame[rowIndex] || ''}
                                        onChange={(e) => setTempCustomValueFrame(prev => ({ ...prev, [rowIndex]: e.target.value }))}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleCustomValueSubmit(rowIndex, true, (value) => updateFrameRequirement(rowIndex, 'product_area', value));
                                          } else if (e.key === 'Escape') {
                                            handleCustomValueCancel(rowIndex, true);
                                          }
                                        }}
                                        placeholder="Enter custom area"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleCustomValueSubmit(rowIndex, true, (value) => updateFrameRequirement(rowIndex, 'product_area', value))}
                                        className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCustomValueCancel(rowIndex, true)}
                                        className="px-2 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <select
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
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
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
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
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.frame_design || ''}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'frame_design', e.target.value)}
                                    placeholder="Enter frame design"
                                  />
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.wall_type}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'wall_type', e.target.value)}
                                  >
                                    <option value="">Select</option>
                                    <option value="WALL TO WALL">WALL TO WALL</option>
                                    <option value="FIX">FIX</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.laminate}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'laminate', e.target.value)}
                                    placeholder="Enter laminate"
                                  />
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.rebate}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'rebate', e.target.value)}
                                  >
                                    <option value="">Select</option>
                                    <option value="Single Rebate">Single Rebate</option>
                                    <option value="Double Rebate">Double Rebate</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.sub_frame}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'sub_frame', e.target.value)}
                                  >
                                    <option value="">Select</option>
                                    <option value="YES">YES</option>
                                    <option value="NO">NO</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
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
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.cover_moulding}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'cover_moulding', e.target.value)}
                                  >
                                    <option value="">Select</option>
                                    <option value="LENGTH 55MM">LENGTH 55MM</option>
                                    <option value="LENGTH 43MM">LENGTH 43MM</option>
                                    <option value="LENGTH 37MM">LENGTH 37MM</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.remark}
                                    onChange={(e) => updateFrameRequirement(rowIndex, 'remark', e.target.value)}
                                    placeholder="Enter remark"
                                  />
                                </td>
                                <td className="px-4 py-3 bg-white text-center">
                                  {frameRequirements.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeFrameRequirement(rowIndex)}
                                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
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
                    </div>
                  </div>

                  {/* FOR SHUTTER Table */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-800">FOR SHUTTER</h3>
                      <button
                        type="button"
                        onClick={addDoorRequirement}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm hover:shadow-md transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Add Row
                      </button>
                    </div>
                    <div className="overflow-x-auto border border-gray-300 rounded-md bg-white">
                      <table className="w-full border-collapse min-w-[1550px]">
                        <thead>
                          <tr className="border-b border-gray-300">
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">ITEM NUMBER</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">SITE NAME</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">SITE LOCATION</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">TOTAL QUANTITY</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">PRODUCT AREA</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">CONCEPT</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">THICKNESS</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">CORE</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">FRONTSIDE DESIGN</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">BACKSIDE DESIGN</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">FRONTSIDE LAMINATE</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">BACKSIDE LAMINATE</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">GEL COLOUR</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">Grade</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">Side Frame</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">Filler</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">FOAM Bottom (External/Internal)</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">FRP coating on bottom</th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 whitespace-nowrap">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doorRequirements.map((req, index) => {
                            return (
                              <tr key={index}>
                                <td className="px-4 py-3 bg-gray-50 border-r border-gray-300 text-center">
                                  <span className="text-sm font-medium text-gray-700">{index + 1}</span>
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.site_name}
                                    onChange={(e) => updateDoorRequirement(index, 'site_name', e.target.value)}
                                    placeholder="Enter site name"
                                  />
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.site_name_2}
                                    onChange={(e) => updateDoorRequirement(index, 'site_name_2', e.target.value)}
                                    placeholder="Enter site location"
                                  />
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <input
                                    type="number"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.total_quantity}
                                    onChange={(e) => updateDoorRequirement(index, 'total_quantity', e.target.value)}
                                    placeholder="Enter quantity"
                                  />
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  {showCustomInputShutter[index] ? (
                                    <div className="flex gap-1">
                                      <input
                                        type="text"
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                        value={tempCustomValueShutter[index] || ''}
                                        onChange={(e) => setTempCustomValueShutter(prev => ({ ...prev, [index]: e.target.value }))}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleCustomValueSubmit(index, false, (value) => updateDoorRequirement(index, 'product_area', value));
                                          } else if (e.key === 'Escape') {
                                            handleCustomValueCancel(index, false);
                                          }
                                        }}
                                        placeholder="Enter custom area"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleCustomValueSubmit(index, false, (value) => updateDoorRequirement(index, 'product_area', value))}
                                        className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCustomValueCancel(index, false)}
                                        className="px-2 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <select
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                      value={req.product_area || ''}
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
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
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
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.thickness}
                                    onChange={(e) => updateDoorRequirement(index, 'thickness', e.target.value)}
                                    placeholder="Enter thickness"
                                  />
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.core || 'D/C'}
                                                                         onChange={(e) => handleCoreSelect(e.target.value, index)}

                                  >
                                    <option value="S/C">S/C</option>
                                    <option value="D/C">D/C</option>
                                    <option value="T/C">T/C</option>
                                    <option value="custom">custom</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <div className="relative">
                                    <input
                                      type="text"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                      value={designSearchTerms[getDropdownKey(index, 'frontside')] !== undefined
                                        ? designSearchTerms[getDropdownKey(index, 'frontside')]
                                        : (req.frontside_design || '')}
                                      onChange={(e) => {
                                        const key = getDropdownKey(index, 'frontside');
                                        setDesignSearchTerms(prev => ({ ...prev, [key]: e.target.value }));
                                        setOpenDesignDropdowns(prev => ({ ...prev, [key]: true }));
                                      }}
                                      onFocus={() => {
                                        const key = getDropdownKey(index, 'frontside');
                                        setOpenDesignDropdowns(prev => ({ ...prev, [key]: true }));
                                        if (!designSearchTerms[key]) {
                                          setDesignSearchTerms(prev => ({ ...prev, [key]: req.frontside_design || '' }));
                                        }
                                      }}
                                      placeholder="Select Design"
                                      disabled={loadingDesigns}
                                    />
                                    {openDesignDropdowns[getDropdownKey(index, 'frontside')] && (
                                      <div
                                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl"
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        {getFilteredDesigns(designSearchTerms[getDropdownKey(index, 'frontside')] || '').length > 0 ? (
                                          getFilteredDesigns(designSearchTerms[getDropdownKey(index, 'frontside')] || '').map((design) => (
                                            <div
                                              key={design.id}
                                              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                updateDoorRequirement(index, 'frontside_design', design.design_name);
                                                const key = getDropdownKey(index, 'frontside');
                                                setDesignSearchTerms(prev => ({ ...prev, [key]: design.design_name }));
                                                setOpenDesignDropdowns(prev => ({ ...prev, [key]: false }));
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
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <div className="relative design-dropdown-container">
                                    <input
                                      type="text"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                      value={designSearchTerms[getDropdownKey(index, 'backside')] !== undefined
                                        ? designSearchTerms[getDropdownKey(index, 'backside')]
                                        : (req.backside_design || '')}
                                      onChange={(e) => {
                                        const key = getDropdownKey(index, 'backside');
                                        setDesignSearchTerms(prev => ({ ...prev, [key]: e.target.value }));
                                        setOpenDesignDropdowns(prev => ({ ...prev, [key]: true }));
                                      }}
                                      onFocus={() => {
                                        const key = getDropdownKey(index, 'backside');
                                        setOpenDesignDropdowns(prev => ({ ...prev, [key]: true }));
                                        if (!designSearchTerms[key]) {
                                          setDesignSearchTerms(prev => ({ ...prev, [key]: req.backside_design || '' }));
                                        }
                                      }}
                                      placeholder="Select Design"
                                      disabled={loadingDesigns}
                                    />
                                    {openDesignDropdowns[getDropdownKey(index, 'backside')] && (
                                      <div
                                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl"
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        {getFilteredDesigns(designSearchTerms[getDropdownKey(index, 'backside')] || '', true).length > 0 ? (
                                          getFilteredDesigns(designSearchTerms[getDropdownKey(index, 'backside')] || '', true).map((design) => (
                                            <div
                                              key={design.id}
                                              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                updateDoorRequirement(index, 'backside_design', design.design_name);
                                                const key = getDropdownKey(index, 'backside');
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
                                          <div className="px-4 py-3 text-sm text-gray-400 text-center">No designs found. Try a different search term.</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <div className="relative laminate-dropdown-container">
                                    <input
                                      type="text"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
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
                                      placeholder="Select Laminate"
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
                                                    const inputs = document.querySelectorAll(`input[placeholder="Select Laminate"]`);
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
                                              {laminate === 'custom' ? '✎ custom (type your own)' : laminate}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="px-4 py-3 text-sm text-gray-400 text-center">No laminates found. Type to search or select "custom" to enter your own.</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <div className="relative laminate-dropdown-container">
                                    <input
                                      type="text"
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
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
                                      placeholder="Select Laminate"
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
                                                    const inputs = document.querySelectorAll(`input[placeholder="Select Laminate"]`);
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
                                              {laminate === 'same as front' ? '✓ same as front' : (laminate === 'custom' ? '✎ custom (type your own)' : laminate)}
                                            </div>
                                          ))
                                        ) : (
                                          <div className="px-4 py-3 text-sm text-gray-400 text-center">No laminates found. Type to search or select "custom" to enter your own.</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.gel_colour}
                                    onChange={(e) => updateDoorRequirement(index, 'gel_colour', e.target.value)}
                                    placeholder="Enter gel colour"
                                  />
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  {req.grade === 'custom' || (req.grade && req.grade !== 'MR' && req.grade !== 'PF') ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                        value={req.grade === 'custom' ? '' : req.grade}
                                        onChange={(e) => updateDoorRequirement(index, 'grade', e.target.value)}
                                        onBlur={(e) => {
                                          if (!e.target.value.trim()) {
                                            updateDoorRequirement(index, 'grade', '');
                                          }
                                        }}
                                        placeholder="Enter custom grade"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateDoorRequirement(index, 'grade', '')}
                                        className="text-xs text-gray-500 hover:text-gray-700 px-2"
                                        title="Back to dropdown"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ) : (
                                    <select
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                      value={req.grade || ''}
                                      onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                          updateDoorRequirement(index, 'grade', 'custom');
                                        } else {
                                          updateDoorRequirement(index, 'grade', e.target.value);
                                        }
                                      }}
                                    >
                                      <option value="">Select Grade</option>
                                      <option value="MR">MR</option>
                                      <option value="PF">PF</option>
                                      <option value="custom">custom</option>
                                    </select>
                                  )}
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  {req.side_frame === 'Custom' || (req.side_frame && req.side_frame !== 'Pinewood' && req.side_frame !== 'Nimwood') ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                        value={req.side_frame === 'Custom' ? '' : req.side_frame}
                                        onChange={(e) => updateDoorRequirement(index, 'side_frame', e.target.value)}
                                        onBlur={(e) => {
                                          if (!e.target.value.trim()) {
                                            updateDoorRequirement(index, 'side_frame', '');
                                          }
                                        }}
                                        placeholder="Enter custom side frame"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateDoorRequirement(index, 'side_frame', '')}
                                        className="text-xs text-gray-500 hover:text-gray-700 px-2"
                                        title="Back to dropdown"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ) : (
                                    <select
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
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
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.filler}
                                    onChange={(e) => updateDoorRequirement(index, 'filler', e.target.value)}
                                    placeholder="Enter filler"
                                  />
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.foam_bottom}
                                    onChange={(e) => updateDoorRequirement(index, 'foam_bottom', e.target.value)}
                                  >
                                    <option value="">Select</option>
                                    <option value="External">External</option>
                                    <option value="Internal">Internal</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3 bg-white border-r border-gray-300">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    value={req.frp_coating}
                                    onChange={(e) => updateDoorRequirement(index, 'frp_coating', e.target.value)}
                                    placeholder="Enter FRP coating"
                                  />
                                </td>
                                <td className="px-4 py-3 bg-white text-center">
                                  {doorRequirements.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeDoorRequirement(index)}
                                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
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
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 9. Purchase Order Status */}
            <div className="bg-white rounded-lg shadow">
              <SectionHeader id="status" title="8. Purchase Order Status" />
              {expandedSections.has('status') && (
                <div className="p-6 space-y-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Order Status</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        value={status.customer_status}
                        onChange={(e) => setStatus({ ...status, customer_status: e.target.value })}
                      >
                        <option value="PO_OK">PO_OK</option>
                        <option value="NO_PO">NO_PO</option>
                        <option value="PO_OK Hold By Party">PO_OK Hold By Party</option>
                        <option value="PO_OK No Measurement">PO_OK No Measurement</option>
                        <option value="Measurement Received NO_PO">Measurement Received NO_PO</option>
                        <option value="Hold By Authority">Hold By Authority</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                        value="Auto-set based on your role"
                        disabled
                        title="Approval status is automatically set: Measurement Captains create with 'Pending Approval', Production Managers create with 'Approved'"
                      />
                    </div>
                  </div>

                  {/* PO Or other Reference Upload */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">PO Or other Reference</label>
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
                                  setError('File size must be less than 10MB');
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
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Remove file"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        {poDocumentPreview && (
                          <div className="mt-3">
                            <img
                              src={poDocumentPreview}
                              alt="Preview"
                              className="max-w-full h-auto max-h-48 rounded border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="bg-white rounded-lg shadow p-6 sticky bottom-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-base font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {isLoading ? 'Creating...' : 'Create Party'}
                  </button>
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-base font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    title="Clear all draft data"
                  >
                    <X className="w-4 h-4" />
                    Clear Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        setShowSaveDialog(true);
                        pendingNavigationRef.current = () => navigate('/parties');
                      } else {
                        navigate('/parties');
                      }
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-base font-medium"
                  >
                    Cancel
                  </button>
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Auto-saving...
                  </span>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Party Successfully Created!
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Your party has been created successfully. You can now create a measurement for this party.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowSuccessDialog(false);
                  if (createdPartyId) {
                    navigate(`/measurement-captain/measurements/create?party_id=${createdPartyId}`);
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Measurement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
