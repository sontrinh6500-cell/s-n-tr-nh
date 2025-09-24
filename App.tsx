
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import IdPhotoEditor from './pages/IdPhotoEditor';
import PhotoRestorer from './pages/PhotoRestorer';
import LoginPage from './pages/LoginPage';
import UserManagement from './pages/UserManagement'; // Import trang mới
import { ActiveView } from './types';

const App: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => sessionStorage.getItem('username'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>(ActiveView.IdPhoto);

  const handleLoginSuccess = (username: string) => {
    sessionStorage.setItem('username', username);
    setLoggedInUser(username);
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('username');
    setLoggedInUser(null);
  };

  if (!loggedInUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case ActiveView.IdPhoto:
        return <IdPhotoEditor />;
      case ActiveView.RestorePhoto:
        return <PhotoRestorer />;
      case ActiveView.UserManagement:
        return <UserManagement />; // Thêm case cho trang quản lý
      default:
        return <IdPhotoEditor />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        activeView={activeView}
        setActiveView={setActiveView} 
        onLogout={handleLogout}
        loggedInUser={loggedInUser} // Truyền tên người dùng
      />
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
