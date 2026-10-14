import { useState, forwardRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

/**
 * Reusable PasswordInput Component with Accessible Show/Hide Toggle
 * 
 * Features:
 * - Toggle visibility between 'password' and 'text'
 * - Eye icon when hidden, EyeOff icon when visible
 * - Fully accessible with keyboard navigation, aria-label, and aria-pressed
 * - Right padding to prevent text overlapping the toggle icon
 * - Maintains existing DDCET RankRise styling, theme colors, and responsiveness
 */
const PasswordInput = forwardRef(function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = 'Enter password',
  required = false,
  autoComplete = 'current-password',
  disabled = false,
  className = '',
  hasLeftIcon = true,
  leftIcon: LeftIcon = Lock,
  showToggle = true,
  ariaLabel,
  toggleAriaLabel,
  ...rest
}, ref) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const defaultClasses = `w-full ${hasLeftIcon ? 'pl-10' : 'pl-3.5'} ${showToggle ? 'pr-11' : 'pr-3.5'} py-2.5 border border-[#E2E8F0] dark:border-slate-700 rounded-lg bg-[#F8FAFC] dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition disabled:opacity-60 disabled:cursor-not-allowed`;

  const ariaLabelText = toggleAriaLabel 
    ? (typeof toggleAriaLabel === 'function' ? toggleAriaLabel(showPassword) : toggleAriaLabel)
    : (showPassword ? 'Hide password' : 'Show password');

  return (
    <div className="relative w-full">
      {hasLeftIcon && LeftIcon && (
        <LeftIcon 
          size={16} 
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none select-none" 
          aria-hidden="true"
        />
      )}

      <input
        ref={ref}
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-label={ariaLabel}
        className={className ? `${defaultClasses} ${className}` : defaultClasses}
        {...rest}
      />

      {showToggle && (
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          aria-label={ariaLabelText}
          aria-pressed={showPassword}
          title={ariaLabelText}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-1 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showPassword ? (
            <EyeOff size={16} className="shrink-0" aria-hidden="true" />
          ) : (
            <Eye size={16} className="shrink-0" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
});

export default PasswordInput;
