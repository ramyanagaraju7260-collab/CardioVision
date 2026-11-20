import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Dashboard ──
export const getDashboard = () => api.get('/dashboard');

// ── Patients ──
export const getPatients = (params) => api.get('/patients', { params });
export const getPatient = (id) => api.get(`/patients/${id}`);
export const createPatient = (data) => api.post('/patients', data);
export const deletePatient = (id) => api.delete(`/patients/${id}`);
export const getPatientPredictions = (id) => api.get(`/patients/${id}/predictions`);
export const getPatientTrajectory = (id) => api.get(`/patients/${id}/trajectory`);
export const simulateFollowUpVisit = (id, data) => api.post(`/patients/${id}/simulate-visit`, data);

// ── Clinical Records ──
export const createClinicalRecord = (data) => api.post('/clinical-records', data);

// ── Images ──
export const uploadImage = (formData) =>
  api.post('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getImageUrl = (filename) => `/api/images/${filename}`;

// ── Predictions ──
export const createPrediction = (data) => api.post('/predictions', data);
export const getPrediction = (id) => api.get(`/predictions/${id}`);
export const getPredictions = (params) => api.get('/predictions', { params });
export const deletePrediction = (id) => api.delete(`/predictions/${id}`);
export const getReportUrl = (id) => `/api/predictions/${id}/report`;
export const getPredictionCdss = (id) => api.get(`/predictions/${id}/cdss`);

// ── FHIR Interoperability ──
export const getPredictionFhir = (id) => api.get(`/predictions/${id}/fhir`);
export const getFhirDownloadUrl = (id) => `/api/predictions/${id}/fhir/download`;

// ── Model ──
export const getModelMetadata = () => api.get('/model/metadata');
export const getModelMetrics = () => api.get('/model/metrics');
export const getHealth = () => api.get('/health');

// ── Analytics & Demographics ──
export const getDemographics = () => api.get('/analytics/demographics');
export const getReports = () => api.get('/reports');
export const getAlerts = () => api.get('/analytics/alerts');

// ── Batch Cohort Screening ──
export const runCohortScreening = () => api.post('/batch/run-cohort-screening');
export const getCohortExportUrl = () => '/api/batch/export';

export default api;
