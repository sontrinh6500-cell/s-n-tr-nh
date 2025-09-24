
import React from 'react';
import { ActiveView } from '../types';
import { ChevronLeftIcon, IdCardIcon, RestoreIcon, MenuIcon, LogoutIcon, UserGroupIcon } from './icons/Icons';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeView: ActiveView;
  setActiveView: React.Dispatch<React.SetStateAction<ActiveView>>;
  onLogout: () => void;
  loggedInUser: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activeView, setActiveView, onLogout, loggedInUser }) => {
  const NavItem = ({ icon, text, view, onClick }: { icon: JSX.Element; text: string; view?: ActiveView; onClick?: () => void; }) => {
    const isActive = view ? activeView === view : false;
    return (
      <li
        onClick={() => {
          if (view) setActiveView(view);
          if (onClick) onClick();
        }}
        className={`flex items-center p-3 my-2 rounded-lg cursor-pointer transition-colors duration-200 ${
          isActive
            ? 'bg-sky-600 text-white shadow-md'
            : 'text-gray-300 hover:bg-slate-700 hover:text-white'
        }`}
      >
        {icon}
        <span
          className={`overflow-hidden transition-all duration-300 ${
            isOpen ? 'w-40 ml-4' : 'w-0 ml-0'
          }`}
        >
          {text}
        </span>
      </li>
    );
  };

  return (
    <aside
      className={`relative bg-slate-800 text-white h-screen flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-700 h-16">
        <h1 className={`font-bold text-xl whitespace-nowrap overflow-hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Chức Năng</h1>
         <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg hover:bg-slate-700">
          {isOpen ? <ChevronLeftIcon /> : <MenuIcon />}
        </button>
      </div>

      <nav className="flex-1 px-4 py-4">
        <ul>
          <NavItem icon={<IdCardIcon />} text="Chỉnh sửa ảnh thẻ" view={ActiveView.IdPhoto} />
          <NavItem icon={<RestoreIcon />} text="Phục hồi ảnh cũ" view={ActiveView.RestorePhoto} />
          {loggedInUser === 'admin' && (
             <NavItem icon={<UserGroupIcon />} text="Quản lý tài khoản" view={ActiveView.UserManagement} />
          )}
        </ul>
      </nav>

      <div className="px-4 py-4 border-t border-slate-700">
        <ul>
            <NavItem icon={<LogoutIcon />} text="Đăng xuất" onClick={onLogout} />
        </ul>
      </div>

      <div className={`p-4 border-t border-slate-700 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-xs text-slate-400 text-center">PHẦN MỀM ĐƯỢC PHÁT TRIỂN BỞI SƠN TRỊNH</p>
      </div>
    </aside>
  );
};

export default Sidebar;
