import type { HTMLAttributes } from 'svelte/elements';
import type { CodeHighlightThemes, LanguageInput } from '@fibrae/semi-foundation/code-highlight/registry';

export type { CodeHighlightRegistration, CodeHighlightThemes, LanguageInput, ThemeInput } from '@fibrae/semi-foundation/code-highlight/registry';

// The `code` prop is the root's only content, so there is no children snippet.
export interface CodeHighlightProps extends HTMLAttributes<HTMLDivElement> {
    /** Treated as an empty string when undefined */
    code?: string;
    language: string;
    lineNumber?: boolean;
    /** Grammars this block needs beyond the registered ones, loaded once into the shared highlighter. Declare it at module level: a new array on every render highlights again */
    languages?: LanguageInput[];
    /** Overrides the registered themes for this block */
    themes?: CodeHighlightThemes;
}
