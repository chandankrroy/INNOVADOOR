import { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import AdminNavbar from '../../components/AdminNavbar';
import { useSidebar } from '../../context/SidebarContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon, Clock, Users } from 'lucide-react';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function AdminCalendar() {
  const { isCollapsed, isHovered } = useSidebar();
  const [date, setDate] = useState<Value>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Sample events data - in a real app, this would come from an API
  const events = [
    { id: 1, title: 'Team Meeting', date: new Date(2024, 0, 15), time: '10:00 AM', type: 'meeting' },
    { id: 2, title: 'Project Review', date: new Date(2024, 0, 18), time: '2:00 PM', type: 'review' },
    { id: 3, title: 'User Training', date: new Date(2024, 0, 20), time: '9:00 AM', type: 'training' },
  ];

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const handleDateChange = (value: Value) => {
    setDate(value);
    if (value instanceof Date) {
      setSelectedDate(value);
    } else if (Array.isArray(value) && value[0]) {
      setSelectedDate(value[0]);
    }
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const hasEvents = getEventsForDate(date).length > 0;
      if (hasEvents) {
        return 'has-events';
      }
    }
    return null;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <AdminSidebar />
      <AdminNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
            <p className="text-gray-600">View and manage scheduled events</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="mb-4 flex items-center">
                <CalendarIcon className="w-5 h-5 text-indigo-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Calendar View</h2>
              </div>
              <div className="flex justify-center">
                <Calendar
                  onChange={handleDateChange}
                  value={date}
                  tileClassName={tileClassName}
                  className="w-full border-0"
                />
              </div>
              <style>{`
                .react-calendar {
                  width: 100%;
                  border: none;
                  font-family: inherit;
                }
                .react-calendar__tile {
                  padding: 1em 0.5em;
                  border-radius: 8px;
                  margin: 2px;
                }
                .react-calendar__tile--active {
                  background: #4f46e5;
                  color: white;
                }
                .react-calendar__tile--hasActive {
                  background: #e0e7ff;
                }
                .react-calendar__tile.has-events {
                  background: #fef3c7;
                  font-weight: 600;
                }
                .react-calendar__tile.has-events:hover {
                  background: #fde68a;
                }
                .react-calendar__navigation {
                  margin-bottom: 1em;
                }
                .react-calendar__navigation button {
                  min-width: 44px;
                  background: none;
                  font-size: 16px;
                  margin-top: 8px;
                }
                .react-calendar__navigation button:enabled:hover,
                .react-calendar__navigation button:enabled:focus {
                  background-color: #e0e7ff;
                }
                .react-calendar__month-view__weekdays {
                  text-align: center;
                  text-transform: uppercase;
                  font-weight: bold;
                  font-size: 0.75em;
                  color: #6b7280;
                }
                .react-calendar__month-view__days__day--weekend {
                  color: #dc2626;
                }
              `}</style>
            </div>

            {/* Events Panel */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Events</h2>
              
              {selectedDate ? (
                <div>
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Selected Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>

                  {selectedDateEvents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateEvents.map((event) => (
                        <div
                          key={event.id}
                          className="p-4 bg-indigo-50 rounded-lg border border-indigo-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 capitalize">
                              {event.type}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{event.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No events scheduled for this date</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Select a date to view events</p>
                </div>
              )}

              {/* Upcoming Events */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Upcoming Events
                </h3>
                <div className="space-y-2">
                  {events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedDate(event.date);
                        setDate(event.date);
                      }}
                    >
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {event.date.toLocaleDateString()} • {event.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

