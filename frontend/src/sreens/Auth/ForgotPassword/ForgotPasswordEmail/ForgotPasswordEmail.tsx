import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import apiClient from '../../../../api/client';
import { isAxiosError } from 'axios';
import './ForgotPasswordEmail.scss';

export default function ForgotPasswordEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('Поле email обязательно для заполнения');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/send-confirmation-code-reset-email', { email });
      navigate('../confirm', { state: { email } });
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
          <h2>Восстановление пароля</h2>
          <p className="step-info">Введите email вашего аккаунта</p>

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
                />
              </div>
            </div>
          </div>

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
              disabled={!email || isLoading}
            >
              {isLoading ? 'Отправка...' : 'Подтвердить'}
            </button>
          </div>
        </div>

        <div className="graphic-section">
          Введите email для восстановления пароля
        </div>
      </div>
    </div>
  );
}