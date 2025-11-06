import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, FileText, Upload, LogOut, User, Award, TrendingUp } from 'lucide-react';
import './VolunteerDashboard.css';
import { tasksAPI, eventsAPI } from '../services/api';

const VolunteerDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [myTasks, setMyTasks] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [reportText, setReportText] = useState('');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks and events from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksRes, eventsRes] = await Promise.all([
          tasksAPI.getAll(),
          eventsAPI.getAll()
        ]);

        const allTasks = tasksRes.data || [];
        const allEvents = eventsRes.data || [];
        
        // Filter tasks assigned to this volunteer
        // Check both user.id and user._id for compatibility
        const volunteerId = String(user.id || user._id || '');
        const volunteerTasks = allTasks.filter(task => {
          // Handle both string and object volunteerId
          let taskVolunteerId = task.volunteerId;
          if (typeof taskVolunteerId === 'object') {
            taskVolunteerId = taskVolunteerId._id || taskVolunteerId;
          }
          return String(taskVolunteerId) === volunteerId;
        });

        // Map tasks with event names
        const tasksWithEvents = volunteerTasks.map(task => {
          const event = allEvents.find(e => {
            const eventId = typeof e._id === 'object' ? e._id.toString() : e._id;
            const taskEventId = typeof task.eventId === 'object' 
              ? task.eventId._id || task.eventId 
              : task.eventId;
            return eventId === taskEventId;
          });
          
          return {
            id: task._id,
            title: task.title,
            event: event ? event.name : 'Unknown Event',
            status: task.status || 'pending',
            priority: task.priority || 'medium',
            dueDate: task.dueDate
          };
        });

        setMyTasks(tasksWithEvents);
        setMyEvents(allEvents.map(e => ({
          id: e._id,
          name: e.name,
          date: e.date,
          location: e.location,
          status: e.status || 'upcoming',
          role: 'Volunteer'
        })));

        // Keep mock attendance for now
        setMyAttendance([
          { id: 1, event: 'Awareness Campaign', date: '2025-09-15', status: 'present', hours: 6 },
          { id: 2, event: 'Book Distribution', date: '2025-10-20', status: 'present', hours: 4 }
        ]);

        setReports([
          {
            id: 1,
            event: 'Awareness Campaign',
            date: '2025-09-15',
            type: 'Activity Report',
            status: 'submitted'
          }
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error loading tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmitReport = () => {
    if (reportText || selectedFile) {
      const newReport = {
        id: reports.length + 1,
        event: myEvents[0]?.name || 'General Report',
        date: new Date().toISOString().split('T')[0],
        type: selectedFile ? 'Photo Report' : 'Text Report',
        status: 'submitted',
        content: reportText,
        file: selectedFile?.name
      };
      setReports([newReport, ...reports]);
      setReportText('');
      setSelectedFile(null);
      alert('Report submitted successfully!');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="volunteer-portal">
      {/* Header */}
      <header className="volunteer-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-container">
              <div className="logo">AP</div>
              <div className="logo-text">
                <h1>Akshar Paaul</h1>
                <p>Volunteer Portal</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-details">
                <p className="user-name">{user.name}</p>
                <p className="user-role">Volunteer</p>
              </div>
              <div className="user-avatar">{user.name.charAt(0)}</div>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="volunteer-main">
        {/* Navigation */}
        <nav className="volunteer-nav">
          <button 
            className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={20} />
            <span>Overview</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <Calendar size={20} />
            <span>My Events</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <CheckCircle size={20} />
            <span>My Tasks</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <Clock size={20} />
            <span>Attendance</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FileText size={20} />
            <span>Reports</span>
          </button>
        </nav>

        {/* Content */}
        <div className="volunteer-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content fade-in">
              <h2 className="page-title">Welcome, {user.name}!</h2>

              <div className="stats-row">
                <div className="stat-box blue">
                  <div className="stat-icon">
                    <Clock size={28} />
                  </div>
                  <div>
                    <p className="stat-label">Total Hours</p>
                    <p className="stat-value">{user.hours || 45}</p>
                  </div>
                </div>
                <div className="stat-box green">
                  <div className="stat-icon">
                    <Calendar size={28} />
                  </div>
                  <div>
                    <p className="stat-label">Events Attended</p>
                    <p className="stat-value">{myAttendance.length}</p>
                  </div>
                </div>
                <div className="stat-box orange">
                  <div className="stat-icon">
                    <CheckCircle size={28} />
                  </div>
                  <div>
                    <p className="stat-label">Tasks Completed</p>
                    <p className="stat-value">{myTasks.filter(t => t.status === 'completed').length}</p>
                  </div>
                </div>
                <div className="stat-box purple">
                  <div className="stat-icon">
                    <Award size={28} />
                  </div>
                  <div>
                    <p className="stat-label">Status</p>
                    <p className="stat-value-text">{user.status}</p>
                  </div>
                </div>
              </div>

              <div className="overview-grid">
                <div className="overview-card">
                  <h3>Upcoming Events</h3>
                  <div className="event-list-small">
                    {myEvents.filter(e => e.status === 'upcoming').length === 0 ? (
                      <p className="empty-msg">No upcoming events</p>
                    ) : (
                      myEvents.filter(e => e.status === 'upcoming').map(event => (
                        <div key={event.id} className="event-item-small">
                          <div className="event-date-small">
                            <span className="date-num">{new Date(event.date).getDate()}</span>
                            <span className="date-month">{new Date(event.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                          </div>
                          <div className="event-info-small">
                            <p className="event-name-small">{event.name}</p>
                            <p className="event-location-small">📍 {event.location}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="overview-card">
                  <h3>Pending Tasks</h3>
                  <div className="task-list-small">
                    {myTasks.filter(t => t.status !== 'completed').length === 0 ? (
                      <p className="empty-msg">No pending tasks</p>
                    ) : (
                      myTasks.filter(t => t.status !== 'completed').map(task => (
                        <div key={task.id} className="task-item-small">
                          <div className={`task-priority-dot ${task.priority}`}></div>
                          <div>
                            <p className="task-title-small">{task.title}</p>
                            <p className="task-meta-small">{task.event} • Due: {formatDate(task.dueDate)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="tab-content fade-in">
              <h2 className="page-title">My Events</h2>

              <div className="events-list">
                {myEvents.length === 0 ? (
                  <div className="empty-state">
                    <Calendar size={48} />
                    <p>No events assigned yet</p>
                  </div>
                ) : (
                  myEvents.map(event => (
                    <div key={event.id} className={`event-card-vol ${event.status}`}>
                      <div className="event-header-vol">
                        <span className={`event-badge ${event.status}`}>{event.status}</span>
                      </div>
                      <h3>{event.name}</h3>
                      <div className="event-details-vol">
                        <div className="detail-item">
                          <Calendar size={16} />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="detail-item">
                          <span>📍</span>
                          <span>{event.location}</span>
                        </div>
                        <div className="detail-item">
                          <User size={16} />
                          <span>Role: {event.role}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="tab-content fade-in">
              <h2 className="page-title">My Tasks</h2>

              <div className="tasks-grid-vol">
                {loading ? (
                  <div className="empty-state">
                    <Clock size={48} />
                    <p>Loading tasks...</p>
                  </div>
                ) : myTasks.length === 0 ? (
                  <div className="empty-state">
                    <CheckCircle size={48} />
                    <p>No tasks assigned yet</p>
                  </div>
                ) : (
                  myTasks.map(task => (
                    <div key={task.id} className={`task-card-vol priority-${task.priority}`}>
                      <div className="task-header-vol">
                        <span className={`priority-label ${task.priority}`}>{task.priority}</span>
                        <span className={`status-label ${task.status}`}>{task.status}</span>
                      </div>
                      <h4>{task.title}</h4>
                      <p className="task-event">{task.event}</p>
                      <div className="task-footer">
                        {task.dueDate && (
                          <span className="due-date">Due: {formatDate(task.dueDate)}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="tab-content fade-in">
              <h2 className="page-title">My Attendance History</h2>

              <div className="attendance-summary">
                <div className="summary-card">
                  <p className="summary-label">Total Sessions</p>
                  <p className="summary-value">{myAttendance.length}</p>
                </div>
                <div className="summary-card">
                  <p className="summary-label">Present</p>
                  <p className="summary-value green">{myAttendance.filter(a => a.status === 'present').length}</p>
                </div>
                <div className="summary-card">
                  <p className="summary-label">Total Hours</p>
                  <p className="summary-value blue">{myAttendance.reduce((sum, a) => sum + a.hours, 0)}h</p>
                </div>
              </div>

              <div className="attendance-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAttendance.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="empty-cell">
                          <div className="empty-state-small">
                            <p>No attendance records yet</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      myAttendance.map(att => (
                        <tr key={att.id}>
                          <td>{formatDate(att.date)}</td>
                          <td>{att.event}</td>
                          <td>
                            <span className={`status-badge ${att.status}`}>{att.status}</span>
                          </td>
                          <td><strong>{att.hours}h</strong></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="tab-content fade-in">
              <h2 className="page-title">Submit Reports & Photos</h2>

              <div className="report-submit-card">
                <h3>Submit New Report</h3>
                <div className="report-form">
                  <div className="form-group">
                    <label>Event/Activity Report</label>
                    <textarea
                      rows="5"
                      placeholder="Describe your experience, activities, and outcomes..."
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Upload Photos (Optional)</label>
                    <div className="file-upload-area">
                      <input
                        type="file"
                        id="file-upload"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="file-upload" className="file-upload-label">
                        <Upload size={24} />
                        <span>{selectedFile ? selectedFile.name : 'Click to upload photos'}</span>
                      </label>
                    </div>
                  </div>

                  <button className="submit-report-btn" onClick={handleSubmitReport}>
                    <Upload size={20} />
                    Submit Report
                  </button>
                </div>
              </div>

              <div className="reports-history">
                <h3>Previous Reports</h3>
                {reports.length === 0 ? (
                  <div className="empty-state-small">
                    <FileText size={32} />
                    <p>No reports submitted yet</p>
                  </div>
                ) : (
                  <div className="reports-list">
                    {reports.map(report => (
                      <div key={report.id} className="report-item">
                        <div className="report-icon">
                          <FileText size={24} />
                        </div>
                        <div className="report-info">
                          <p className="report-title">{report.event}</p>
                          <p className="report-meta">
                            {report.type} • {formatDate(report.date)} • {report.status}
                          </p>
                          {report.content && (
                            <p className="report-preview">{report.content.substring(0, 100)}...</p>
                          )}
                          {report.file && (
                            <p className="report-file">📎 {report.file}</p>
                          )}
                        </div>
                        <span className={`status-badge ${report.status}`}>{report.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;