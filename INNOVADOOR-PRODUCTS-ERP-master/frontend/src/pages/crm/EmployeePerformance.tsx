import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import CRMSidebar from '../../components/CRMSidebar';
import CRMNavbar from '../../components/CRMNavbar';
import { api } from '../../lib/api';
import { Users, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface SupervisorMetrics {
  name: string;
  tasksAssigned: number;
  tasksCompleted: number;
  delayPercent: number;
  reworkPercent: number;
}

interface EmployeeMetrics {
  name: string;
  attendance: number;
  workHours: number;
  outputQuantity: number;
  errorCount: number;
}

export default function EmployeePerformance() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [supervisors, setSupervisors] = useState<SupervisorMetrics[]>([]);
  const [employees, setEmployees] = useState<EmployeeMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (currentUser?.role === 'crm_manager') {
        try {
          setLoading(true);
          const [tracking, tasks] = await Promise.all([
            api.get('/production/tracking').catch(() => []),
            api.get('/supervisor/tasks').catch(() => []),
          ]);

          const trackingList = Array.isArray(tracking) ? tracking : [];
          const tasksList = Array.isArray(tasks) ? tasks : [];

          // Calculate supervisor metrics
          const supervisorMap = new Map<string, SupervisorMetrics>();
          
          tasksList.forEach((task: any) => {
            const supervisorName = task.supervisor_name || 'Unknown';
            if (!supervisorMap.has(supervisorName)) {
              supervisorMap.set(supervisorName, {
                name: supervisorName,
                tasksAssigned: 0,
                tasksCompleted: 0,
                delayPercent: 0,
                reworkPercent: 0,
              });
            }
            const metrics = supervisorMap.get(supervisorName)!;
            metrics.tasksAssigned++;
            if (task.status === 'Completed') {
              metrics.tasksCompleted++;
            }
          });

          const supervisorMetrics = Array.from(supervisorMap.values()).map(s => ({
            ...s,
            delayPercent: s.tasksAssigned > 0 ? Math.round((s.tasksAssigned - s.tasksCompleted) / s.tasksAssigned * 100) : 0,
            reworkPercent: 0, // Would need rework data
          }));

          setSupervisors(supervisorMetrics);

          // Mock employee metrics (would need HR integration)
          const employeeMetrics: EmployeeMetrics[] = [
            { name: 'Operator 1', attendance: 95, workHours: 8, outputQuantity: 120, errorCount: 2 },
            { name: 'Operator 2', attendance: 98, workHours: 8, outputQuantity: 135, errorCount: 1 },
            { name: 'Operator 3', attendance: 92, workHours: 7.5, outputQuantity: 110, errorCount: 3 },
          ];
          setEmployees(employeeMetrics);

        } catch (error) {
          console.error('Error fetching performance data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPerformanceData();
  }, [currentUser?.role]);

  if (currentUser?.role !== 'crm_manager') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20">
      <CRMSidebar />
      <CRMNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
              Employee & Supervisor Performance
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Track efficiency and productivity metrics</p>
          </div>

          {/* Supervisor Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Supervisor Metrics</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks Assigned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delay %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rework %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : supervisors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No supervisor data available
                      </td>
                    </tr>
                  ) : (
                    supervisors.map((supervisor, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {supervisor.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {supervisor.tasksAssigned}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {supervisor.tasksCompleted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${
                            supervisor.delayPercent > 30 ? 'text-red-600' :
                            supervisor.delayPercent > 10 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {supervisor.delayPercent}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${
                            supervisor.reworkPercent > 20 ? 'text-red-600' :
                            supervisor.reworkPercent > 10 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {supervisor.reworkPercent}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Employee Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Operator / Employee Metrics</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error / Rework Count</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No employee data available
                      </td>
                    </tr>
                  ) : (
                    employees.map((employee, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {employee.attendance}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {employee.workHours} hrs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {employee.outputQuantity} units
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${
                            employee.errorCount > 5 ? 'text-red-600' :
                            employee.errorCount > 2 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {employee.errorCount}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

