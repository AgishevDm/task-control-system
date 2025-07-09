import { useState, useRef, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import apiClient from '../../../../api/client';
import { isAxiosError } from 'axios';
import './newEmailConfirm.scss';

export default function NewEmailConfirm() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const savedData = JSON.parse(localStorage.getItem('registrationData') || '{}');
  const email = savedData.email || '';

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/verify-confirmation-code', {
        email,
        code: fullCode
      });

      if (response.data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setError('Неверный код подтверждения');
        setCode(Array(6).fill(''));
        inputsRef.current[0]?.focus();
      }
    } catch (err) {
      setStatus('error');
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Ошибка при проверке кода');
      } else {
        setError('Произошла неизвестная ошибка');
      }
      setCode(Array(6).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      const response = await apiClient.post('/auth/register', savedData);
      if (response.data) {
        localStorage.removeItem('registrationData');
        navigate('/login', { 
          replace: true,
          state: { registrationSuccess: true }
        });
      }
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Ошибка при регистрации');
      } else {
        setError('Произошла неизвестная ошибка');
      }
    }
  };

  return (
    <div className="confirm-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft />
      </button>

      <div className="glass-panel">
        <h2>Подтверждение email</h2>
        <p className="step-info">Шаг 4 из 4</p>

        <div className={`status-message ${status} ${status !== 'idle' ? 'visible' : ''}`}>
            {status === 'error' && 'Неверный код подтверждения'}
            {status === 'success' && '✓ Код подтвержден'}
        </div>

        <div className="code-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(el) => {inputsRef.current[index] = el}}
              className={status === 'success' ? 'valid' : status === 'error' ? 'error' : ''}
              autoFocus={index === 0}
              disabled={status === 'success'}
            />
          ))}
        </div>

        <div className="button-group">
          <button
            className={`btn complete ${status === 'success' ? 'valid' : ''}`}
            onClick={status === 'success' ? handleComplete : handleVerify}
            disabled={code.join('').length !== 6 || isLoading}
          >
            {isLoading ? 'Проверка...' : 
             status === 'success' ? 'Завершить регистрацию' : 'Подтвердить'}
          </button>
        </div>

        <div className="resend-code">
          Не получили код? <button 
            onClick={async () => {
              if (!canResend) return;
              try {
                setCanResend(false);
                await apiClient.post('/auth/send-confirmation-code', { email });
                setTimeout(() => setCanResend(true), 60000);
                setStatus('idle');
                setCode(Array(6).fill(''));
                inputsRef.current[0]?.focus();
              } catch (err) {
                setCanResend(true);
                if (isAxiosError(err)) {
                  setError(err.response?.data?.message || 'Ошибка при отправке кода');
                }
              }
            }}
            disabled={!canResend}
          >
            {canResend ? 'Отправить повторно' : 'Повторная отправка через 60 сек'}
          </button>
        </div>
      </div>
    </div>
  );
}