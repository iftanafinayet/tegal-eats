import { render, screen } from '@testing-library/react';
import App from './App';

test('renders splash branding', () => {
  render(<App />);
  expect(screen.getByText(/TegalEats/i)).toBeInTheDocument();
});
