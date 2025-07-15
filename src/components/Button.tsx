import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled,
  className,
  ...props
}) => {
  const baseClasses = [
    // Base button styles
    'border-none',
    'rounded-lg',
    'font-medium',
    'cursor-pointer',
    'transition-all',
    'duration-300',
    'no-underline',
    'inline-block',
    'relative',
    'overflow-hidden',
    'text-center',
  ];

  const variantClasses = {
    primary: [
      'bg-gradient-to-br',
      'from-blue-500',
      'to-blue-700',
      'text-gray-100'
    ],
    secondary: [
      'bg-gradient-to-br',
      'from-gray-500',
      'to-gray-600',
      'text-gray-100'
    ],
  };

  const sizeClasses = {
    small: ['px-3', 'py-2', 'text-sm'],
    medium: ['px-6', 'py-3', 'text-base'],
    large: ['px-8', 'py-4', 'text-lg'],
  };

  const hoverClasses = [
    'hover:not(:disabled):-translate-y-0.5',
    'active:not(:disabled):translate-y-0',
  ];

  const disabledClasses = [
    'disabled:bg-gray-500',
    'disabled:cursor-not-allowed',
    'disabled:transform-none',
    'disabled:shadow-none',
    'disabled:opacity-60',
    'disabled:bg-gradient-to-br',
    'disabled:from-gray-500',
    'disabled:to-gray-500',
  ];

  const loadingClasses = [
    'disabled:cursor-wait',
  ];

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        hoverClasses,
        disabledClasses,
        loading && loadingClasses,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

export default Button;
