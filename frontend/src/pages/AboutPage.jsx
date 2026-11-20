import { HeartPulse, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">About This Project</h1>
        <p className="page-subtitle">Academic research project — AI-driven cardiovascular risk assessment</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Overview */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <HeartPulse size={24} style={{ color: 'var(--color-deep-teal)' }} />
            <h2 style={{ fontSize: '1.125rem' }}>Project Overview</h2>
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-graphite)', lineHeight: 1.7 }}>
            This project investigates AI-assisted cardiovascular risk stratification using retinal fundus imaging
            and patient clinical parameters. The retinal microvasculature serves as a unique non-invasive window
            into systemic cardiovascular health. Changes in retinal blood vessel morphology — including vessel
            diameter, tortuosity, and arteriovenous ratio — have been associated with hypertension, diabetes,
            and cardiovascular disease.
          </p>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-graphite)', lineHeight: 1.7, marginTop: '0.75rem' }}>
            CardioVision AI combines deep learning-based retinal image analysis with clinical parameter processing
            through a multimodal architecture, providing estimated cardiovascular risk assessments with explainable
            AI visualizations.
          </p>
        </div>

        {/* Objectives */}
        <div className="card">
          <h3 className="section-title">Objectives</h3>
          <ol style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--color-graphite)', lineHeight: 1.8 }}>
            <li>Collect and preprocess retinal fundus images from publicly available datasets.</li>
            <li>Analyze retinal blood-vessel patterns associated with cardiovascular abnormalities.</li>
            <li>Develop a deep-learning model for cardiovascular risk prediction.</li>
            <li>Integrate retinal information with clinical parameters where supported by the dataset.</li>
            <li>Evaluate the model using accuracy, precision, recall and F1-score.</li>
            <li>Improve model interpretability using explainable AI techniques.</li>
          </ol>
        </div>

        {/* Problem Statement */}
        <div className="card">
          <h3 className="section-title">Problem Statement</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-graphite)', lineHeight: 1.7 }}>
            Cardiovascular disease (CVD) is a leading cause of morbidity and mortality worldwide.
            Early risk identification is critical for preventive care. Traditional risk assessment methods
            rely on invasive procedures and subjective clinical evaluation.
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-graphite)', lineHeight: 1.7, marginTop: '0.5rem' }}>
            This project explores whether retinal fundus images, which can be captured non-invasively,
            combined with standard clinical parameters, can be used to estimate cardiovascular risk
            through deep learning techniques.
          </p>
        </div>

        {/* Methodology */}
        <div className="card">
          <h3 className="section-title">Methodology</h3>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-graphite)', lineHeight: 1.8 }}>
            <p><strong>Image Processing:</strong> Retinal fundus images undergo preprocessing including
            border cropping, resizing, CLAHE contrast enhancement, and normalization.</p>
            <p style={{ marginTop: '0.5rem' }}><strong>Transfer Learning:</strong> A pre-trained CNN backbone
            (EfficientNetB0) extracts visual features from retinal images.</p>
            <p style={{ marginTop: '0.5rem' }}><strong>Clinical Processing:</strong> Patient clinical
            parameters are encoded, normalized, and processed through a dense network.</p>
            <p style={{ marginTop: '0.5rem' }}><strong>Multimodal Fusion:</strong> Image and clinical
            embeddings are concatenated and processed through dense layers with dropout for risk prediction.</p>
            <p style={{ marginTop: '0.5rem' }}><strong>Explainability:</strong> Grad-CAM visualization
            highlights regions of the retinal image that influenced the model's prediction.</p>
          </div>
        </div>

        {/* Technologies */}
        <div className="card">
          <h3 className="section-title">Technologies</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
            {[
              { category: 'Frontend', items: 'React, Vite, Tailwind CSS' },
              { category: 'Backend', items: 'Python, FastAPI, SQLAlchemy' },
              { category: 'ML/AI', items: 'TensorFlow/Keras, OpenCV' },
              { category: 'Database', items: 'SQLite' },
              { category: 'Reports', items: 'ReportLab (PDF)' },
              { category: 'Charts', items: 'Recharts' },
            ].map((t) => (
              <div key={t.category} style={{ padding: '0.5rem 0' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.category}</div>
                <div style={{ fontWeight: 500 }}>{t.items}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="card" style={{ gridColumn: '1 / -1', background: 'var(--color-bone)', borderColor: 'var(--color-mist)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <ShieldCheck size={20} style={{ color: 'var(--color-deep-teal)' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Medical Disclaimer</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-graphite)', lineHeight: 1.7 }}>
            This system is intended for academic and research decision support purposes only. It does not
            replace professional medical diagnosis, treatment, or advice. The AI-estimated risk probability
            should be interpreted alongside clinical judgement by qualified healthcare professionals.
            Do not make medical decisions based solely on the output of this system.
          </p>
        </div>
      </div>
    </div>
  );
}
