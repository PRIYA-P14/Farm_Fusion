import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiDollarSign, FiFileText } from 'react-icons/fi';
import SchemeCard from './SchemeCard';
import EligibilityCard from './EligibilityCard';
import DocumentChecklist from './DocumentChecklist';
import GovernmentSummary from './GovernmentSummary';

export default function GovernmentDashboard({ report, onDelete }) {
  const dashRef = useRef();

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(dashRef.current, { scale: 1.5, useCORS: true });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`govt-schemes-${report.farmer_name}-${Date.now()}.pdf`);
  };

  const schemes = report.eligible_schemes || [];

  return (
    <div ref={dashRef} className="space-y-6">
      {/* Summary bar */}
      <GovernmentSummary report={report} onDelete={onDelete} onExportPDF={handleExportPDF} />

      {/* AI Eligibility */}
      <EligibilityCard
        aiDetails={report.ai_details}
        totalSubsidy={report.total_subsidy}
        totalLoan={report.total_loan}
        hasInsurance={report.has_insurance}
        schemeCount={schemes.length}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <FiDollarSign />, label: 'Total Subsidy Available', value: `₹${report.total_subsidy?.toLocaleString('en-IN') ?? 0}`, color: 'var(--accent-green)' },
          { icon: <FiFileText />, label: 'Loan Eligibility', value: report.total_loan > 0 ? `₹${report.total_loan?.toLocaleString('en-IN')}` : 'N/A', color: '#a78bfa' },
          { icon: <FiShield />, label: 'Crop Insurance', value: report.has_insurance ? '✅ Eligible' : '❌ Not Eligible', color: 'var(--accent-blue)' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
            className="glass rounded-2xl p-5 text-center">
            <div className="text-xl mb-2 flex justify-center" style={{ color: s.color }}>{s.icon}</div>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Scheme Tips from AI */}
      {report.ai_details?.scheme_tips?.length > 0 && (
        <div className="section-card">
          <div className="section-card-title">🤖 AI Application Tips</div>
          <div className="space-y-3">
            {report.ai_details.scheme_tips.map((tip, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--accent-green)' }}>{tip.scheme}</p>
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}><strong>Why eligible:</strong> {tip.why_eligible}</p>
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}><strong>Key benefit:</strong> {tip.key_benefit}</p>
                <p className="text-xs" style={{ color: 'var(--accent-amber)' }}>👉 {tip.first_step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eligible Schemes */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          ✅ Eligible Schemes ({schemes.length})
        </h2>
        {schemes.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No schemes matched your profile</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your farmer type or income details</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {schemes.map((scheme, i) => (
              <SchemeCard key={scheme.id || i} scheme={scheme} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Document Checklist */}
      {schemes.length > 0 && <DocumentChecklist schemes={schemes} />}

      {/* Not Eligible Schemes with reasons */}
      {(report.ineligible_schemes?.length > 0) && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            ❌ Not Eligible ({report.ineligible_schemes.length})
          </h2>
          <div className="space-y-2">
            {report.ineligible_schemes.map((scheme, i) => (
              <div key={scheme.id || i}
                className="flex items-start gap-3 rounded-xl p-3"
                style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <span className="text-base mt-0.5 flex-shrink-0">🚫</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {scheme.name}
                    <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                      {scheme.category}
                    </span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--accent-red)' }}>
                    Reason: {scheme.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Guidance */}
      {report.ai_details?.application_guidance && (
        <div className="section-card">
          <div className="section-card-title">📝 Application Guidance</div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {report.ai_details.application_guidance}
          </p>
          {report.ai_details.income_tips && (
            <div className="mt-3 rounded-xl p-3" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.20)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent-amber)' }}>💡 Income Tips</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{report.ai_details.income_tips}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
