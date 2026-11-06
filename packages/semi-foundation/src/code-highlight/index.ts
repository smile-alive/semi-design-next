import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { subscribe, type CodeHighlightThemes, type LanguageInput } from './registry';

export interface CodeHighlightBaseProps {
    /** Treated as an empty string when undefined */
    code?: string;
    language: string;
    lineNumber?: boolean;
    /** Grammars this block needs beyond the registered ones, loaded once into the shared highlighter */
    languages?: LanguageInput[];
    themes?: CodeHighlightThemes;
}

export interface CodeHighlightBaseState {
    html: string;
    /** The code `html` was produced from, so markup for older code is never shown for newer code */
    highlightedCode: string;
}

export type CodeHighlightAdapter<P extends CodeHighlightBaseProps = CodeHighlightBaseProps> = DefaultAdapter<P, CodeHighlightBaseState>;

export default class CodeHighlightFoundation<P extends CodeHighlightBaseProps = CodeHighlightBaseProps> extends BaseFoundation<CodeHighlightAdapter<P>, P, CodeHighlightBaseState> {
    #requestId = 0;
    static override readonly propKeys = ['code', 'language', 'languages', 'themes'];

    static getInitialState(): CodeHighlightBaseState {
        return { html: '', highlightedCode: '' };
    }

    // init does not run on the server, where loading shiki is pointless; destroy drops a highlight still in flight, so init starts it again
    override init() {
        // a grammar registered after mount (a later entry module) highlights this block again
        const unsubscribe = subscribe(() => void this.highlightCode());
        this.signal.addEventListener('abort', unsubscribe, { once: true });
        void this.highlightCode();
    }

    override destroy() {
        this.#requestId++;
    }

    override handlePropsChange() {
        void this.highlightCode();
    }

    highlightCode = async () => {
        const { code = '', language, languages, themes } = this.getProps();
        const requestId = ++this.#requestId;
        const { highlight } = await import('./highlighter');
        const html = await highlight(code.replace(/\n$/, ''), language, { languages, themes });
        // a stale result must not overwrite the current render
        if (requestId === this.#requestId) {
            this.setState({ html, highlightedCode: code });
        }
    };
}
