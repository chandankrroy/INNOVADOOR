import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import AdminSidebar from '../components/AdminSidebar';
import RawMaterialSidebar from '../components/RawMaterialSidebar';
import CRMSidebar from '../components/CRMSidebar';
import BillingSidebar from '../components/BillingSidebar';
import DispatchSidebar from '../components/DispatchSidebar';
import LogisticsSidebar from '../components/LogisticsSidebar';
import SupervisorSidebar from '../components/SupervisorSidebar';
import ProductionSchedulerSidebar from '../components/ProductionSchedulerSidebar';
import QualityCheckSidebar from '../components/QualityCheckSidebar';
import SiteSupervisorSidebar from '../components/SiteSupervisorSidebar';
import CarpenterCaptainSidebar from '../components/CarpenterCaptainSidebar';
import MeasurementCaptainSidebar from '../components/MeasurementCaptainSidebar';
import SalesSidebar from '../components/SalesSidebar';
import AccountsSidebar from '../components/AccountsSidebar';
import PurchaseSidebar from '../components/PurchaseSidebar';
import Navbar from '../components/Navbar';
import AdminNavbar from '../components/AdminNavbar';
import RawMaterialNavbar from '../components/RawMaterialNavbar';
import CRMNavbar from '../components/CRMNavbar';
import SupervisorNavbar from '../components/SupervisorNavbar';
import ProductionSchedulerNavbar from '../components/ProductionSchedulerNavbar';
import QualityCheckNavbar from '../components/QualityCheckNavbar';
import SalesNavbar from '../components/SalesNavbar';
import AccountsNavbar from '../components/AccountsNavbar';
import PurchaseNavbar from '../components/PurchaseNavbar';
import LogisticsNavbar from '../components/LogisticsNavbar';
import { api } from '../lib/api';
import { User, Upload, Eye, Edit, ArrowLeft, LogOut } from 'lucide-react';

export default function Profile() {
  const { currentUser, updateUser, logout, loading: authLoading } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string | null>(currentUser?.profile_image || null);
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState<'view' | 'edit'>('view');

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show message if no user
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No User Found</h1>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Update form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileImage(currentUser.profile_image || null);
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfileImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const updateData: any = {};
      if (username !== currentUser?.username) updateData.username = username;
      if (email !== currentUser?.email) updateData.email = email;
      if (profileImage !== currentUser?.profile_image) updateData.profile_image = profileImage;

      if (Object.keys(updateData).length === 0) {
        setMessage({ type: 'error', text: 'No changes to save' });
        setLoading(false);
        return;
      }

      const updatedUser = await api.put('/auth/profile', updateData);
      updateUser(updatedUser);

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Render all sidebars - they self-filter based on role */}
      <Sidebar />
      <AdminSidebar />
      <RawMaterialSidebar />
      <CRMSidebar />
      <BillingSidebar />
      <DispatchSidebar />
      <LogisticsSidebar />
      <SupervisorSidebar />
      <ProductionSchedulerSidebar />
      <QualityCheckSidebar />
      <SiteSupervisorSidebar />
      <CarpenterCaptainSidebar />
      <MeasurementCaptainSidebar />
      <SalesSidebar />
      <AccountsSidebar />
      <PurchaseSidebar />

      {/* Render all navbars - they self-filter based on role */}
      <Navbar />
      <AdminNavbar />
      <RawMaterialNavbar />
      <CRMNavbar />
      <SupervisorNavbar />
      <ProductionSchedulerNavbar />
      <QualityCheckNavbar />
      <SalesNavbar />
      <AccountsNavbar />
      <PurchaseNavbar />
      <LogisticsNavbar />

      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'md:ml-20' : 'md:ml-64'} ml-0 pt-16 min-h-screen`}>
        <div className="flex flex-col md:flex-row gap-6 p-4 md:p-8">
          {/* Profile Navigation Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0 relative z-10">
            <div className="bg-white rounded-lg shadow p-4 md:sticky md:top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection('view')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'view'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Eye className="w-5 h-5" />
                  <span className="font-medium">View Profile</span>
                </button>
                <button
                  onClick={() => setActiveSection('edit')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeSection === 'edit'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Edit className="w-5 h-5" />
                  <span className="font-medium">Edit Profile</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0 relative z-10">
            <div className="mb-8 flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                <p className="text-gray-600 mt-2">Manage your profile information</p>
              </div>
            </div>

            {message && (
              <div className={`mb-4 p-4 rounded-md ${message.type === 'success'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
                }`}>
                {message.text}
              </div>
            )}

            {activeSection === 'view' ? (
              /* View Profile Section */
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Profile Image Section */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={currentUser?.username}
                          className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                          <User className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-4">{currentUser?.username}</p>
                  </div>

                  {/* Profile Information Display */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Username
                      </label>
                      <p className="text-lg font-semibold text-gray-900">{currentUser?.username || 'N/A'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Email
                      </label>
                      <p className="text-lg font-semibold text-gray-900">{currentUser?.email || 'N/A'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Role
                      </label>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {currentUser?.role?.replace(/_/g, ' ') || 'N/A'}
                      </p>
                    </div>

                    <div className="pt-6 mt-6 border-t border-gray-100">
                      <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all font-medium"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Profile Section */
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Profile Image Section */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={currentUser?.username}
                          className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                          <User className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Click to upload</p>
                  </div>

                  {/* Profile Information Form */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        value={currentUser?.role || ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>

                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
