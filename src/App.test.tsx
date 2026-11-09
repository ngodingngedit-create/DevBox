import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

describe('Smart Paste Integration Flow', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('renders hero title and paste textarea', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/Paste anything/i)).toBeTruthy();
  });

  it('routes to JWT tool on pasting JWT token', async () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText(/Paste anything/i);
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN_pGMstwtS_vT';

    fireEvent.change(textarea, { target: { value: jwt } });

    await waitFor(() => {
      expect(window.location.hash).toContain('/t/jwt');
    });
  });

  it('routes to JSON tool on pasting JSON string', async () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText(/Paste anything/i);
    const jsonStr = '{"service": "devbox", "status": "active"}';

    fireEvent.change(textarea, { target: { value: jsonStr } });

    await waitFor(() => {
      expect(window.location.hash).toContain('/t/json');
    });
  });

  it('routes to Timestamp tool on pasting 10-digit epoch timestamp', async () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText(/Paste anything/i);

    fireEvent.change(textarea, { target: { value: '1700000000' } });

    await waitFor(() => {
      expect(window.location.hash).toContain('/t/timestamp');
    });
  });
});
