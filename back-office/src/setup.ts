import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Nettoyer après chaque test
afterEach(() => {
  cleanup();
});

// Mock pour axios si nécessaire
vi.mock('axios');

// Mock pour les routes React si nécessaire
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
  };
});
