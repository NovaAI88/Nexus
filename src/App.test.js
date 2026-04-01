import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the NEXUS shell', () => {
  render(<App />);
  expect(screen.getAllByText(/^NEXUS$/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/Good\s+(morning|afternoon|evening),\s*Nicholas/i)).toBeInTheDocument();
});
