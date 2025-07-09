import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import apiClient from '../../../../api/client';
import { isAxiosError } from 'axios';
import './newEmail.scss';

export default function NewEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => {
    const savedData = localStorage.getItem('registrationData');
    return savedData ? JSON.parse(savedData).email || '' : '';
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('registrationData');
    const data = savedData ? JSON.parse(savedData) : {};
    localStorage.setItem('registrationData', JSON.stringify({...data, email}));
  }, [email]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  const handleNext = async () => {
    if (!email) {
      setError('Поле email обязательно для заполнения');
      return;
    }
    if (!validateEmail(email)) {
      setError('Введите корректный email');
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post('/auth/send-confirmation-code', { email });
      navigate('../confirm');
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Ошибка при отправке кода');
      } else {
        setError('Произошла неизвестная ошибка');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="email-container">
      <button className="close-btn" onClick={() => navigate('/login')}>
        <FaTimes />
      </button>
      
      <div className="auth-container">
        <div className="form-section">
          <h2>Подтверждение email</h2>
          <p className="step-info">Шаг 3 из 4</p>

          <div className={`error-message ${error ? 'visible' : ''}`}>
            {error}
          </div>

          <div className="input-group">
            <div className="input-field">
              <label>Email</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className={error ? 'error' : ''}
                />
              </div>
            </div>
          </div>

          <div className="button-group">
            <button 
              className="btn back"
              onClick={() => navigate(-1)}
            >
              Назад
            </button>
            <button 
              className="btn next"
              onClick={handleNext}
              disabled={!email || !!error || isLoading}
            >
              {isLoading ? 'Отправка...' : 'Отправить код'}
            </button>
          </div>

          <div className="login-link">
            Уже есть аккаунт? <span onClick={() => navigate('/login')}>Войти</span>
          </div>
        </div>

        <div className="graphic-section">
          Для завершения регистрации подтвердите ваш email
        </div>
      </div>
    </div>
  );
}