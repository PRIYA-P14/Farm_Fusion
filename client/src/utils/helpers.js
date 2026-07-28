export function downloadCSVBlob(blob, filename = 'soil-reports.csv') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const scoreColor = (score) => {
  if (score >= 75) return { text: 'text-green-400', bg: 'bg-green-500', border: 'border-green-500', hex: '#22c55e' };
  if (score >= 55) return { text: 'text-yellow-400', bg: 'bg-yellow-500', border: 'border-yellow-500', hex: '#eab308' };
  if (score >= 35) return { text: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500', hex: '#f97316' };
  return { text: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500', hex: '#ef4444' };
};

export const severityColor = (type) => ({
  error:   'bg-red-500/10 border-red-500/30 text-red-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  success: 'bg-green-500/10 border-green-500/30 text-green-400',
  info:    'bg-blue-500/10 border-blue-500/30 text-blue-400',
}[type] || 'bg-slate-500/10 border-slate-500/30 text-slate-400');
