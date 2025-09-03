// Vitest setup: nothing special yet but placeholder for DOM globals
import matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

// Extend expect with jest-dom matchers
expect.extend(matchers as any);
