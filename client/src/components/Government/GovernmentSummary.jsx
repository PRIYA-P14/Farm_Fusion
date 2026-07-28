import { FiDownload, FiPrinter, FiTrash2 } from 'react-icons/fi';

export default function GovernmentSummary({ report, onDelete, onExportPDF }) {
  const handlePrint = () => window.print();

  const cibilColor = !report.cibil_score ? 'var(--text-muted)'
    : report.cibil_score >= 750 ? 'var(--accent-green)'
    : report.cibil_score >= 700 ? 'var(--accent-blue)'
    : report.cibil_score >= 650 ? 'var(--accent-amber)'
    : 'var(--accent-red)';

  const cibilLabel = !report.cibil_score ? null
    : report.cibil_score >= 750 ? 'Excellent'
    : report.cibil_score >= 700 ? 'Good'
    : report.cibil_score >= 650 ? 'Fair'
    : report.cibil_score >= 600 ? 'Poor' : 'Very Poor';

  return (
    <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{report.farmer_name}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {report.state} · {report.crop} · {report.farmer_type} Farmer · {new Date(report.created_at).toLocaleDateString()}
        </p>
        <div className="flex gap-3 mt-1 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--accent-blue)' }}>
            💰 Income: ₹{(report.annual_income / 1000).toFixed(0)}K/yr
          </span>
          {report.cibil_score > 0 && (
            <span className="text-xs font-semibold" style={{ color: cibilColor }}>
              📊 CIBIL: {report.cibil_score} — {cibilLabel}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onExportPDF} className="btn-secondary py-2 px-3 text-xs">
          <FiDownload size={13} /> PDF
        </button>
        <button onClick={handlePrint} className="btn-secondary py-2 px-3 text-xs">
          <FiPrinter size={13} /> Print
        </button>
        {onDelete && (
          <button onClick={onDelete} className="btn-danger py-2 px-3 text-xs">
            <FiTrash2 size={13} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
