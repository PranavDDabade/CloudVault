import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { formatBytes } from '../../utils/formatters';

const COLORS = ['#7C5CFF', '#8B5CF6', '#34D399', '#F59E0B', '#EF4444', '#06B6D4'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '10px 14px', fontSize: '13px',
      boxShadow: 'var(--shadow-md)',
    }}>
      <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: '13px', marginBottom: '2px', textTransform: 'capitalize' }}>
        {payload[0].name}
      </p>
      <p style={{ color: payload[0].payload.fill || '#7C3AED', fontWeight: 500 }}>
        {formatBytes(payload[0].value)} ({payload[0].payload.count} files)
      </p>
    </div>
  );
};

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
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
      <ResponsiveContainer width={200} height={200}>
        <PieChart>
          <Pie 
            data={chartData} 
            cx="50%" cy="50%" 
            innerRadius={65} 
            outerRadius={95}
            paddingAngle={0} 
            dataKey="value" 
            stroke="none"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {chartData.map((item) => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '4px', background: item.fill, flexShrink: 0 }} />
            <span style={{ fontSize: '14px', color: 'var(--text)', textTransform: 'capitalize', fontWeight: 500, minWidth: '80px' }}>
              {item.name}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {formatBytes(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '10px 14px', fontSize: '13px',
      boxShadow: 'var(--shadow-md)',
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>{label}</p>
      <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '13px' }}>{payload[0].value} files uploaded</p>
      {payload[1] && <p style={{ color: 'var(--text)', fontWeight: 500, fontSize: '12px', marginTop: '2px' }}>{formatBytes(payload[1].value)}</p>}
    </div>
  );
};

export const UploadTrendChart = ({ data }) => {
  if (!data?.length) return (
    <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
      No upload activity in this period.
    </div>
  );

  const chartData = data.map(d => ({
    date: d._id?.slice(5) || d._id, // MM-DD
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
        <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickMargin={10} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickMargin={10} />
        <Tooltip content={<AreaTooltip />} />
        <Area type="monotone" dataKey="files" stroke="var(--primary)" strokeWidth={2} fill="url(#colorFiles)" activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--primary)' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};
