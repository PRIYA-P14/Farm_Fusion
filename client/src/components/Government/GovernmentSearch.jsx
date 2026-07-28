import { FiSearch, FiX } from 'react-icons/fi';

const STATES = ['All', 'Andhra Pradesh', 'Bihar', 'Gujarat', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'West Bengal'];

const FARMER_TYPES = ['All', 'Small', 'Marginal', 'Medium', 'Large'];

export default function GovernmentSearch({ filters, onChange, onClear }) {
  const set = (key, val) => onChange({ ...filters, [key]: val === 'All' ? '' : val, page: 1 });

  return (
    <div className="glass rounded-2xl p-4 flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          className="input-field pl-9 py-2 text-sm"
          placeholder="Search farmer, state, crop…"
          value={filters.q || ''}
          onChange={e => set('q', e.target.value)}
        />
      </div>

      {/* State */}
      <select className="input-field py-2 text-sm w-auto"
        value={filters.state || 'All'}
        onChange={e => set('state', e.target.value)}>
        {STATES.map(s => <option key={s}>{s}</option>)}
      </select>

      {/* Farmer Type */}
      <select className="input-field py-2 text-sm w-auto"
        value={filters.farmer_type || 'All'}
        onChange={e => set('farmer_type', e.target.value)}>
        {FARMER_TYPES.map(t => <option key={t}>{t}</option>)}
      </select>

      {/* Clear */}
      {(filters.q || filters.state || filters.farmer_type) && (
        <button onClick={onClear} className="btn-secondary py-2 px-3 text-xs">
          <FiX size={13} /> Clear
        </button>
      )}
    </div>
  );
}
