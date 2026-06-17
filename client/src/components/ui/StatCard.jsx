import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color = '#6366f1', trend, trendValue, subtitle, loading = false }) => {
  if (loading) {
    return (
      <div className="card stat-card">
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-10 w-16 mb-2" />
        <div className="skeleton h-3 w-32" />
      </div>
    );
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#94a3b8';

  return (
    <motion.div
      className="card stat-card"
      whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
      transition={{ duration: 0.2 }}
    >
      {/* Background gradient accent */}
      <div
        className="absolute inset-0 rounded-2xl opacity-5"
        style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted mb-1">{title}</p>
          <p
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'rgb(var(--text-primary))' }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {(trendValue !== undefined || subtitle) && (
            <div className="flex items-center gap-2 mt-2">
              {trendValue !== undefined && (
                <span className="flex items-center gap-1 text-xs font-medium" style={{ color: trendColor }}>
                  <TrendIcon size={12} />
                  {Math.abs(trendValue)}%
                </span>
              )}
              {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
            </div>
          )}
        </div>

        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
