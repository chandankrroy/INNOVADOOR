import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import AdminNavbar from '../../components/AdminNavbar';
import { useSidebar } from '../../context/SidebarContext';
import { api } from '../../lib/api';
import { Plus, Edit, Trash2, UserCheck, UserX, Search, Users, Building2 } from 'lucide-react';

interface Supervisor {
  id: number;
  user_id: number;
  department_id: number;
  supervisor_type: string;
  shift: string | null;
  is_active: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  department?: {
    id: number;
    name: string;
  };
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Department {
  id: number;
  name: string;
}

const SUPERVISOR_TYPES = [
  'Loading & Unloading',
  'Sanding',
  'Cutting',
  'Laminate',
  'Grooving',
  'Frame'
];

const SHIFTS = ['Morning', 'Evening', 'Night'];

export default function AdminSupervisorManagement() {
  const { isCollapsed, isHovered } = useSidebar();
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateDepartmentModal, setShowCreateDepartmentModal] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    department_id: '',
    supervisor_type: '',
    shift: '',
    is_active: true
  });
  const [departmentFormData, setDepartmentFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [supervisorsData, usersData, departmentsData] = await Promise.all([
        api.get('/admin/supervisors', true),
        api.get('/admin/users', true),
        api.get('/admin/departments', true)
      ]);
      setSupervisors(supervisorsData);
      setUsers(usersData.filter((u: User) => u.role === 'production_supervisor' || u.role === 'user'));
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        user_id: parseInt(formData.user_id),
        department_id: parseInt(formData.department_id),
        supervisor_type: formData.supervisor_type,
        shift: formData.shift || null,
        is_active: formData.is_active
      };
      
      await api.post('/admin/supervisors', payload, true);
      setShowCreateModal(false);
      setFormData({ user_id: '', department_id: '', supervisor_type: '', shift: '', is_active: true });
      fetchData();
    } catch (error: any) {
      console.error('Error creating supervisor:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error creating supervisor';
      alert(errorMessage);
    }
  };

  const handleUpdateSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupervisor) return;
    try {
      const payload: any = {
        is_active: formData.is_active
      };
      
      if (formData.department_id) {
        payload.department_id = parseInt(formData.department_id);
      }
      if (formData.supervisor_type) {
        payload.supervisor_type = formData.supervisor_type;
      }
      if (formData.shift) {
        payload.shift = formData.shift;
      }
      
      await api.put(`/admin/supervisors/${editingSupervisor.id}`, payload, true);
      setEditingSupervisor(null);
      setFormData({ user_id: '', department_id: '', supervisor_type: '', shift: '', is_active: true });
      fetchData();
    } catch (error: any) {
      console.error('Error updating supervisor:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error updating supervisor';
      alert(errorMessage);
    }
  };

  const handleDeleteSupervisor = async (supervisorId: number) => {
    if (!confirm('Are you sure you want to delete this supervisor?')) return;
    try {
      await api.delete(`/admin/supervisors/${supervisorId}`, true);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting supervisor:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error deleting supervisor';
      alert(errorMessage);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/departments', {
        name: departmentFormData.name,
        code: departmentFormData.code || null,
        description: departmentFormData.description || null,
        is_active: departmentFormData.is_active
      }, true);
      setShowCreateDepartmentModal(false);
      setDepartmentFormData({ name: '', code: '', description: '', is_active: true });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.detail || error.message || 'Error creating department');
    }
  };

  const handleEdit = (supervisor: Supervisor) => {
    setEditingSupervisor(supervisor);
    setFormData({
      user_id: supervisor.user_id.toString(),
      department_id: supervisor.department_id.toString(),
      supervisor_type: supervisor.supervisor_type,
      shift: supervisor.shift || '',
      is_active: supervisor.is_active
    });
    setShowCreateModal(true);
  };

  const filteredSupervisors = supervisors.filter(supervisor =>
    supervisor.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisor.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisor.supervisor_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supervisor.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <AdminSidebar />
      <AdminNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                    Supervisor Management
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg">Manage production supervisors and their types</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setDepartmentFormData({ name: '', code: '', description: '', is_active: true });
                    setShowCreateDepartmentModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Create Department</span>
                </button>
                <button
                  onClick={() => {
                    setEditingSupervisor(null);
                    setFormData({ user_id: '', department_id: '', supervisor_type: '', shift: '', is_active: true });
                    setShowCreateModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Supervisor</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search supervisors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading supervisors...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSupervisors.map((supervisor) => (
                      <tr key={supervisor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{supervisor.user?.username || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{supervisor.user?.email || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {supervisor.supervisor_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {supervisor.department?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {supervisor.shift || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {supervisor.is_active ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center space-x-1 w-fit">
                              <UserCheck className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center space-x-1 w-fit">
                              <UserX className="w-3 h-3" />
                              <span>Inactive</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(supervisor)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSupervisor(supervisor.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Create Department Modal */}
          {showCreateDepartmentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Department</h2>
                  <form onSubmit={handleCreateDepartment}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                        <input
                          type="text"
                          required
                          value={departmentFormData.name}
                          onChange={(e) => setDepartmentFormData({ ...departmentFormData, name: e.target.value })}
                          placeholder="e.g., Sanding, Cutting, Pressing, Finishing"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department Code (Optional)</label>
                        <input
                          type="text"
                          value={departmentFormData.code}
                          onChange={(e) => setDepartmentFormData({ ...departmentFormData, code: e.target.value })}
                          placeholder="e.g., SAND, CUT, PRESS, FIN"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea
                          value={departmentFormData.description}
                          onChange={(e) => setDepartmentFormData({ ...departmentFormData, description: e.target.value })}
                          placeholder="Enter department description..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={departmentFormData.is_active}
                            onChange={(e) => setDepartmentFormData({ ...departmentFormData, is_active: e.target.checked })}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateDepartmentModal(false);
                          setDepartmentFormData({ name: '', code: '', description: '', is_active: true });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Create Department
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Create/Edit Supervisor Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {editingSupervisor ? 'Edit Supervisor' : 'Create New Supervisor'}
                  </h2>
                  <form onSubmit={editingSupervisor ? handleUpdateSupervisor : handleCreateSupervisor}>
                    <div className="space-y-4">
                      {!editingSupervisor && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                          <select
                            required
                            value={formData.user_id}
                            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Select a user</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.username} ({user.email})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Type *</label>
                        <select
                          required
                          value={formData.supervisor_type}
                          onChange={(e) => setFormData({ ...formData, supervisor_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select supervisor type</option>
                          {SUPERVISOR_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                        <select
                          required
                          value={formData.department_id}
                          onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select a department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                        <select
                          value={formData.shift}
                          onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select shift (optional)</option>
                          {SHIFTS.map((shift) => (
                            <option key={shift} value={shift}>
                              {shift}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateModal(false);
                          setEditingSupervisor(null);
                          setFormData({ user_id: '', department_id: '', supervisor_type: '', shift: '', is_active: true });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        {editingSupervisor ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

