import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './ResetPassword.scss';
import { isAxiosError } from 'axios';
import apiClient from '../../../../api/client';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/reset-password', {
        email,
        password: confirmPassword
      });

      if (response.data.success) {
        navigate('/login', { state: { passwordReset: true } });
      }
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Ошибка при смене пароля');
      } else {
        setError('Произошла неизвестная ошибка');
      }
    } finally {
      setIsLoading(false);
    }
    
    navigate('/login', { state: { passwordReset: true } });
  };

  return (
    <div className="password-reset-container">
      <div className="auth-container">
        <div className="graphic-section">
          <span>Безопасность аккаунта - наш приоритет</span>
        </div>

        <div className="form-section">
          <h2>Новый пароль</h2>
          
          <div className="input-group">
            <div className="input-field">
              <label>Новый пароль</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите новый пароль"
                />
                <span 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="input-field">
              <label>Подтвердите пароль</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                />
                <span 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
          </div>

          {error && <div className="error-message visible">{error}</div>}

          <div className="button-group">
            <button 
              className="btn cancel"
              onClick={() => navigate('/login')}
            >
              Отмена
            </button>
            <button 
              className="btn confirm"
              onClick={handleSubmit}
              disabled={!password || !confirmPassword}
            >
              Подтвердить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}