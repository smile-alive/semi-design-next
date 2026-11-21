import type { ClassValue } from 'svelte/elements';
import type { UploadPart } from '@fibrae/semi-foundation/components/upload/constants';
import { createContext } from '../../base/index.js';

export interface UploadContextValue {
    classNames?: Partial<Record<UploadPart, ClassValue>>;
    styles?: Partial<Record<UploadPart, string>>;
}

export const [getUploadContext, setUploadContext] = createContext<UploadContextValue>('Upload', { optional: true });
