const VARIANTS = {
  primary: 'btn-primary',
  navy: 'btn-navy',
  accent: 'btn-accent',
  green: 'btn-green',
  outline: 'btn-outline',
  outlineWhite: 'btn-outline-white',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

const SIZES = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={`${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
