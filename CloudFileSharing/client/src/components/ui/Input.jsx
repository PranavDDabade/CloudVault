import { forwardRef } from 'react';
import { cn } from '../../utils/formatters';

const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  iconRight,
  className = '',
  wrapperClass = '',
  type = 'text',
  ...props
}, ref) => {
  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClass)}>
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}>
            <Icon size={16} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'input',
            Icon && 'pl-10',
            iconRight && 'pr-10',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}>
            {iconRight}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
