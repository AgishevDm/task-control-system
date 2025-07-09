import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders auth page by default', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  
  // Проверяем существующие элементы из вашего App.tsx
  expect(screen.getByText(/login/i)).toBeInTheDocument();
});