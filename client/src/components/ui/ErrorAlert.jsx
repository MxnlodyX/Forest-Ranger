export function ErrorAlert({ title = 'เกิดข้อผิดพลาด', message, onRetry }) {
  return (
    <div
      role="alert"
      className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 space-y-1"
    >
      <p className="font-semibold text-red-700">{title}</p>
      {message && <p className="text-sm text-red-600">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm text-red-700 underline hover:no-underline focus-visible:outline-none"
        >
          ลองใหม่อีกครั้ง
        </button>
      )}
    </div>
  );
}
