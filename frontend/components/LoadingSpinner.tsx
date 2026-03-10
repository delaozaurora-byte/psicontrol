export default function LoadingSpinner({ size = 'md', fullPage = false }: { size?: 'sm' | 'md' | 'lg'; fullPage?: boolean }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  const spinner = (
    <div className={`animate-spin rounded-full border-indigo-600 border-t-transparent ${sizeClasses[size]}`} />
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  );
}
