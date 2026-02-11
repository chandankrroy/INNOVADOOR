import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import CRMSidebar from '../../components/CRMSidebar';
import CRMNavbar from '../../components/CRMNavbar';
import { api } from '../../lib/api';
import { MessageSquare, AtSign, Send, Clock, User } from 'lucide-react';

interface Communication {
  id: number;
  production_paper: string;
  party_name: string;
  message: string;
  mentionedUsers: string[];
  createdBy: string;
  createdAt: string;
  type: 'delay' | 'qc_fail' | 'reschedule' | 'dispatch' | 'general';
}

export default function CommunicationUpdates() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunications = async () => {
      if (currentUser?.role === 'crm_manager') {
        try {
          setLoading(true);
          // Mock communications (would come from backend)
          const mockCommunications: Communication[] = [
            {
              id: 1,
              production_paper: 'PP-1023',
              party_name: 'ABC Builder',
              message: 'Order delayed due to material shortage. Expected delivery pushed by 3 days.',
              mentionedUsers: ['supervisor_ramesh'],
              createdBy: 'Production Manager',
              createdAt: new Date().toISOString(),
              type: 'delay',
            },
            {
              id: 2,
              production_paper: 'PP-1024',
              party_name: 'XYZ Developers',
              message: 'QC failed for batch 1. @supervisor_ramesh please review and rework.',
              mentionedUsers: ['supervisor_ramesh'],
              createdBy: 'Quality Checker',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              type: 'qc_fail',
            },
          ];
          setCommunications(mockCommunications);
        } catch (error) {
          console.error('Error fetching communications:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCommunications();
  }, [currentUser?.role]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedOrder) return;

    const mentionedUsers = newMessage.match(/@\w+/g)?.map(m => m.substring(1)) || [];
    
    const newComm: Communication = {
      id: communications.length + 1,
      production_paper: selectedOrder,
      party_name: 'N/A',
      message: newMessage,
      mentionedUsers: mentionedUsers,
      createdBy: currentUser?.username || 'User',
      createdAt: new Date().toISOString(),
      type: 'general',
    };

    setCommunications([newComm, ...communications]);
    setNewMessage('');
    setSelectedOrder('');
  };

  if (currentUser?.role !== 'crm_manager') {
    return null;
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'delay': return 'bg-red-100 text-red-800 border-red-200';
      case 'qc_fail': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reschedule': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dispatch': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20">
      <CRMSidebar />
      <CRMNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              Communication & Updates
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Central communication hub for order updates and alerts</p>
          </div>

          {/* New Message Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Update</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Production Paper
                </label>
                <input
                  type="text"
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  placeholder="e.g., PP-1023"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Use @username to mention)
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here. Use @username to mention team members..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleSendMessage}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Send Update</span>
              </button>
            </div>
          </div>

          {/* Communications List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Recent Updates</h2>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              ) : communications.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No communications yet
                </div>
              ) : (
                communications.map((comm) => (
                  <div key={comm.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {comm.production_paper} - {comm.party_name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <User className="w-3 h-3 mr-1" />
                            {comm.createdBy}
                            <Clock className="w-3 h-3 ml-2 mr-1" />
                            {new Date(comm.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(comm.type)}`}>
                        {comm.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{comm.message}</p>
                    {comm.mentionedUsers.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <AtSign className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-wrap gap-2">
                          {comm.mentionedUsers.map((user, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                              @{user}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

