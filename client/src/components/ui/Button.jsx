/**
 * @param {'primary'|'secondary'|'danger'|'ghost'} variant
 */
export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary:   'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400',
    danger:    'bg-red-600  text-white hover:bg-red-700  active:bg-red-800',
    ghost:     'bg-transparent text-blue-600 hover:bg-blue-50 active:bg-blue-100',
  };

  return (
    <button
      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
