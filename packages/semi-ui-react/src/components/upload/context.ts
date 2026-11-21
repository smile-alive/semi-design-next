import type { CSSProperties } from 'react';
import type { UploadPart } from '@fibrae/semi-foundation/components/upload/constants';
import { createContext } from '../../base/index';

export interface UploadContextValue {
    classNames?: Partial<Record<UploadPart, string>>;
    styles?: Partial<Record<UploadPart, CSSProperties>>;
}

export const [UploadContext, useUploadContext] = createContext<UploadContextValue>('Upload', { optional: true });
