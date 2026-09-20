import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { LocaleProvider } from '@/context/LocaleContext';

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('home language flow', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('starts an English session without fixed Chinese topic subtitles', async () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(await screen.findByText('What is weighing on your heart?')).toBeTruthy();
    expect(screen.getByText('Love')).toBeTruthy();
    expect(screen.queryByText('爱情')).toBeNull();
  });

  it('starts a Chinese session', async () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: '中文' }));
    expect(await screen.findByText('你心里在挂念什么？')).toBeTruthy();
    expect(screen.getByText('爱情')).toBeTruthy();
  });
});
