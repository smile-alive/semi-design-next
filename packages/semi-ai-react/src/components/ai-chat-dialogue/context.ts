import type { CSSProperties } from 'react';
import { createContext } from '@fibrae/semi-ui-react/base';

export interface CodePart {
    className?: string;
    style?: CSSProperties;
}

// The code block is a markdown component that the markdown renderer creates, so the part reaches it through context
export const [CodePartContext, useCodePartContext] = createContext<CodePart>('AIChatDialogue', { optional: true });
