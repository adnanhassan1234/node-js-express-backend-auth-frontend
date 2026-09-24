import { useCallback, useEffect, useMemo, useState } from 'react';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import EditIcon from '@material-ui/icons/Edit';
import GroupIcon from '@material-ui/icons/Group';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import RefreshIcon from '@material-ui/icons/Refresh';
import SaveIcon from '@material-ui/icons/Save';
import SchoolIcon from '@material-ui/icons/School';
import SearchIcon from '@material-ui/icons/Search';
import './Dashboard.css';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:3000';

const emptyStudentForm = {
  name: '',
  rollNo: '',
  age: '',
  employeeId: '',
  email: '',
};

const emptyRegisterForm = {
  name: '',
  email: '',
  password: '',
};

const emptyLoginForm = {
  email: '',
  password: '',
};

function Dashboard() {
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [userSearch, setUserSearch] = useState({ role: 'user', name: '' });
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [uploadName, setUploadName] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') || '');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  const showStatus = (type, message) => {
    setStatus({ type, message });
  };

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }, []);

  const loadStudents = useCallback(async () => {
    const result = await request('/student');
    setStudents(result.data || []);
  }, [request]);

  const loadUsers = useCallback(async () => {
    const result = await request('/users');
    setUsers(result.data || []);
  }, [request]);

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadStudents(), loadUsers()]);
      showStatus('success', 'Dashboard data refreshed');
    } catch (error) {
      showStatus('error', error.message);
    } finally {
      setLoading(false);
    }
  }, [loadStudents, loadUsers]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const updateStudentField = (event) => {
    const { name, value } = event.target;
    setStudentForm((current) => ({ ...current, [name]: value }));
  };

  const updateRegisterField = (event) => {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
  };

  const updateLoginField = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  };

  const saveStudent = async (event) => {
    event.preventDefault();
    const method = editingStudentId ? 'PATCH' : 'POST';
    const path = editingStudentId ? `/student/${editingStudentId}` : '/student';

    const payload = {
      ...studentForm,
      age: Number(studentForm.age),
    };

    try {
      await request(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setStudentForm(emptyStudentForm);
      setEditingStudentId(null);
      await loadStudents();
      showStatus('success', editingStudentId ? 'Student updated' : 'Student created');
    } catch (error) {
      showStatus('error', error.message);
    }
  };

  const editStudent = (student) => {
    setEditingStudentId(student.id);
    setStudentForm({
      name: student.name,
      rollNo: student.rollNo,
      age: String(student.age),
      employeeId: student.employeeId,
      email: student.email,
    });
  };

  const deleteStudent = async (id) => {
    const confirmed = window.confirm('Delete this student?');
    if (!confirmed) return;

    try {
      await request(`/student/${id}`, { method: 'DELETE' });
      await loadStudents();
      showStatus('success', 'Student deleted');
    } catch (error) {
      showStatus('error', error.message);
    }
  };

  const registerUser = async (event) => {
    event.preventDefault();
    try {
      const result = await request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      setRegisterForm(emptyRegisterForm);
      await loadUsers();
      showStatus('success', result.message || 'User registered');
    } catch (error) {
      showStatus('error', error.message);
    }
  };

  const loginUser = async (event) => {
    event.preventDefault();
    try {
      const result = await request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      setToken(result.accessToken);
      showStatus('success', 'Login successful');
    } catch (error) {
      showStatus('error', error.message);
    }
  };

  const searchUsers = async (event) => {
    event.preventDefault();
    try {
      const params = new URLSearchParams(userSearch);
      const result = await request(`/users/find?${params.toString()}`, {
        headers: authHeaders,
      });
      setFilteredUsers(result.data || []);
      showStatus('success', 'Filtered users loaded');
    } catch (error) {
      showStatus('error', error.message);
    }
  };

  const uploadDocuments = async (event) => {
    event.preventDefault();

    if (!uploadFiles.length) {
      showStatus('error', 'Please select at least one file');
      return;
    }

    const formData = new FormData();
    formData.append('name', uploadName);
    uploadFiles.forEach((file) => formData.append('files', file));

    try {
      await request('/users/uploads', {
        method: 'POST',
        body: formData,
      });
      setUploadName('');
      setUploadFiles([]);
      event.target.reset();
      showStatus('success', 'Files uploaded');
    } catch (error) {
      showStatus('error', error.message);
    }
  };

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="brand-block">
          <span className="brand-mark">Q</span>
          <div>
            <h1>QMH Admin</h1>
            <p>Nest API dashboard</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="#students">Students</a>
          <a href="#users">Users</a>
          <a href="#auth">Auth</a>
          <a href="#uploads">Uploads</a>
        </nav>

        <div className="api-box">
          <span>API</span>
          <strong>{API_BASE_URL}</strong>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="eyebrow">Backend connected workspace</p>
            <h2>Student Management Dashboard</h2>
          </div>
          <button className="icon-button" onClick={refreshDashboard} disabled={loading}>
            <RefreshIcon />
            <span>{loading ? 'Refreshing' : 'Refresh'}</span>
          </button>
        </header>

        {status.message && (
          <div className={`status-banner ${status.type}`}>{status.message}</div>
        )}

        <section className="metric-grid">
          <article className="metric-card">
            <SchoolIcon />
            <div>
              <span>Total Students</span>
              <strong>{students.length}</strong>
            </div>
          </article>
          <article className="metric-card">
            <GroupIcon />
            <div>
              <span>Total Users</span>
              <strong>{users.length}</strong>
            </div>
          </article>
          <article className="metric-card">
            <LockOpenIcon />
            <div>
              <span>JWT Token</span>
              <strong>{token ? 'Saved' : 'Missing'}</strong>
            </div>
          </article>
        </section>

        <section className="content-grid" id="students">
          <form className="panel form-panel" onSubmit={saveStudent}>
            <div className="panel-heading">
              <h3>{editingStudentId ? 'Edit Student' : 'Add Student'}</h3>
              <SchoolIcon />
            </div>

            <label>
              Name
              <input
                name="name"
                value={studentForm.name}
                onChange={updateStudentField}
                required
              />
            </label>
            <label>
              Roll No
              <input
                name="rollNo"
                value={studentForm.rollNo}
                onChange={updateStudentField}
                required
              />
            </label>
            <label>
              Age
              <input
                name="age"
                type="number"
                min="1"
                value={studentForm.age}
                onChange={updateStudentField}
                required
              />
            </label>
            <label>
              Employee ID
              <input
                name="employeeId"
                value={studentForm.employeeId}
                onChange={updateStudentField}
                required
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                value={studentForm.email}
                onChange={updateStudentField}
                required
              />
            </label>

            <div className="button-row">
              <button className="primary-button" type="submit">
                {editingStudentId ? <SaveIcon /> : <AddCircleOutlineIcon />}
                <span>{editingStudentId ? 'Update' : 'Create'}</span>
              </button>
              {editingStudentId && (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setEditingStudentId(null);
                    setStudentForm(emptyStudentForm);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <section className="panel table-panel">
            <div className="panel-heading">
              <h3>Students</h3>
              <span>{students.length} records</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Age</th>
                    <th>Employee ID</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.id}</td>
                      <td>{student.name}</td>
                      <td>{student.rollNo}</td>
                      <td>{student.age}</td>
                      <td>{student.employeeId}</td>
                      <td>{student.email}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="small-button"
                            onClick={() => editStudent(student)}
                            type="button"
                          >
                            <EditIcon />
                          </button>
                          <button
                            className="small-button danger"
                            onClick={() => deleteStudent(student.id)}
                            type="button"
                          >
                            <DeleteOutlineIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!students.length && (
                    <tr>
                      <td colSpan="7" className="empty-cell">
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section className="two-column" id="auth">
          <form className="panel form-panel" onSubmit={registerUser}>
            <div className="panel-heading">
              <h3>Register User</h3>
              <GroupIcon />
            </div>
            <label>
              Name
              <input
                name="name"
                value={registerForm.name}
                onChange={updateRegisterField}
                required
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                value={registerForm.email}
                onChange={updateRegisterField}
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                value={registerForm.password}
                onChange={updateRegisterField}
                required
              />
            </label>
            <button className="primary-button" type="submit">
              <AddCircleOutlineIcon />
              <span>Register</span>
            </button>
          </form>

          <form className="panel form-panel" onSubmit={loginUser}>
            <div className="panel-heading">
              <h3>Login</h3>
              <LockOpenIcon />
            </div>
            <label>
              Email
              <input
                name="email"
                type="email"
                value={loginForm.email}
                onChange={updateLoginField}
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                value={loginForm.password}
                onChange={updateLoginField}
                required
              />
            </label>
            <button className="primary-button" type="submit">
              <LockOpenIcon />
              <span>Login</span>
            </button>
          </form>
        </section>

        <section className="two-column" id="users">
          <section className="panel table-panel">
            <div className="panel-heading">
              <h3>All Users</h3>
              <span>{users.length} records</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.emailVerified ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                  {!users.length && (
                    <tr>
                      <td colSpan="5" className="empty-cell">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h3>Find Verified Users</h3>
              <SearchIcon />
            </div>
            <form className="inline-form" onSubmit={searchUsers}>
              <label>
                Role
                <input
                  value={userSearch.role}
                  onChange={(event) =>
                    setUserSearch((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                Name
                <input
                  value={userSearch.name}
                  onChange={(event) =>
                    setUserSearch((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <button className="primary-button" type="submit">
                <SearchIcon />
                <span>Search</span>
              </button>
            </form>

            <div className="result-list">
              {filteredUsers.map((user) => (
                <div className="result-item" key={user.id}>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
              ))}
              {!filteredUsers.length && <p className="muted">No filtered users yet</p>}
            </div>
          </section>
        </section>

        <section className="panel upload-panel" id="uploads">
          <div className="panel-heading">
            <h3>Upload Files</h3>
            <CloudUploadIcon />
          </div>
          <form className="upload-form" onSubmit={uploadDocuments}>
            <label>
              Name
              <input
                value={uploadName}
                onChange={(event) => setUploadName(event.target.value)}
                required
              />
            </label>
            <label>
              Files
              <input
                type="file"
                multiple
                onChange={(event) => setUploadFiles(Array.from(event.target.files))}
              />
            </label>
            <button className="primary-button" type="submit">
              <CloudUploadIcon />
              <span>Upload</span>
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

export default Dashboard;
