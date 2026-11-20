import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Plus, Search, ChevronRight, Trash2 } from 'lucide-react';
import { getPatients, createPatient, deletePatient } from '../services/api';
import { useToast } from '../hooks/useToast';

export default function PatientsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', gender: 'Male' });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchPatients = () => {
    setLoading(true);
    getPatients({ search: search || undefined })
      .then((res) => {
        setPatients(res.data.patients || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => addToast('Failed to load patients', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPatients();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    const age = parseInt(form.age);
    if (!age || age < 1 || age > 120) { setFormError('Age must be 1-120'); return; }

    setCreating(true);
    try {
      await createPatient({ name: form.name.trim(), age, gender: form.gender });
      addToast('Patient created successfully');
      setShowForm(false);
      setForm({ name: '', age: '', gender: 'Male' });
      fetchPatients();
    } catch (err) {
      setFormError(
        err.response?.data?.detail?.message || 
        (typeof err.response?.data?.detail === 'string' ? err.response.data.detail : null) ||
        (err.response ? 'Failed to create patient' : 'Backend server is not running. Please start "python main.py" in your backend terminal.')
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient and all their assessments?')) return;
    try {
      await deletePatient(id);
      addToast('Patient deleted successfully');
      fetchPatients();
    } catch (err) {
      addToast(err.response?.data?.detail?.message || 'Failed to delete patient', 'error');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">{total} patient{total !== 1 ? 's' : ''} registered</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Patient
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', maxWidth: '400px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-slate)' }} />
          <input
            className="input"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {/* Add Patient Modal */}
      {showForm && (
        <div className="loading-overlay" onClick={() => setShowForm(false)}>
          <div className="card" style={{ minWidth: '380px', maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.125rem' }}>Add New Patient</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label" htmlFor="patient-name">Full Name</label>
                <input id="patient-name" className="input" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Patient full name" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label" htmlFor="patient-age">Age</label>
                  <input id="patient-age" className="input" type="number" min="1" max="120"
                    value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Years" />
                </div>
                <div>
                  <label className="label" htmlFor="patient-gender">Gender</label>
                  <select id="patient-gender" className="input" value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              {formError && <p style={{ color: 'var(--color-risk-high)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>{formError}</p>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="loading-spinner" />
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-slate)' }}>
            <UserRound size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
            <p>No patients found.</p>
            <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
              {search ? 'Try adjusting your search.' : 'Click "Add Patient" to register a new patient.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500, color: 'var(--color-deep-teal)' }}>{p.patient_code}</td>
                    <td style={{ fontWeight: 500, color: 'var(--color-ink)' }}>{p.name}</td>
                    <td>{p.age} yrs</td>
                    <td>{p.gender}</td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-ghost" onClick={() => navigate(`/patients/${p.id}`)}>
                          View <ChevronRight size={14} />
                        </button>
                        <button className="btn-ghost" onClick={() => navigate('/assessment/new', { state: { patient: p } })}
                          style={{ color: 'var(--color-mint-dark)' }}>
                          Assess
                        </button>
                        <button className="btn-ghost" onClick={() => handleDelete(p.id)} style={{ color: 'var(--color-risk-high)' }} title="Delete Patient">
                          <Trash2 size={14} />
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
    </div>
  );
}
