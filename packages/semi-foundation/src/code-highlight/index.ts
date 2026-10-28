import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import type { CodeHighlightThemes, LanguageInput } from './registry';

export interface CodeHighlightBaseProps {
    /** Treated as an empty string when undefined */
    code?: string;
    language: string;
    lineNumber?: boolean;
    /** Grammars this block needs beyond the registered ones, loaded once into the shared highlighter */
    languages?: LanguageInput[];
    /** Overrides the registered themes for this block */
    themes?: CodeHighlightThemes;
}

export interface CodeHighlightBaseState {
    html: string;
    /** The code `html` was produced from, so markup for older code is never shown for newer code */
    highlightedCode: string;
}

export interface CodeHighlightAdapter<P extends CodeHighlightBaseProps = CodeHighlightBaseProps, S extends CodeHighlightBaseState = CodeHighlightBaseState> extends DefaultAdapter<P, S> {
    setHtml: (html: string, highlightedCode: string) => void;
}

export default class CodeHighlightFoundation<P extends CodeHighlightBaseProps = CodeHighlightBaseProps, S extends CodeHighlightBaseState = CodeHighlightBaseState> extends BaseFoundation<CodeHighlightAdapter<P, S>, P, S> {
    #requestId = 0;

    override destroy() {
        this.#requestId++;
    }

    async highlightCode() {
        const { code = '', language, languages, themes } = this.getProps();
        const requestId = ++this.#requestId;
        const { highlight } = await import('./highlighter');
        const html = await highlight(code.replace(/\n$/, ''), language, { languages, themes });
        // a stale result must not overwrite the current render
        if (requestId === this.#requestId) {
            this._adapter.setHtml(html, code);
        }
    }
}
