import type { JSX } from 'solid-js';
import type { UploadPart } from '@fibrae/semi-foundation/components/upload/constants';
import { createContext } from '../../base/index';

export interface UploadContextValue {
    classNames?: Partial<Record<UploadPart, string>>;
    styles?: Partial<Record<UploadPart, JSX.CSSProperties>>;
}

export const [UploadContext, useUploadContext] = createContext<UploadContextValue>('Upload', { optional: true });

export interface AddAreaContextValue {
    /** Set by a Semi Button or IconButton created inside the add area */
    hasControl: boolean;
}

export const [AddAreaContext, useAddAreaContext] = createContext<AddAreaContextValue>('AddArea', { optional: true });

/**
 * Tells the enclosing add area that it holds a control. Called from the button's body, which runs on the server
 * too, so the area knows before its first frame rather than from the mounted DOM.
 */
export function useAddAreaControl() {
    const area = useAddAreaContext();
    if (area) {
        area.hasControl = true;
    }
}
