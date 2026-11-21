import type { ClassValue, ComputedRef, StyleValue } from 'vue';
import type { UploadPart } from '@fibrae/semi-foundation/components/upload/constants';
import { createContext } from '../../base/index';

export interface UploadContextValue {
    classNames?: Partial<Record<UploadPart, ClassValue>>;
    styles?: Partial<Record<UploadPart, StyleValue>>;
}

export const [provideUploadContext, useUploadContext] = createContext<ComputedRef<UploadContextValue>>('Upload', { optional: true });
