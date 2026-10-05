import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// These ship ESM-only builds that Jest 27 can't parse; the tests don't need them.
jest.mock('@vercel/analytics', () => ({ inject: () => {}, track: () => {} }));
jest.mock('@vercel/speed-insights', () => ({ injectSpeedInsights: () => {} }));

jest.mock('./services/googleReviews', () => ({
  __esModule: true,
  default: {
    fetchGoogleReviews: async () => ({ averageRating: 4.6, totalReviews: 10, reviews: [] }),
    generateStarDisplay: () => '★★★★★',
    formatRating: (rating) => rating.toFixed(1),
    getReviewsUrl: () => '#',
    getWriteReviewUrl: () => '#',
  },
}));

const renderAt = async (search) => {
  window.history.pushState({}, '', `/${search}`);
  render(
    <MemoryRouter initialEntries={[`/${search}`]}>
      <App />
    </MemoryRouter>
  );
  // Let the mocked reviews fetch and lazy sections settle inside act().
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

beforeEach(() => {
  localStorage.clear();
});

test('renders Albanian by default', async () => {
  await renderAt('');
  expect(screen.getAllByText('Rreth Nesh').length).toBeGreaterThan(0);
});

test('renders English for ?lang=en, even with a saved Albanian preference', async () => {
  localStorage.setItem('preferredLanguage', 'al');
  await renderAt('?lang=en');
  expect(screen.getAllByText('About').length).toBeGreaterThan(0);
  expect(screen.queryByText('Rreth Nesh')).not.toBeInTheDocument();
});

test('renders Italian for ?lang=it', async () => {
  await renderAt('?lang=it');
  expect(screen.getAllByText('Chi Siamo').length).toBeGreaterThan(0);
});
