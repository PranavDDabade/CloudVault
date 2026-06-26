import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { formatBytes } from '../../utils/formatters';

export const TYPE_COLORS = {
  image:        '#7C5CFF',
  video:        '#F59E0B',
  audio:        '#06B6D4',
  document:     '#34D399',
  spreadsheet:  '#10B981',
  presentation: '#EF4444',
  archive:      '#8B5CF6',
  code:         '#3B82F6',
  other:        '#94A3B8',
};

const FALLBACK_COLORS = ['#7C5CFF','#8B5CF6','#34D399','#F59E0B','#EF4444','#06B6D4','#3B82F6','#94A3B8'];

// â”€â”€ Custom Tooltip shared â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', boxShadow: 'var(--shadow-md)' }}>
      <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '2px', textTransform: 'capitalize' }}>{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill, fontWeight: 500 }}>
        {formatBytes(payload[0].value)} Â· {payload[0].payload.count} files
      </p>
    </div>
  );
};

// â”€â”€ Donut Pie Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const StoragePieChart = ({ data }) => {
  if (!data?.length) return (
    <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
      No files yet. Upload files to see stats!
    </div>
  );

  const chartData = data.map((item, i) => ({
    name: item._id || 'Other',
    value: item.totalSize,
    count: item.count,
    fill: TYPE_COLORS[item._id] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
      <ResponsiveContainer width={200} height={200}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none">
            {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {chartData.map((item) => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.fill, flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: 'var(--text)', textTransform: 'capitalize', fontWeight: 500, minWidth: '90px' }}>{item.name}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatBytes(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// â”€â”€ Upload Trend Area Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', boxShadow: 'var(--shadow-md)' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>{label}</p>
      <p style={{ color: 'var(--primary)', fontWeight: 600 }}>{payload[0].value} file{payload[0].value !== 1 ? 's' : ''} uploaded</p>
      {payload[1] && <p style={{ color: 'var(--text)', fontWeight: 500, fontSize: '12px', marginTop: '2px' }}>{formatBytes(payload[1].value)}</p>}
    </div>
  );
};

export const UploadTrendChart = ({ data }) => {
  if (!data?.length) return (
    <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
      No upload activity in the last 30 days.
    </div>
  );

  const chartData = data.map(d => ({
    date: d._id?.slice(5) || d._id,
    files: d.count,
    size: d.totalSize,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="colorFiles" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickMargin={10} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickMargin={10} allowDecimals={false} />
        <Tooltip content={<AreaTooltip />} />
        <Area type="monotone" dataKey="files" stroke="var(--primary)" strokeWidth={2} fill="url(#colorFiles)" activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--primary)' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// â”€â”€ Horizontal Storage Bar Per Type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const StorageTypeBar = ({ type, totalSize, count, maxSize }) => {
  const pct = maxSize > 0 ? Math.max((totalSize / maxSize) * 100, 2) : 2;
  const color = TYPE_COLORS[type] || '#94A3B8';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize', minWidth: '90px', flexShrink: 0 }}>{type || 'Other'}</span>
      <div style={{ flex: 1, height: '6px', borderRadius: '4px', background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: color, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '64px', textAlign: 'right', flexShrink: 0 }}>{formatBytes(totalSize)}</span>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '48px', textAlign: 'right', flexShrink: 0 }}>{count} file{count !== 1 ? 's' : ''}</span>
    </div>
  );
};

// â”€â”€ Downloads Bar Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', boxShadow: 'var(--shadow-md)' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
      <p style={{ color: 'var(--primary)', fontWeight: 600 }}>{payload[0].value} {payload[0].name}</p>
    </div>
  );
};

export const TopFilesBarChart = ({ data, dataKey = 'downloadCount', label = 'downloads', color = 'var(--primary)' }) => {
  if (!data?.length) return (
    <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
      No data yet.
    </div>
  );
  const chartData = data.map(f => ({
    name: f.name.length > 18 ? f.name.slice(0, 18) + 'â€¦' : f.name,
    [dataKey]: f[dataKey],
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
        <Tooltip content={<BarTooltip />} />
        <Bar dataKey={dataKey} name={label} fill={color} radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
};

