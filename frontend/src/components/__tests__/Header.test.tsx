import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from '../Header';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn(), language: 'en', resolvedLanguage: 'en' },
  }),
}));

const Where = () => <div data-testid='path'>{useLocation().pathname}</div>;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
      <Routes>
        <Route path='*' element={<Where />} />
      </Routes>
    </MemoryRouter>
  );

describe('Header component', () => {
  beforeEach(() => localStorage.clear());

  it('renders the compact wordmark', () => {
    renderAt('/');
    expect(screen.getByLabelText('E52 Reality home')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderAt('/');
    expect(screen.getAllByText('my_library').length).toBeGreaterThan(0);
    expect(screen.getAllByText('discover').length).toBeGreaterThan(0);
  });

  it('defaults to Flight mode for first-time visitors', () => {
    renderAt('/');
    const flight = screen.getByRole('tab', { name: /mode_flight/ });
    expect(flight).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to the coaster studio and remembers the choice', () => {
    renderAt('/fly');
    fireEvent.click(screen.getByRole('tab', { name: /mode_coaster/ }));
    expect(screen.getByTestId('path')).toHaveTextContent('/coaster');
    expect(localStorage.getItem('e52.mode')).toBe('coaster');
  });
});
