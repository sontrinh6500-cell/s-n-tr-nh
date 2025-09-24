import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon, CheckCircleSolidIcon } from '../components/icons/Icons';

interface User {
  username: string;
  active: boolean;
  password?: string;
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [editingUsername, setEditingUsername] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [addUsername, setAddUsername] = useState('');
    const [addPassword, setAddPassword] = useState('');
    const [showAddPassword, setShowAddPassword] = useState(false);
    
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadUsers = () => {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
        const userList = Object.keys(storedUsers).map(username => ({
            username,
            active: storedUsers[username]?.active || false
        }));
        setUsers(userList);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const showSuccessMessage = (message: string) => {
        setSuccess(message);
        setTimeout(() => setSuccess(null), 3000);
    };
    
    const showErrorMessage = (message: string) => {
        setError(message);
        setTimeout(() => setError(null), 3000);
    };

    const handleEdit = (username: string) => {
        setEditingUsername(username);
        setNewPassword('');
        setError(null);
        setSuccess(null);
    };

    const handleCancelEdit = () => {
        setEditingUsername(null);
        setNewPassword('');
    };

    const handlePasswordChange = (username: string) => {
        if (newPassword.length < 5) {
            showErrorMessage('Mật khẩu mới phải có ít nhất 5 ký tự.');
            return;
        }

        const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
        if (storedUsers[username]) {
            storedUsers[username].password = newPassword;
            localStorage.setItem('users', JSON.stringify(storedUsers));
            handleCancelEdit();
            showSuccessMessage(`Đã cập nhật mật khẩu cho ${username}.`);
        }
    };

    const handleDelete = (username: string) => {
        if (username === 'admin') {
            showErrorMessage('Không thể xóa tài khoản quản trị viên.');
            return;
        }

        if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}"?`)) {
            const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
            delete storedUsers[username];
            localStorage.setItem('users', JSON.stringify(storedUsers));
            loadUsers();
            showSuccessMessage(`Đã xóa tài khoản ${username}.`);
        }
    };
    
    const handleToggleActivation = (username: string) => {
        if (username === 'admin') {
            showErrorMessage('Không thể thay đổi trạng thái tài khoản quản trị viên.');
            return;
        }

        const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
        const user = storedUsers[username];
        if (user) {
            user.active = !user.active;
            localStorage.setItem('users', JSON.stringify(storedUsers));
            loadUsers();
            showSuccessMessage(`Đã ${user.active ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản ${username}.`);
        }
    };

    const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!addUsername.trim()) {
            showErrorMessage('Tên tài khoản không được để trống.');
            return;
        }
        if (addPassword.length < 5) {
            showErrorMessage('Mật khẩu phải có ít nhất 5 ký tự.');
            return;
        }

        const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
        if (storedUsers[addUsername]) {
            showErrorMessage('Tài khoản này đã tồn tại.');
            return;
        }

        storedUsers[addUsername] = { password: addPassword, active: false };
        localStorage.setItem('users', JSON.stringify(storedUsers));
        loadUsers();
        showSuccessMessage(`Đã thêm tài khoản ${addUsername}. Vui lòng kích hoạt tài khoản này.`);
        setAddUsername('');
        setAddPassword('');
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Quản lý tài khoản</h1>
                <p className="text-slate-600 mt-1">Kích hoạt, vô hiệu hóa, thêm, xóa, hoặc thay đổi mật khẩu cho người dùng.</p>
            </div>
            
            {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow" role="alert">
                    <p className="font-bold">Thành công!</p>
                    <p>{success}</p>
                </div>
            )}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow" role="alert">
                    <p className="font-bold">Lỗi</p>
                    <p>{error}</p>
                </div>
            )}


            {/* Add User Form */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-xl font-bold text-slate-700 mb-4">Thêm tài khoản mới</h2>
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="add-username" className="block text-sm font-medium text-gray-700 mb-1">Tài khoản</label>
                        <input
                            id="add-username"
                            type="text"
                            value={addUsername}
                            onChange={(e) => setAddUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                            placeholder="Tên người dùng mới"
                        />
                    </div>
                    <div>
                         <label htmlFor="add-password" className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                         <div className="relative">
                            <input
                                id="add-password"
                                type={showAddPassword ? 'text' : 'password'}
                                value={addPassword}
                                onChange={(e) => setAddPassword(e.target.value)}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                placeholder="Mật khẩu (tối thiểu 5 ký tự)"
                            />
                             <button
                                type="button"
                                onClick={() => setShowAddPassword(!showAddPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                aria-label={showAddPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                                {showAddPassword ? <EyeSlashIcon className="w-5 h-5 text-gray-400" /> : <EyeIcon className="w-5 h-5 text-gray-400" />}
                            </button>
                         </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full md:w-auto justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                    >
                        Thêm tài khoản
                    </button>
                </form>
            </div>


            {/* Users List */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tên tài khoản</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <React.Fragment key={user.username}>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <label htmlFor={`toggle-${user.username}`} className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id={`toggle-${user.username}`}
                                                className="sr-only peer"
                                                checked={user.active}
                                                disabled={user.username === 'admin'}
                                                onChange={() => handleToggleActivation(user.username)}
                                            />
                                            <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-sky-300 transition-colors ${user.username === 'admin' ? 'cursor-not-allowed' : ''} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500`}></div>
                                            <span className={`ml-3 text-sm font-medium ${user.active ? 'text-green-700' : 'text-gray-500'}`}>
                                                {user.active ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                                            </span>
                                        </label>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {editingUsername !== user.username && (
                                            <div className="flex items-center space-x-4">
                                                <button
                                                    onClick={() => handleEdit(user.username)}
                                                    disabled={user.username === 'admin'}
                                                    className="flex items-center text-sky-600 hover:text-sky-900 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                                    title={user.username === 'admin' ? 'Không thể sửa tài khoản admin' : 'Đổi mật khẩu'}
                                                >
                                                    <PencilIcon className="w-4 h-4 mr-1" />
                                                    Đổi mật khẩu
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.username)}
                                                    disabled={user.username === 'admin'}
                                                    className="flex items-center text-red-600 hover:text-red-900 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                                    title={user.username === 'admin' ? 'Không thể xóa tài khoản admin' : 'Xóa tài khoản'}
                                                >
                                                    <TrashIcon className="w-4 h-4 mr-1" />
                                                    Xóa
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                {editingUsername === user.username && (
                                    <tr className="bg-sky-50">
                                        <td colSpan={3} className="px-6 py-4">
                                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                                <div className="relative flex-grow w-full sm:w-auto">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                                        placeholder="Nhập mật khẩu mới"
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                                    >
                                                        {showPassword ? <EyeSlashIcon className="w-5 h-5 text-gray-400" /> : <EyeIcon className="w-5 h-5 text-gray-400" />}
                                                    </button>
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => handlePasswordChange(user.username)}
                                                        className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircleSolidIcon className="w-5 h-5 mr-2"/>
                                                        Lưu
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                                    >
                                                        Hủy
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
