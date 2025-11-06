import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { Users, Calendar, Award, MessageSquare, Settings, Home, Plus, Search, Filter, Edit, Trash2, Eye, CheckCircle, Clock, UserPlus, ClipboardCheck, MapPin, User, Mail, Phone, X, FileText, AlertCircle, TrendingUp, LogOut } from 'lucide-react';
import { volunteersAPI, eventsAPI, tasksAPI, attendanceAPI } from '../services/api';
import './VolunteerPortal.css';

// Add this import at the top



const VolunteerPortal = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // State
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showAddVolunteer, setShowAddVolunteer] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddAttendance, setShowAddAttendance] = useState(false);

  // Form states
  const [newVolunteer, setNewVolunteer] = useState({
    name: '', email: '', phone: '', address: '', skills: ''
  });
  const [newEvent, setNewEvent] = useState({
    name: '', date: '', location: '', description: '', requiredVolunteers: '10'
  });
  const [newTask, setNewTask] = useState({
    eventId: '', volunteerId: '', title: '', description: '', priority: 'medium', dueDate: ''
  });
  const [newAttendance, setNewAttendance] = useState({
    date: '', eventId: '', selectedVolunteers: [], status: 'present', hours: '0'
  });

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [volRes, evtRes, tskRes, attRes] = await Promise.all([
        volunteersAPI.getAll(),
        eventsAPI.getAll(),
        tasksAPI.getAll(),
        attendanceAPI.getAll()
      ]);
      
      setVolunteers(volRes.data);
      setEvents(evtRes.data);
      setTasks(tskRes.data);
      setAttendance(attRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add volunteer
  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    if (!newVolunteer.name || !newVolunteer.email || !newVolunteer.phone) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await volunteersAPI.create(newVolunteer);
      setVolunteers([...volunteers, response.data]);
      setNewVolunteer({ name: '', email: '', phone: '', address: '', skills: '' });
      setShowAddVolunteer(false);
      showSuccessMessage('Volunteer added successfully!');
    } catch (error) {
      console.error('Error adding volunteer:', error);
      alert('Error: ' + error.message);
    }
  };

  // Add event
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date || !newEvent.location) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await eventsAPI.create(newEvent);
      setEvents([...events, response.data]);
      setNewEvent({ name: '', date: '', location: '', description: '', requiredVolunteers: '10' });
      setShowAddEvent(false);
      showSuccessMessage('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error: ' + error.message);
    }
  };

  // Add task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.eventId || !newTask.volunteerId || !newTask.title) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const response = await tasksAPI.create(newTask);
      setTasks([...tasks, response.data]);
      setNewTask({ eventId: '', volunteerId: '', title: '', description: '', priority: 'medium', dueDate: '' });
      setShowAddTask(false);
      showSuccessMessage('Task assigned successfully!');
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Error: ' + error.message);
    }
  };

  // Delete volunteer
  const deleteVolunteer = async (id) => {
    if (window.confirm('Are you sure you want to delete this volunteer?')) {
      try {
        await volunteersAPI.delete(id);
        setVolunteers(volunteers.filter(v => v._id !== id));
        showSuccessMessage('Volunteer deleted successfully!');
      } catch (error) {
        console.error('Error deleting volunteer:', error);
        alert('Error: ' + error.message);
      }
    }
  };

  // Delete event
  const deleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventsAPI.delete(id);
        setEvents(events.filter(e => e._id !== id));
        showSuccessMessage('Event deleted successfully!');
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error: ' + error.message);
      }
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error: ' + error.message);
    }
  };

  // Add attendance
  const handleAddAttendance = async (e) => {
    e.preventDefault();
    if (!newAttendance.date || !newAttendance.eventId || newAttendance.selectedVolunteers.length === 0) {
      alert('Please fill in all required fields and select at least one volunteer');
      return;
    }
    
    try {
      // Create attendance records for each selected volunteer
      const records = newAttendance.selectedVolunteers.map(volunteerId => ({
        date: newAttendance.date,
        eventId: newAttendance.eventId,
        volunteerId: volunteerId,
        status: newAttendance.status,
        hours: parseFloat(newAttendance.hours) || 0
      }));

      await attendanceAPI.createBulk({ records });
      
      // Refresh attendance data
      const attRes = await attendanceAPI.getAll();
      setAttendance(attRes.data);
      
      // Reset form
      setNewAttendance({ date: '', eventId: '', selectedVolunteers: [], status: 'present', hours: '0' });
      setShowAddAttendance(false);
      showSuccessMessage(`Attendance added for ${records.length} volunteer(s)!`);
    } catch (error) {
      console.error('Error adding attendance:', error);
      alert('Error: ' + error.message);
    }
  };

  // Toggle volunteer selection for attendance
  const toggleVolunteerSelection = (volunteerId) => {
    setNewAttendance(prev => {
      const isSelected = prev.selectedVolunteers.includes(volunteerId);
      return {
        ...prev,
        selectedVolunteers: isSelected
          ? prev.selectedVolunteers.filter(id => id !== volunteerId)
          : [...prev.selectedVolunteers, volunteerId]
      };
    });
  };

  // Success message
  const showSuccessMessage = (message) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-toast';
    successDiv.innerHTML = `
      <div class="success-toast-content">
        <CheckCircle size={20} />
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
  };

  // Helper functions
  const getVolunteerName = (volunteerId) => {
    if (typeof volunteerId === 'object' && volunteerId?.name) return volunteerId.name;
    const volunteer = volunteers.find(v => v._id === volunteerId);
    return volunteer ? volunteer.name : 'Unknown';
  };

  const getEventName = (eventId) => {
    if (typeof eventId === 'object' && eventId?.name) return eventId.name;
    const event = events.find(e => e._id === eventId);
    return event ? event.name : 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Filter volunteers by search
  const filteredVolunteers = volunteers.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      onLogout();
    }
  };

  const stats = {
    totalVolunteers: volunteers.length,
    activeVolunteers: volunteers.filter(v => v.status === 'active').length,
    totalHours: volunteers.reduce((sum, v) => sum + (v.hours || 0), 0),
    upcomingEvents: events.filter(e => e.status === 'upcoming').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Akshar Paaul Portal...</p>
      </div>
    );
  }

  return (
    <div className="portal-container">
      {/* Header */}
      <header className="portal-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-container">
              <div className="logo">AP</div>
              <div className="logo-text">
                <h1>Akshar Paaul</h1>
                <p>AksharSetu - Volunteer Management Portal</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="user-avatar">A</div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        {/* Navigation */}
        <nav className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <TrendingUp size={20} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'volunteers' ? 'active' : ''}`}
            onClick={() => setActiveTab('volunteers')}
          >
            <Users size={20} />
            <span>Volunteers</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <Calendar size={20} />
            <span>Events</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <ClipboardCheck size={20} />
            <span>Tasks</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <CheckCircle size={20} />
            <span>Attendance</span>
          </button>
        </nav>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="view-content fade-in">
            <div className="stats-grid">
              <div className="stat-card blue">
                <div className="stat-icon"><Users size={32} /></div>
                <div className="stat-details">
                  <p className="stat-label">Total Volunteers</p>
                  <p className="stat-value">{stats.totalVolunteers}</p>
                </div>
              </div>
              <div className="stat-card green">
                <div className="stat-icon"><CheckCircle size={32} /></div>
                <div className="stat-details">
                  <p className="stat-label">Active Volunteers</p>
                  <p className="stat-value">{stats.activeVolunteers}</p>
                </div>
              </div>
              <div className="stat-card orange">
                <div className="stat-icon"><Clock size={32} /></div>
                <div className="stat-details">
                  <p className="stat-label">Total Hours</p>
                  <p className="stat-value">{stats.totalHours}</p>
                </div>
              </div>
              <div className="stat-card purple">
                <div className="stat-icon"><Calendar size={32} /></div>
                <div className="stat-details">
                  <p className="stat-label">Upcoming Events</p>
                  <p className="stat-value">{stats.upcomingEvents}</p>
                </div>
              </div>
              <div className="stat-card red">
                <div className="stat-icon"><ClipboardCheck size={32} /></div>
                <div className="stat-details">
                  <p className="stat-label">Pending Tasks</p>
                  <p className="stat-value">{stats.pendingTasks}</p>
                </div>
              </div>
              <div className="stat-card teal">
                <div className="stat-icon"><TrendingUp size={32} /></div>
                <div className="stat-details">
                  <p className="stat-label">Completed Tasks</p>
                  <p className="stat-value">{stats.completedTasks}</p>
                </div>
              </div>
            </div>

            <div className="quick-actions-card">
              <h3>Quick Actions</h3>
              <div className="quick-actions-grid">
                <button className="action-btn blue" onClick={() => setShowAddVolunteer(true)}>
                  <Plus size={24} />
                  <span>Add Volunteer</span>
                </button>
                <button className="action-btn purple" onClick={() => setShowAddEvent(true)}>
                  <Plus size={24} />
                  <span>Create Event</span>
                </button>
                <button className="action-btn green" onClick={() => setShowAddTask(true)}>
                  <Plus size={24} />
                  <span>Assign Task</span>
                </button>
                <button className="action-btn orange" onClick={() => setActiveTab('attendance')}>
                  <CheckCircle size={24} />
                  <span>View Attendance</span>
                </button>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="card">
                <h3>Recent Volunteers</h3>
                <div className="volunteer-list">
                  {volunteers.slice(0, 5).map(v => (
                    <div key={v._id} className="volunteer-item">
                      <div className="volunteer-avatar">{v.name.charAt(0)}</div>
                      <div className="volunteer-info">
                        <p className="volunteer-name">{v.name}</p>
                        <p className="volunteer-email">{v.email}</p>
                      </div>
                      <span className={`status-badge ${v.status}`}>{v.status}</span>
                    </div>
                  ))}
                  {volunteers.length === 0 && (
                    <p className="empty-state">No volunteers yet. Add your first volunteer!</p>
                  )}
                </div>
              </div>

              <div className="card">
                <h3>Upcoming Events</h3>
                <div className="event-list">
                  {events.filter(e => e.status === 'upcoming').slice(0, 5).map(e => (
                    <div key={e._id} className="event-item">
                      <div className="event-date">
                        <span className="date-day">{new Date(e.date).getDate()}</span>
                        <span className="date-month">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                      </div>
                      <div className="event-info">
                        <p className="event-name">{e.name}</p>
                        <p className="event-location">📍 {e.location}</p>
                      </div>
                    </div>
                  ))}
                  {events.filter(e => e.status === 'upcoming').length === 0 && (
                    <p className="empty-state">No upcoming events.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Volunteers View */}
        {activeTab === 'volunteers' && (
          <div className="view-content fade-in">
            <div className="page-header">
              <h2>Volunteer Management</h2>
              <button className="primary-btn" onClick={() => setShowAddVolunteer(true)}>
                <Plus size={20} />
                Add Volunteer
              </button>
            </div>

            <div className="search-filter-bar">
              <div className="search-box">
                <Search size={20} />
                <input 
                  type="text" 
                  placeholder="Search volunteers by name or email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Volunteer</th>
                    <th>Contact</th>
                    <th>Skills</th>
                    <th>Hours</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVolunteers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state-cell">
                        <div className="empty-state-large">
                          <Users size={48} />
                          <p>No volunteers found</p>
                          <button className="primary-btn" onClick={() => setShowAddVolunteer(true)}>
                            <Plus size={20} />
                            Add Your First Volunteer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredVolunteers.map(v => (
                      <tr key={v._id} className="table-row-hover">
                        <td>
                          <div className="table-user">
                            <div className="user-avatar-small">{v.name.charAt(0)}</div>
                            <div>
                              <p className="user-name">{v.name}</p>
                              <p className="user-meta">{v.address}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p>{v.email}</p>
                          <p className="text-muted">{v.phone}</p>
                        </td>
                        <td><span className="skill-badge">{v.skills || 'N/A'}</span></td>
                        <td><strong>{v.hours}h</strong></td>
                        <td>
                          <div className="action-buttons">
                            <button className="icon-btn delete" onClick={() => deleteVolunteer(v._id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Events View */}
        {activeTab === 'events' && (
          <div className="view-content fade-in">
            <div className="page-header">
              <h2>Event Management</h2>
              <button className="primary-btn purple" onClick={() => setShowAddEvent(true)}>
                <Plus size={20} />
                Create Event
              </button>
            </div>

            <div className="events-grid">
              {events.length === 0 ? (
                <div className="empty-state-large">
                  <Calendar size={48} />
                  <p>No events yet</p>
                  <button className="primary-btn purple" onClick={() => setShowAddEvent(true)}>
                    <Plus size={20} />
                    Create Your First Event
                  </button>
                </div>
              ) : (
                events.map(e => (
                  <div key={e._id} className={`event-card ${e.status}`}>
                    <div className="event-card-header">
                      <span className={`event-status-badge ${e.status}`}>{e.status}</span>
                      <button className="icon-btn delete" onClick={() => deleteEvent(e._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h3>{e.name}</h3>
                    <p className="event-description">{e.description}</p>
                    <div className="event-details">
                      <div className="event-detail-item">
                        <Calendar size={16} />
                        <span>{formatDate(e.date)}</span>
                      </div>
                      <div className="event-detail-item">
                        <span>📍</span>
                        <span>{e.location}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tasks View */}
        {activeTab === 'tasks' && (
          <div className="view-content fade-in">
            <div className="page-header">
              <h2>Task Management</h2>
              <button className="primary-btn green" onClick={() => setShowAddTask(true)}>
                <Plus size={20} />
                Assign Task
              </button>
            </div>

            <div className="tasks-kanban">
              {['pending', 'in-progress', 'completed'].map(status => (
                <div key={status} className="kanban-column">
                  <div className="kanban-header">
                    <h3>{status.replace('-', ' ').toUpperCase()}</h3>
                    <span className="task-count">{tasks.filter(t => t.status === status).length}</span>
                  </div>
                  <div className="kanban-tasks">
                    {tasks.filter(t => t.status === status).length === 0 ? (
                      <p className="empty-kanban">No {status} tasks</p>
                    ) : (
                      tasks.filter(t => t.status === status).map(t => (
                        <div key={t._id} className={`task-card priority-${t.priority}`}>
                          <div className="task-header">
                            <span className={`priority-badge ${t.priority}`}>{t.priority}</span>
                          </div>
                          <h4>{t.title}</h4>
                          <p className="task-description">{t.description}</p>
                          <div className="task-meta">
                            <span className="task-assignee">👤 {getVolunteerName(t.volunteerId)}</span>
                            <span className="task-event">📅 {getEventName(t.eventId)}</span>
                          </div>
                          {t.dueDate && (
                            <p className="task-due">Due: {formatDate(t.dueDate)}</p>
                          )}
                          <select 
                            className="task-status-select"
                            value={t.status}
                            onChange={(e) => updateTaskStatus(t._id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance View */}
        {activeTab === 'attendance' && (
          <div className="view-content fade-in">
            <div className="page-header">
              <h2>Attendance Records</h2>
              <button className="primary-btn orange" onClick={() => setShowAddAttendance(true)}>
                <Plus size={20} />
                Add Attendance
              </button>
            </div>

            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Volunteer</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state-cell">
                        <div className="empty-state-large">
                          <CheckCircle size={48} />
                          <p>No attendance records yet</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    attendance.map(a => (
                      <tr key={a._id}>
                        <td>{formatDate(a.date)}</td>
                        <td>{getVolunteerName(a.volunteerId)}</td>
                        <td>{getEventName(a.eventId)}</td>
                        <td><span className={`status-badge ${a.status}`}>{a.status}</span></td>
                        <td><strong>{a.hours}h</strong></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddVolunteer && (
        <div className="modal-overlay" onClick={() => setShowAddVolunteer(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Volunteer</h3>
              <button className="close-btn" onClick={() => setShowAddVolunteer(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddVolunteer} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={newVolunteer.name}
                  onChange={(e) => setNewVolunteer({...newVolunteer, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newVolunteer.email}
                  onChange={(e) => setNewVolunteer({...newVolunteer, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={newVolunteer.phone}
                  onChange={(e) => setNewVolunteer({...newVolunteer, phone: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  placeholder="Enter address"
                  value={newVolunteer.address}
                  onChange={(e) => setNewVolunteer({...newVolunteer, address: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Skills</label>
                <input
                  type="text"
                  placeholder="Enter skills (comma separated)"
                  value={newVolunteer.skills}
                  onChange={(e) => setNewVolunteer({...newVolunteer, skills: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowAddVolunteer(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Add Volunteer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddEvent && (
        <div className="modal-overlay" onClick={() => setShowAddEvent(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Event</h3>
              <button className="close-btn" onClick={() => setShowAddEvent(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="modal-form">
              <div className="form-group">
                <label>Event Name *</label>
                <input
                  type="text"
                  placeholder="Enter event name"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  placeholder="Enter location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Required Volunteers</label>
                <input
                  type="number"
                  placeholder="10"
                  value={newEvent.requiredVolunteers}
                  onChange={(e) => setNewEvent({...newEvent, requiredVolunteers: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Enter event description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowAddEvent(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn purple">
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddTask && (
        <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign New Task</h3>
              <button className="close-btn" onClick={() => setShowAddTask(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="modal-form">
              <div className="form-group">
                <label>Select Volunteer *</label>
                <select
                  value={newTask.volunteerId}
                  onChange={(e) => setNewTask({...newTask, volunteerId: e.target.value})}
                  required
                >
                  <option value="">Choose volunteer</option>
                  {volunteers.map(v => (
                    <option key={v._id} value={v._id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Select Event *</label>
                <select
                  value={newTask.eventId}
                  onChange={(e) => setNewTask({...newTask, eventId: e.target.value})}
                  required
                >
                  <option value="">Choose event</option>
                  {events.map(e => (
                    <option key={e._id} value={e._id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Task Description</label>
                <textarea
                  rows="3"
                  placeholder="Enter task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                ></textarea>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowAddTask(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn green">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddAttendance && (
        <div className="modal-overlay" onClick={() => setShowAddAttendance(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Add Attendance</h3>
              <button className="close-btn" onClick={() => setShowAddAttendance(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddAttendance} className="modal-form">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={newAttendance.date}
                  onChange={(e) => setNewAttendance({...newAttendance, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Select Event *</label>
                <select
                  value={newAttendance.eventId}
                  onChange={(e) => setNewAttendance({...newAttendance, eventId: e.target.value})}
                  required
                >
                  <option value="">Choose event</option>
                  {events.map(e => (
                    <option key={e._id} value={e._id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Select Volunteers *</label>
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  backgroundColor: '#f9f9f9'
                }}>
                  {volunteers.length === 0 ? (
                    <p className="text-muted">No volunteers available</p>
                  ) : (
                    volunteers.map(v => {
                      const isSelected = newAttendance.selectedVolunteers.includes(v._id);
                      return (
                        <div
                          key={v._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            marginBottom: '4px',
                            backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = '#f0f0f0';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          onClick={() => toggleVolunteerSelection(v._id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleVolunteerSelection(v._id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ marginRight: '10px', cursor: 'pointer' }}
                          />
                          <div>
                            <p style={{ margin: 0, fontWeight: '500' }}>{v.name}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{v.email}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {newAttendance.selectedVolunteers.length > 0 && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                    {newAttendance.selectedVolunteers.length} volunteer(s) selected
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select
                  value={newAttendance.status}
                  onChange={(e) => setNewAttendance({...newAttendance, status: e.target.value})}
                  required
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              <div className="form-group">
                <label>Hours</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Enter hours worked"
                  value={newAttendance.hours}
                  onChange={(e) => setNewAttendance({...newAttendance, hours: e.target.value})}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>Leave 0 for absent volunteers</small>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowAddAttendance(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn orange">
                  Add Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerPortal;