import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserRound, Activity, ImageUp, FileText, BrainCircuit,
  Upload, X, CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft, Sparkles
} from 'lucide-react';
import { getPatients, createPatient, createClinicalRecord, uploadImage, createPrediction } from '../services/api';
import { useToast } from '../hooks/useToast';

const STEPS = [
  { label: 'Patient', icon: UserRound },
  { label: 'Clinical Data', icon: Activity },
  { label: 'Retinal Image', icon: ImageUp },
  { label: 'Review', icon: FileText },
  { label: 'Prediction', icon: BrainCircuit },
];

const LOADING_STAGES = [
  'Validating retinal image',
  'Preprocessing image',
  'Extracting retinal features',
  'Processing clinical parameters',
  'Running multimodal model',
  'Generating explanation',
  'Saving assessment',
];

export default function NewAssessmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const fileInputRef = useRef();

  const [step, setStep] = useState(0);

  // Step 1: Patient
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(location.state?.patient || null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', age: '', gender: 'Male' });
  const [patientError, setPatientError] = useState('');

  // Step 2: Clinical
  const [clinical, setClinical] = useState({
    systolic_bp: '', diastolic_bp: '', cholesterol: '', bmi: '',
    diabetes: false, smoking_status: 'never'
  });
  const [clinicalErrors, setClinicalErrors] = useState({});
  const [clinicalRecordId, setClinicalRecordId] = useState(null);

  // Step 3: Image
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadData, setUploadData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [retinalImageId, setRetinalImageId] = useState(null);
  const [dragover, setDragover] = useState(false);

  // Step 5: Prediction
  const [predicting, setPredicting] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);

  useEffect(() => {
    getPatients({ limit: 100 })
      .then((res) => setPatients(res.data.patients || []))
      .catch(() => {});
  }, []);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.patient_code.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // Step 1: Create/select patient
  const handleCreatePatient = async () => {
    setPatientError('');
    if (!newPatient.name.trim()) { setPatientError('Name is required'); return; }
    const age = parseInt(newPatient.age);
    if (!age || age < 1 || age > 120) { setPatientError('Valid age (1-120) required'); return; }

    try {
      const res = await createPatient({ name: newPatient.name.trim(), age, gender: newPatient.gender });
      setSelectedPatient(res.data);
      setShowNewPatient(false);
      setPatients((prev) => [res.data, ...prev]);
      addToast('Patient created successfully');
    } catch (err) {
      setPatientError(err.response?.data?.detail?.message || 'Failed to create patient');
    }
  };

  // Step 2: Validate clinical
  const validateClinical = () => {
    const errors = {};
    const sbp = parseFloat(clinical.systolic_bp);
    const dbp = parseFloat(clinical.diastolic_bp);
    const chol = parseFloat(clinical.cholesterol);
    const bmi = parseFloat(clinical.bmi);

    if (!sbp || sbp <= 0 || sbp > 300) errors.systolic_bp = 'Valid systolic BP required (1-300)';
    if (!dbp || dbp <= 0 || dbp > 250) errors.diastolic_bp = 'Valid diastolic BP required (1-250)';
    if (sbp && dbp && dbp > sbp) errors.diastolic_bp = 'Diastolic should not exceed systolic';
    if (!chol || chol <= 0 || chol > 600) errors.cholesterol = 'Valid cholesterol required (1-600)';
    if (!bmi || bmi <= 0 || bmi > 80) errors.bmi = 'Valid BMI required (1-80)';

    setClinicalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 3: Handle image
  const handleFileSelect = (file) => {
    setImageError('');
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      setImageError('Unsupported file type. Use JPEG or PNG.');
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      setImageError('File exceeds 16MB limit.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImagePreview(dataUrl);

      // Client-side quick optical verification
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 32;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 32, 32);
          const imgData = ctx.getImageData(0, 0, 32, 32).data;
          let rSum = 0, gSum = 0, bSum = 0;
          const count = imgData.length / 4;
          for (let i = 0; i < imgData.length; i += 4) {
            rSum += imgData[i];
            gSum += imgData[i + 1];
            bSum += imgData[i + 2];
          }
          const avgR = rSum / count;
          const avgG = gSum / count;
          const avgB = bSum / count;
          const rbRatio = avgR / (avgB + 0.001);
          const rgRatio = avgR / (avgG + 0.001);

          // Retinal fundus scans have strong red/orange dominance
          if (rbRatio < 1.6 || rgRatio < 1.05) {
            setImageError('Invalid Image: This does not appear to be a retinal fundus scan. CardioVision AI requires an eye fundus photograph to analyze blood vessels. General photos (selfies, rooms, objects) cannot be used.');
          }
        } catch (err) {
          // ignore canvas cross-origin or decode errors
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileSelect(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadData(null);
    setImageError('');
  };

  const handleSelectSampleImage = async (filename) => {
    setImageError('');
    try {
      const response = await fetch(`/sample_retina/${filename}`);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/png' });
      setImageFile(file);
      setImagePreview(URL.createObjectURL(blob));
    } catch (err) {
      setImageError('Failed to load sample retinal image');
    }
  };

  // Submit flow
  const handleSubmitAssessment = async () => {
    setPredicting(true);
    setLoadingStage(0);

    try {
      // Stage 0-1: Upload image
      setLoadingStage(0);
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('patient_id', selectedPatient.id);
      const imgRes = await uploadImage(formData);
      setLoadingStage(1);

      // Stage 2-3: Create clinical record
      setLoadingStage(2);
      const clinRes = await createClinicalRecord({
        patient_id: selectedPatient.id,
        systolic_bp: parseFloat(clinical.systolic_bp),
        diastolic_bp: parseFloat(clinical.diastolic_bp),
        cholesterol: parseFloat(clinical.cholesterol),
        bmi: parseFloat(clinical.bmi),
        diabetes: clinical.diabetes,
        smoking_status: clinical.smoking_status,
      });
      setLoadingStage(3);

      // We need to create the retinal image DB record
      // The upload endpoint returned file info; prediction endpoint
      // will handle the DB record creation
      // Actually, we need to save the image record. Let me make a direct call.
      // The prediction endpoint references retinal_image_id, so we need
      // the backend to have saved it. Let's adjust: the upload endpoint
      // should save the record. Let me pass the DB save to the prediction flow.
      // For now, create image record via a supplementary approach:
      // We'll modify the upload endpoint to also persist to DB.
      // Actually, the cleanest approach: have the backend prediction endpoint
      // accept the filename and create the record itself.

      // Let's use the image filename from upload response
      setLoadingStage(4);

      const predRes = await createPrediction({
        patient_id: selectedPatient.id,
        clinical_record_id: clinRes.data.id,
        retinal_image_id: imgRes.data.image_id || 0,
        image_filename: imgRes.data.filename,
      });
      setLoadingStage(5);

      await new Promise((r) => setTimeout(r, 400));
      setLoadingStage(6);
      await new Promise((r) => setTimeout(r, 300));

      addToast('Assessment completed successfully');
      navigate(`/predictions/${predRes.data.id}`);

    } catch (err) {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Assessment failed';
      addToast(typeof msg === 'string' ? msg : 'Assessment failed', 'error');
      setPredicting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedPatient;
      case 1: return validateClinical();
      case 2: return !!imageFile && !imageError;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === 1 && !validateClinical()) return;
    if (step === 3) {
      handleSubmitAssessment();
      setStep(4);
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">New Assessment</h1>
        <p className="page-subtitle">Step-by-step cardiovascular risk assessment</p>
      </div>

      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div className="stepper-step">
              <div className={`stepper-number ${i === step ? 'active' : i < step ? 'completed' : ''}`}>
                {i < step ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={`stepper-label ${i === step ? 'active' : ''}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`stepper-line ${i < step ? 'completed' : ''}`} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="card">
        {/* Step 0: Patient */}
        {step === 0 && (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Select or Create Patient</h3>

            {selectedPatient ? (
              <div className="card-compact" style={{ background: 'var(--color-risk-low-bg)', borderColor: 'var(--color-risk-low)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{selectedPatient.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-slate)' }}>
                    {selectedPatient.patient_code} · {selectedPatient.age} yrs · {selectedPatient.gender}
                  </div>
                </div>
                <button className="btn-ghost" onClick={() => setSelectedPatient(null)}>Change</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                  <input className="input" placeholder="Search existing patients..." value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)} style={{ flex: 1 }} />
                  <button className="btn-secondary" onClick={() => setShowNewPatient(true)}>
                    <UserRound size={14} /> New Patient
                  </button>
                </div>

                {showNewPatient && (
                  <div className="card-compact" style={{ marginBottom: '1rem', background: 'var(--color-bone)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label className="label">Name</label>
                        <input className="input" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">Age</label>
                        <input className="input" type="number" min="1" max="120" value={newPatient.age}
                          onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">Gender</label>
                        <select className="input" value={newPatient.gender}
                          onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}>
                          <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                      </div>
                    </div>
                    {patientError && <p style={{ color: 'var(--color-risk-high)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>{patientError}</p>}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-primary" onClick={handleCreatePatient}>Create</button>
                      <button className="btn-ghost" onClick={() => setShowNewPatient(false)}>Cancel</button>
                    </div>
                  </div>
                )}

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {filteredPatients.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-slate)', padding: '2rem', fontSize: '0.875rem' }}>
                      {patients.length === 0 ? 'No patients registered. Create a new patient above.' : 'No patients match your search.'}
                    </p>
                  ) : (
                    filteredPatients.map((p) => (
                      <div key={p.id}
                        onClick={() => setSelectedPatient(p)}
                        style={{
                          padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderBottom: '1px solid var(--color-bone)', transition: 'background 150ms',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bone)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-slate)' }}>
                            {p.patient_code} · {p.age} yrs · {p.gender}
                          </div>
                        </div>
                        <ChevronRight size={16} style={{ color: 'var(--color-slate)' }} />
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 1: Clinical Data */}
        {step === 1 && (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Clinical Parameters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { key: 'systolic_bp', label: 'Systolic BP', unit: 'mmHg', type: 'number' },
                { key: 'diastolic_bp', label: 'Diastolic BP', unit: 'mmHg', type: 'number' },
                { key: 'cholesterol', label: 'Cholesterol', unit: 'mg/dL', type: 'number' },
                { key: 'bmi', label: 'BMI', unit: 'kg/m²', type: 'number' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="label">{field.label} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 'normal' }}>({field.unit})</span></label>
                  <input
                    className={`input ${clinicalErrors[field.key] ? 'input-error' : ''}`}
                    type={field.type}
                    value={clinical[field.key]}
                    onChange={(e) => setClinical({ ...clinical, [field.key]: e.target.value })}
                    placeholder={field.unit}
                  />
                  {clinicalErrors[field.key] && (
                    <p style={{ color: 'var(--color-risk-high)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{clinicalErrors[field.key]}</p>
                  )}
                </div>
              ))}
              <div>
                <label className="label">Diabetes</label>
                <select className="input" value={clinical.diabetes ? 'yes' : 'no'}
                  onChange={(e) => setClinical({ ...clinical, diabetes: e.target.value === 'yes' })}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="label">Smoking Status</label>
                <select className="input" value={clinical.smoking_status}
                  onChange={(e) => setClinical({ ...clinical, smoking_status: e.target.value })}>
                  <option value="never">Never</option>
                  <option value="former">Former</option>
                  <option value="current">Current</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Retinal Image */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h3 style={{ marginBottom: '1rem' }}>Upload Retinal Fundus Image</h3>
                {!imageFile ? (
                  <div
                    className={`upload-zone ${dragover ? 'dragover' : ''}`}
                    style={{ position: 'relative', overflow: 'hidden' }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
                    onDragLeave={() => setDragover(false)}
                    onDrop={handleDrop}
                  >
                    {dragover && <div className="retina-scan-line" />}
                    <Upload size={40} style={{ color: 'var(--color-mint)', marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Upload Retinal Fundus Image</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate)' }}>
                      JPEG or PNG · Max 16MB
                    </p>
                    <button className="btn-secondary" style={{ marginTop: '1rem' }}
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                      Choose File
                    </button>
                    <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileSelect(e.target.files?.[0])} />
                  </div>
                ) : (
                  <div className="upload-zone has-file" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', textAlign: 'left', cursor: 'default', flexWrap: 'wrap' }}>
                    <img src={imagePreview} alt="Retinal fundus preview"
                      style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-mist)' }} />
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--color-risk-low)' }} />
                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Image selected</span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-graphite)' }}>{imageFile.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-slate)' }}>
                        {(imageFile.size / 1024).toFixed(1)} KB
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                          Replace
                        </button>
                        <button className="btn-ghost" onClick={removeImage} style={{ color: 'var(--color-risk-high)' }}>
                          <X size={14} /> Remove
                        </button>
                        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileSelect(e.target.files?.[0])} />
                      </div>
                    </div>
                  </div>
                )}
                {imageError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', color: 'var(--color-risk-high)', fontSize: '0.8125rem' }}>
                    <AlertTriangle size={14} /> {imageError}
                  </div>
                )}

                {/* 1-Click Sample Retinal Scans Gallery */}
                <div style={{ marginTop: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#004d40', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} color="#004d40" /> Or Select from Sample Retinal Scans (1-Click)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
                    {[
                      { file: 'image001.png', label: 'Scan #1', tag: 'Normal' },
                      { file: 'image003.png', label: 'Scan #2', tag: 'Moderate' },
                      { file: 'image007.png', label: 'Scan #3', tag: 'Elevated' },
                      { file: 'image011.png', label: 'Scan #4', tag: 'Microvascular' },
                    ].map((item) => (
                      <div
                        key={item.file}
                        onClick={() => handleSelectSampleImage(item.file)}
                        style={{
                          cursor: 'pointer',
                          background: 'white',
                          border: imageFile?.name === item.file ? '2px solid #004d40' : '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '0.5rem',
                          textAlign: 'center',
                          transition: 'all 150ms',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <img
                          src={`/sample_retina/${item.file}`}
                          alt={item.label}
                          style={{ width: '100%', height: '64px', objectFit: 'cover', borderRadius: '6px', marginBottom: '0.35rem' }}
                        />
                        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0f172a' }}>{item.label}</div>
                        <div style={{ fontSize: '0.625rem', color: '#16a34a', fontWeight: 600 }}>{item.tag}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ padding: '1rem', background: 'var(--color-bone)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-mist)', width: '100%' }}>
                  <h4 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-slate)', marginBottom: '0.75rem' }}>AI Vision Requirement</h4>
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
                    <img src="/retina_fundus.png" alt="Retinal Fundus Placeholder" style={{ width: '100%', display: 'block' }} />
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-graphite)', lineHeight: 1.5, marginTop: '0.75rem' }}>
                    Please upload a real, high-quality retinal fundus image. 
                    Our AI models are specifically trained on macular and optic disc features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <h3 style={{ marginBottom: '1.25rem' }}>Review Assessment Data</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Left: Image */}
              <div>
                <h4 className="section-title">Retinal Image</h4>
                {imagePreview && (
                  <img src={imagePreview} alt="Retinal fundus" style={{
                    width: '100%', maxWidth: '300px', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-mist)'
                  }} />
                )}
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-slate)', marginTop: '0.5rem' }}>
                  {imageFile?.name}
                </p>
              </div>
              {/* Right: Info */}
              <div>
                <h4 className="section-title">Patient Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                  {[
                    ['Patient ID', selectedPatient?.patient_code],
                    ['Name', selectedPatient?.name],
                    ['Age', `${selectedPatient?.age} years`],
                    ['Gender', selectedPatient?.gender],
                    ['Systolic BP', `${clinical.systolic_bp} mmHg`],
                    ['Diastolic BP', `${clinical.diastolic_bp} mmHg`],
                    ['Cholesterol', `${clinical.cholesterol} mg/dL`],
                    ['BMI', `${clinical.bmi} kg/m²`],
                    ['Diabetes', clinical.diabetes ? 'Yes' : 'No'],
                    ['Smoking', clinical.smoking_status.charAt(0).toUpperCase() + clinical.smoking_status.slice(1)],
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding: '0.375rem 0' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ fontWeight: 500, color: 'var(--color-ink)' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Prediction Loading */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-spinner" />
            <h3 style={{ marginBottom: '1.5rem' }}>Running AI Assessment</h3>
            <div style={{ maxWidth: '320px', margin: '0 auto' }}>
              {LOADING_STAGES.map((stage, i) => (
                <div key={i} className={`loading-step ${i === loadingStage ? 'active' : i < loadingStage ? 'completed' : ''}`}>
                  {i < loadingStage ? (
                    <CheckCircle2 size={16} />
                  ) : i === loadingStage ? (
                    <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', margin: 0 }} />
                  ) : (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--color-mist)' }} />
                  )}
                  {stage}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-mist)' }}>
            <button className="btn-secondary" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}>
              <ChevronLeft size={16} /> Back
            </button>
            <button className="btn-primary" onClick={handleNext}
              disabled={(step === 0 && !selectedPatient) || (step === 2 && !imageFile)}>
              {step === 3 ? (
                <><BrainCircuit size={16} /> Run AI Assessment</>
              ) : (
                <>Next <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
