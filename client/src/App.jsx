import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { UsersPage } from './pages/UsersPage';
import { OfficersPage } from './pages/OfficersPage';
import { Button } from './components/ui';

function App() {
  const [currentPage, setCurrentPage] = useState('officers');

  return (
    <AppProvider>
      <div>
        <nav className="bg-white shadow-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-800">Forest Ranger</h1>
                <div className="flex space-x-2">
                  <Button
                    variant={currentPage === 'officers' ? 'primary' : 'ghost'}
                    onClick={() => setCurrentPage('officers')}
                    className="text-sm"
                  >
                    จัดการเจ้าหน้าที่
                  </Button>
                  <Button
                    variant={currentPage === 'users' ? 'primary' : 'ghost'}
                    onClick={() => setCurrentPage('users')}
                    className="text-sm"
                  >
                    ผู้ใช้งาน
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </nav>
        {currentPage === 'officers' && <OfficersPage />}
        {currentPage === 'users' && <UsersPage />}
      </div>
    </AppProvider>
  );
}

export default App;