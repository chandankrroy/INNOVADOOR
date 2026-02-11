import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import AdminNavbar from '../../components/AdminNavbar';
import { useSidebar } from '../../context/SidebarContext';
import { api, getErrorMessage } from '../../lib/api';
import { FileText } from 'lucide-react';

interface ProductionDocsSettings {
  id: number;
  auto_generate_rm_frame: boolean;
  auto_generate_rm_shutter: boolean;
}

export default function AdminProductionDocsSettings() {
  const { isCollapsed, isHovered } = useSidebar();
  const [settings, setSettings] = useState<ProductionDocsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get('/production/docs-settings', true);
        setSettings(data);
      } catch (err: any) {
        console.error('Failed to load Production Docs settings', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async (nextSettings: ProductionDocsSettings) => {
    try {
      setSaving(true);
      setError(null);
      const payload = {
        auto_generate_rm_frame: nextSettings.auto_generate_rm_frame,
        auto_generate_rm_shutter: nextSettings.auto_generate_rm_shutter,
      };
      const updated = await api.put('/production/docs-settings', payload, true);
      setSettings(updated);
      setSuccess('Settings saved.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to save Production Docs settings', err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ProductionDocsSettings, value: boolean) => {
    if (!settings) return;
    setSuccess(null);
    setError(null);
    const next = { ...settings, [field]: value };
    setSettings(next);
    saveSettings(next);
  };

  const handleSave = async () => {
    if (!settings) return;
    await saveSettings(settings);
  };

  const disabled = loading || !settings;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <AdminSidebar />
      <AdminNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Production Docs
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Control automatic Raw Material Paper generation for Production Papers.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 lg:p-8">
              {loading && (
                <p className="text-sm text-gray-500">Loading settings...</p>
              )}
              {!loading && error && (
                <p className="text-sm text-red-600 mb-4">{error}</p>
              )}
              {!loading && !error && settings && (
                <>
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">Automatic RM Paper Generation</h2>
                      <p className="text-sm text-gray-600">
                        When enabled, the system will automatically mirror a Raw Material Paper when a Production Paper
                        is created for the corresponding category. Manual generation and regeneration remain available.
                      </p>
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                        Only <strong>Admin</strong> can change these settings. Shutter auto-generation runs only when the new
                        Shutter production paper has measurement items selected; otherwise create the RM paper manually from the paper view.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Auto-generate RM for Shutters</p>
                          <p className="text-sm text-gray-600">
                            Automatically create a Raw Material Paper when a Shutter Production Paper is created.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            updateField('auto_generate_rm_shutter', !settings.auto_generate_rm_shutter)
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.auto_generate_rm_shutter ? 'bg-green-500' : 'bg-gray-300'
                          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              settings.auto_generate_rm_shutter ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Auto-generate RM for Frames</p>
                          <p className="text-sm text-gray-600">
                            Stored for future use. Frame Raw Material Paper auto-generation will use this setting once
                            implemented.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            updateField('auto_generate_rm_frame', !settings.auto_generate_rm_frame)
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.auto_generate_rm_frame ? 'bg-green-500' : 'bg-gray-300'
                          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              settings.auto_generate_rm_frame ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      {success && <p className="text-sm text-green-600">{success}</p>}
                      {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={disabled || saving}
                      className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

