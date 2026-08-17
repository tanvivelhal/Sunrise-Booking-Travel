import { avatarColor, initials } from '../../utils/format.js';

export function Avatar({ name, size = 'md', className = '' }) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${sizes[size]} ${avatarColor(name)} ${className}`}>
      {initials(name)}
    </span>
  );
}
