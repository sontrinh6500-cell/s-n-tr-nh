import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from '../components/icons/Icons';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  // Common state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Registration state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  useEffect(() => {
    // Initialize default admin user if not present or in old format
    try {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (!users.admin || typeof users.admin !== 'object') {
        users.admin = { password: '12345', active: true };
        localStorage.setItem('users', JSON.stringify(users));
      }
    } catch (e) {
        // If storage is corrupt, reset it
        localStorage.setItem('users', JSON.stringify({ admin: { password: '12345', active: true } }));
    }


    // "Remember me" functionality
    const rememberedUser = localStorage.getItem('username');
    const rememberedPass = localStorage.getItem('password'); 
    if (rememberedUser && rememberedPass) {
      setUsername(rememberedUser);
      setPassword(rememberedPass);
      setRememberMe(true);
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[username];

    if (user && user.password === password) {
       if (user.active) {
            sessionStorage.setItem('isLoggedIn', 'true');
            if (rememberMe) {
                localStorage.setItem('username', username);
                localStorage.setItem('password', password); 
            } else {
                localStorage.removeItem('username');
                localStorage.removeItem('password');
            }
            onLoginSuccess(username);
       } else {
            setError('Tài khoản của bạn chưa được kích hoạt. Vui lòng liên hệ quản trị viên.');
       }
    } else {
      setError('Tài khoản hoặc mật khẩu không đúng.');
    }
  };
  
  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    if (!newUsername.trim()) {
        setError('Tên tài khoản không được để trống.');
        return;
    }

    if (newPassword.length < 5) {
        setError('Mật khẩu phải có ít nhất 5 ký tự.');
        return;
    }

    if (newPassword !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[newUsername]) {
        setError('Tài khoản này đã tồn tại.');
        return;
    }

    users[newUsername] = { password: newPassword, active: false };
    localStorage.setItem('users', JSON.stringify(users));
    
    setSuccessMessage('Đăng ký thành công! Vui lòng chờ quản trị viên kích hoạt tài khoản của bạn.');
    setIsRegistering(false);
    // Clear registration form
    setNewUsername('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };
  
  const toggleForm = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    setSuccessMessage(null);
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-200 transition-all">
        {isRegistering ? (
          <>
            <h1 className="text-3xl font-bold text-center text-slate-800">
              Đăng ký tài khoản
            </h1>
            <form className="space-y-6" onSubmit={handleRegisterSubmit}>
              <div>
                <label
                  htmlFor="new-username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tài khoản
                </label>
                <input
                  id="new-username"
                  name="new-username"
                  type="text"
                  autoComplete="username"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Chọn một tên tài khoản"
                />
              </div>
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mật khẩu
                </label>
                <div className="relative mt-1">
                  <input
                    id="new-password"
                    name="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Mật khẩu (ít nhất 5 ký tự)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showNewPassword 
                      ? <EyeSlashIcon className="w-5 h-5 text-gray-400 transition-colors hover:text-gray-600" /> 
                      : <EyeIcon className="w-5 h-5 text-gray-400 transition-colors hover:text-gray-600" />
                    }
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Xác nhận mật khẩu
                </label>
                <div className="relative mt-1">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Nhập lại mật khẩu của bạn"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword 
                      ? <EyeSlashIcon className="w-5 h-5 text-gray-400 transition-colors hover:text-gray-600" /> 
                      : <EyeIcon className="w-5 h-5 text-gray-400 transition-colors hover:text-gray-600" />
                    }
                  </button>
                </div>
              </div>
              {error && (
                <p className="text-sm text-center text-red-600 -my-2">{error}</p>
              )}
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                >
                  Đăng ký
                </button>
              </div>
            </form>
             <p className="text-sm text-center text-gray-600">
              Đã có tài khoản?{' '}
              <button onClick={toggleForm} className="font-medium text-sky-600 hover:text-sky-500">
                Đăng nhập
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-center text-slate-800">
              Đăng nhập
            </h1>
            {successMessage && !error && (
                <p className="text-sm text-center text-green-600 -my-2">{successMessage}</p>
            )}
            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tài khoản
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Nhập tài khoản"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mật khẩu
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword 
                      ? <EyeSlashIcon className="w-5 h-5 text-gray-400 transition-colors hover:text-gray-600" /> 
                      : <EyeIcon className="w-5 h-5 text-gray-400 transition-colors hover:text-gray-600" />
                    }
                  </button>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                  Ghi nhớ đăng nhập
                </label>
              </div>

              {error && (
                <p className="text-sm text-center text-red-600 -my-2">{error}</p>
              )}

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
                >
                  Đăng nhập
                </button>
              </div>
            </form>
            <p className="text-sm text-center text-gray-600">
              Chưa có tài khoản?{' '}
              <button onClick={toggleForm} className="font-medium text-sky-600 hover:text-sky-500">
                Đăng ký ngay
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
