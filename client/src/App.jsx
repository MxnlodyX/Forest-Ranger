import { AppProvider } from './context/AppContext';
import { UsersPage } from './pages/UsersPage';

function App() {
  return (
    <AppProvider>
      <UsersPage />
    </AppProvider>
  );
}

export default App;