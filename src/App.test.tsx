import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

describe('Smart Paste & Image Integration Flow v1.1', () => {
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

  it('routes to Base64 image mode when pasting image Data URI', async () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText(/Paste anything/i);
    const pngDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    fireEvent.change(textarea, { target: { value: pngDataUri } });

    await waitFor(() => {
      expect(window.location.hash).toContain('/t/base64');
    });
  });

  it('shows inline color swatch when pasting hex color', async () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText(/Paste anything/i);

    fireEvent.change(textarea, { target: { value: '#ff5722' } });

    await waitFor(() => {
      expect(screen.getAllByText('#ff5722').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Detected Hex Color/i)).toBeTruthy();
    });
  });
});
