import path from 'node:path';

export const root = path.resolve(import.meta.dirname, '../..');
export const website = path.join(root, 'website');
