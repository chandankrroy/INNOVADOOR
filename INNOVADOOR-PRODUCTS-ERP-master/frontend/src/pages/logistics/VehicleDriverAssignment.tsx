import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import LogisticsSidebar from '../../components/LogisticsSidebar';
import LogisticsNavbar from '../../components/LogisticsNavbar';
import { api } from '../../lib/api';
import { Truck, User, Plus, Edit, Save, X, Calendar } from 'lucide-react';

export default function VehicleDriverAssignment() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [searchParams] = useSearchParams();
  const dispatchIdParam = searchParams.get('dispatch_id');

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [selectedDispatch, setSelectedDispatch] = useState<any>(null);
  const [availableDispatches, setAvailableDispatches] = useState<any[]>([]);

  const [vehicleForm, setVehicleForm] = useState({
    vehicle_no: '',
    vehicle_type: 'Truck',
    capacity_tonnes: '',
    capacity_cubic_meters: '',
    is_available: true,
    gps_enabled: false,
    insurance_expiry: '',
    registration_expiry: '',
    remarks: '',
  });

  const [driverForm, setDriverForm] = useState({
    name: '',
    mobile: '',
    license_number: '',
    license_expiry: '',
    address: '',
    is_active: true,
    remarks: '',
  });

  const [assignmentForm, setAssignmentForm] = useState({
    dispatch_id: dispatchIdParam ? parseInt(dispatchIdParam) : 0,
    vehicle_id: 0,
    driver_id: 0,
    planned_delivery_date: '',
    route_area: '',
    assignment_notes: '',
  });

  useEffect(() => {
    fetchData();
    if (dispatchIdParam) {
      fetchAvailableDispatches();
    }
  }, [dispatchIdParam]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehiclesData, driversData, assignmentsData] = await Promise.all([
        api.get('/logistics/vehicles'),
        api.get('/logistics/drivers?active_only=true'),
        api.get('/logistics/assignments'),
      ]);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setDrivers(Array.isArray(driversData) ? driversData : []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDispatches = async () => {
    try {
      const data = await api.get('/logistics/assigned-orders?status_filter=approved');
      setAvailableDispatches(Array.isArray(data) ? data : []);
      const dispatch = data.find((d: any) => d.id === parseInt(dispatchIdParam || '0'));
      if (dispatch) {
        setSelectedDispatch(dispatch);
        setAssignmentForm(prev => ({ ...prev, dispatch_id: dispatch.id }));
      }
    } catch (error) {
      console.error('Error fetching dispatches:', error);
    }
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await api.put(`/logistics/vehicles/${editingVehicle.id}`, vehicleForm);
      } else {
        await api.post('/logistics/vehicles', vehicleForm);
      }
      setShowVehicleForm(false);
      setEditingVehicle(null);
      setVehicleForm({
        vehicle_no: '',
        vehicle_type: 'Truck',
        capacity_tonnes: '',
        capacity_cubic_meters: '',
        is_available: true,
        gps_enabled: false,
        insurance_expiry: '',
        registration_expiry: '',
        remarks: '',
      });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error saving vehicle');
    }
  };

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await api.put(`/logistics/drivers/${editingDriver.id}`, driverForm);
      } else {
        await api.post('/logistics/drivers', driverForm);
      }
      setShowDriverForm(false);
      setEditingDriver(null);
      setDriverForm({
        name: '',
        mobile: '',
        license_number: '',
        license_expiry: '',
        address: '',
        is_active: true,
        remarks: '',
      });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error saving driver');
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.dispatch_id || !assignmentForm.vehicle_id || !assignmentForm.driver_id) {
      alert('Please select dispatch, vehicle, and driver');
      return;
    }
    try {
      await api.post('/logistics/assignments', assignmentForm);
      setShowAssignmentForm(false);
      setAssignmentForm({
        dispatch_id: 0,
        vehicle_id: 0,
        driver_id: 0,
        planned_delivery_date: '',
        route_area: '',
        assignment_notes: '',
      });
      fetchData();
      alert('Assignment created successfully!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error creating assignment');
    }
  };

  if (!currentUser || !['logistics_manager', 'logistics_executive', 'admin'].includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const canManage = currentUser.role === 'logistics_manager' || currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <LogisticsNavbar />
      <LogisticsSidebar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-[65px]`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Vehicle & Driver Assignment</h1>
            <p className="text-gray-600 mt-2">Manage vehicles, drivers, and assignments</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setShowAssignmentForm(false)}
                className="px-6 py-3 text-sm font-medium text-gray-700 border-b-2 border-blue-600"
              >
                Assignments
              </button>
              {canManage && (
                <>
                  <button
                    onClick={() => {
                      setShowVehicleForm(true);
                      setShowDriverForm(false);
                      setShowAssignmentForm(false);
                    }}
                    className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Vehicles
                  </button>
                  <button
                    onClick={() => {
                      setShowDriverForm(true);
                      setShowVehicleForm(false);
                      setShowAssignmentForm(false);
                    }}
                    className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Drivers
                  </button>
                </>
              )}
            </div>

            <div className="p-6">
              {/* Assignments View */}
              {!showVehicleForm && !showDriverForm && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Assignments</h2>
                    {canManage && (
                      <button
                        onClick={() => setShowAssignmentForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-block flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Assignment
                      </button>
                    )}
                  </div>
                  {loading ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">Loading assignments...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {assignments.map((assignment) => (
                            <tr key={assignment.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assignment.dispatch_number}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.vehicle_no}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.driver_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(assignment.planned_delivery_date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  assignment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                  assignment.status === 'in_transit' ? 'bg-purple-100 text-purple-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {assignment.status.replace('_', ' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Vehicle Management */}
              {showVehicleForm && canManage && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Vehicles</h2>
                    <button
                      onClick={() => {
                        setEditingVehicle(null);
                        setVehicleForm({
                          vehicle_no: '',
                          vehicle_type: 'Truck',
                          capacity_tonnes: '',
                          capacity_cubic_meters: '',
                          is_available: true,
                          gps_enabled: false,
                          insurance_expiry: '',
                          registration_expiry: '',
                          remarks: '',
                        });
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-block flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Vehicle
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vehicles.map((vehicle) => (
                          <tr key={vehicle.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.vehicle_no}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.vehicle_type}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${vehicle.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {vehicle.is_available ? 'Available' : 'In Use'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => {
                                  setEditingVehicle(vehicle);
                                  setVehicleForm({
                                    vehicle_no: vehicle.vehicle_no,
                                    vehicle_type: vehicle.vehicle_type,
                                    capacity_tonnes: vehicle.capacity_tonnes?.toString() || '',
                                    capacity_cubic_meters: vehicle.capacity_cubic_meters?.toString() || '',
                                    is_available: vehicle.is_available,
                                    gps_enabled: vehicle.gps_enabled,
                                    insurance_expiry: vehicle.insurance_expiry || '',
                                    registration_expiry: vehicle.registration_expiry || '',
                                    remarks: vehicle.remarks || '',
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Driver Management */}
              {showDriverForm && canManage && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Drivers</h2>
                    <button
                      onClick={() => {
                        setEditingDriver(null);
                        setDriverForm({
                          name: '',
                          mobile: '',
                          license_number: '',
                          license_expiry: '',
                          address: '',
                          is_active: true,
                          remarks: '',
                        });
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-block flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Driver
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {drivers.map((driver) => (
                          <tr key={driver.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{driver.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.mobile}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.license_number}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${driver.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {driver.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => {
                                  setEditingDriver(driver);
                                  setDriverForm({
                                    name: driver.name,
                                    mobile: driver.mobile,
                                    license_number: driver.license_number,
                                    license_expiry: driver.license_expiry || '',
                                    address: driver.address || '',
                                    is_active: driver.is_active,
                                    remarks: driver.remarks || '',
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Form Modal */}
          {showAssignmentForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Create Assignment</h3>
                  <button onClick={() => setShowAssignmentForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleAssignmentSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Order</label>
                    <select
                      required
                      value={assignmentForm.dispatch_id}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, dispatch_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="0">Select Dispatch Order</option>
                      {availableDispatches.filter(d => !d.is_assigned).map((dispatch) => (
                        <option key={dispatch.id} value={dispatch.id}>
                          {dispatch.dispatch_number} - {dispatch.party_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                    <select
                      required
                      value={assignmentForm.vehicle_id}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, vehicle_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="0">Select Vehicle</option>
                      {vehicles.filter(v => v.is_available).map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicle_no} ({vehicle.vehicle_type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                    <select
                      required
                      value={assignmentForm.driver_id}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, driver_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="0">Select Driver</option>
                      {drivers.filter(d => d.is_active).map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} ({driver.mobile})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planned Delivery Date</label>
                    <input
                      type="date"
                      required
                      value={assignmentForm.planned_delivery_date}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, planned_delivery_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Route/Area</label>
                    <input
                      type="text"
                      value={assignmentForm.route_area}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, route_area: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., North Zone, Mumbai"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={assignmentForm.assignment_notes}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, assignment_notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowAssignmentForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Create Assignment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Vehicle Form Modal */}
          {(showVehicleForm || editingVehicle) && canManage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-xl font-bold">{editingVehicle ? 'Edit' : 'Add'} Vehicle</h3>
                  <button onClick={() => { setShowVehicleForm(false); setEditingVehicle(null); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleVehicleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                      <input
                        type="text"
                        required
                        value={vehicleForm.vehicle_no}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_no: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type *</label>
                      <select
                        required
                        value={vehicleForm.vehicle_type}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option>Truck</option>
                        <option>Tempo</option>
                        <option>Container</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Tonnes)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={vehicleForm.capacity_tonnes}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, capacity_tonnes: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Cubic Meters)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={vehicleForm.capacity_cubic_meters}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, capacity_cubic_meters: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry</label>
                      <input
                        type="date"
                        value={vehicleForm.insurance_expiry}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, insurance_expiry: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Expiry</label>
                      <input
                        type="date"
                        value={vehicleForm.registration_expiry}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, registration_expiry: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={vehicleForm.is_available}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, is_available: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Available</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={vehicleForm.gps_enabled}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, gps_enabled: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">GPS Enabled</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea
                      value={vehicleForm.remarks}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, remarks: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => { setShowVehicleForm(false); setEditingVehicle(null); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      {editingVehicle ? 'Update' : 'Create'} Vehicle
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Driver Form Modal */}
          {(showDriverForm || editingDriver) && canManage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-xl font-bold">{editingDriver ? 'Edit' : 'Add'} Driver</h3>
                  <button onClick={() => { setShowDriverForm(false); setEditingDriver(null); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleDriverSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        required
                        value={driverForm.name}
                        onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                      <input
                        type="tel"
                        required
                        value={driverForm.mobile}
                        onChange={(e) => setDriverForm({ ...driverForm, mobile: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                      <input
                        type="text"
                        required
                        value={driverForm.license_number}
                        onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry</label>
                      <input
                        type="date"
                        value={driverForm.license_expiry}
                        onChange={(e) => setDriverForm({ ...driverForm, license_expiry: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={driverForm.address}
                      onChange={(e) => setDriverForm({ ...driverForm, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={driverForm.is_active}
                        onChange={(e) => setDriverForm({ ...driverForm, is_active: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea
                      value={driverForm.remarks}
                      onChange={(e) => setDriverForm({ ...driverForm, remarks: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => { setShowDriverForm(false); setEditingDriver(null); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      {editingDriver ? 'Update' : 'Create'} Driver
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
