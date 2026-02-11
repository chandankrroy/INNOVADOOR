import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import AdminNavbar from '../../components/AdminNavbar';
import { useSidebar } from '../../context/SidebarContext';
import { api } from '../../lib/api';
import { Plus, Edit, Trash2, UserCheck, UserX, Search, Hash } from 'lucide-react';

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
  serial_number_prefix?: string | null;
  serial_number_counter?: number;
  created_at: string;
}

export default function AdminUserManagement() {
  const { isCollapsed, isHovered } = useSidebar();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrefixModal, setShowPrefixModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [prefixUser, setPrefixUser] = useState<User | null>(null);
  const [prefixValue, setPrefixValue] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    role: 'user',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/users', true); // requireAuth = true
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', formData, true); // requireAuth = true
      setShowCreateModal(false);
      setFormData({ email: '', username: '', role: 'user', password: '' });
      fetchUsers();
    } catch (error: any) {
      alert(error.message || error.response?.data?.detail || 'Error creating user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.put(`/admin/users/${editingUser.id}`, {
        email: formData.email,
        username: formData.username,
        profile_image: null
      }, true); // requireAuth = true
      setEditingUser(null);
      setFormData({ email: '', username: '', role: 'user', password: '' });
      fetchUsers();
    } catch (error: any) {
      alert(error.message || error.response?.data?.detail || 'Error updating user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`, true); // requireAuth = true
      fetchUsers();
    } catch (error: any) {
      alert(error.message || error.response?.data?.detail || 'Error deleting user');
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-active`, {}, true); // requireAuth = true
      fetchUsers();
    } catch (error: any) {
      alert(error.message || error.response?.data?.detail || 'Error updating user status');
    }
  };

  const handleAssignPrefix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefixUser) return;
    
    // Validate prefix: single uppercase letter A-Z
    if (!/^[A-Z]$/.test(prefixValue)) {
      alert('Prefix must be a single uppercase letter (A-Z)');
      return;
    }

    try {
      const response = await api.post(`/admin/users/${prefixUser.id}/assign-serial-prefix`, { prefix: prefixValue.toUpperCase() }, true);
      setShowPrefixModal(false);
      setPrefixUser(null);
      setPrefixValue('');
      fetchUsers();
      alert('Serial number prefix assigned successfully!');
    } catch (error: any) {
      console.error('Error assigning prefix:', error);
      const errorMessage = error?.message || error?.response?.data?.detail || 'Error assigning prefix. Please check if the backend server is running.';
      alert(errorMessage);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        <AdminSidebar />
        <AdminNavbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <AdminSidebar />
      <AdminNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600">Manage system users and permissions</p>
            </div>
            <button
              onClick={() => {
                setEditingUser(null);
                setFormData({ email: '', username: '', role: 'user', password: '' });
                setShowCreateModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add User</span>
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Prefix</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 capitalize">
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(user.role === 'measurement_captain' || user.role === 'production_manager') ? (
                          user.serial_number_prefix ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.serial_number_prefix}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Not Assigned
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setFormData({
                                email: user.email,
                                username: user.username,
                                role: user.role,
                                password: ''
                              });
                              setShowCreateModal(true);
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(user.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.is_active
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          {(user.role === 'measurement_captain' || user.role === 'production_manager') && (
                            <button
                              onClick={() => {
                                setPrefixUser(user);
                                setPrefixValue(user.serial_number_prefix || '');
                                setShowPrefixModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Assign Serial Prefix"
                            >
                              <Hash className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
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
          </div>

          {/* Assign Serial Prefix Modal */}
          {showPrefixModal && prefixUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Assign Serial Number Prefix
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Assign a unique letter prefix (A-Z) for user <strong>{prefixUser.username}</strong> (Measurement Captain).
                    Serial numbers will be generated in the format: <strong>{prefixValue || 'X'}00001</strong>, <strong>{prefixValue || 'X'}00002</strong>, etc.
                  </p>
                  <form onSubmit={handleAssignPrefix}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prefix (Single Letter A-Z) *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={1}
                          value={prefixValue}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                            setPrefixValue(val);
                          }}
                          placeholder="A"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl font-bold"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Enter a single uppercase letter (A-Z). Each Measurement Captain must have a unique prefix.
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Assign Prefix
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPrefixModal(false);
                          setPrefixUser(null);
                          setPrefixValue('');
                        }}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Create/Edit Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {editingUser ? 'Edit User' : 'Create New User'}
                  </h2>
                  <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                          type="text"
                          required
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      {!editingUser && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                              type="password"
                              required
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="user">General User</option>

                          {/* Production module */}
                          <option value="production_manager">Production Management - Manager</option>
                          <option value="production_scheduler">Production Management - Scheduler</option>
                          <option value="production_supervisor">Production Management - Supervisor</option>

                          {/* Raw Material module */}
                          <option value="raw_material_checker">Raw Material Management</option>

                          {/* Quality module */}
                          <option value="quality_checker">Quality Control</option>

                          {/* CRM module */}
                          <option value="crm_manager">CRM</option>

                          {/* Purchase Management module */}
                          <option value="purchase_executive">Purchase Management - Executive</option>
                          <option value="purchase_manager">Purchase Management - Manager</option>
                          <option value="store_incharge">Purchase Management - Store Incharge</option>

                          {/* Site / other modules */}
                          <option value="site_supervisor">Site Supervisor</option>

                          {/* Admin module */}
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-6 flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        {editingUser ? 'Update' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateModal(false);
                          setEditingUser(null);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
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

