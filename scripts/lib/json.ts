import fs from 'node:fs';

export const readJson = <T = any>(file: string): T => JSON.parse(fs.readFileSync(file, 'utf8'));
