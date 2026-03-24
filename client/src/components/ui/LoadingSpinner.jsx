export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10" role="status" aria-live="polite">
      <div className="w-9 h-9 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );
}
