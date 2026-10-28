import { cleanup } from '@testing-library/react';
import { afterEach } from 'vite-plus/test';

// Testing Library only registers its auto cleanup when afterEach is a global
afterEach(cleanup);
