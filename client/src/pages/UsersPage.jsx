import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { LoadingSpinner, ErrorAlert } from '../components/ui';

export function UsersPage() {
  const { data: users, loading, error, refetch } = useApi(() => api.get('/api/users'));

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
          Users
        </h1>

        {loading && <LoadingSpinner message="กำลังโหลดข้อมูล..." />}

        {error && <ErrorAlert message={error} onRetry={refetch} />}

        {!loading && !error && (
          <ul className="space-y-3">
            {users?.map((user) => (
              <li
                key={user.id}
                className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors"
              >
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold mr-3">
                  {user.id}
                </span>
                <span className="text-gray-700 font-medium">{user.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
