import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vite-plus/test';

const srcDir = path.resolve(import.meta.dirname, '../..');
const snippetPath = path.join(srcDir, 'locale/__tests__/null-locale-snippet.tsx');
const snippet = `
import ConfigProvider from '../../config-provider';
import LocaleProvider from '../locale-provider';

export const withLocaleProvider = <LocaleProvider locale={null} />;
export const withConfigProvider = <ConfigProvider locale={null} />;
`;

// The package compiles with strictNullChecks off, so null always type-checks there; only a strict program can tell
// whether consumers with strictNullChecks on are accepted by the published declarations.
function strictDiagnostics() {
    const options: ts.CompilerOptions = {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        jsx: ts.JsxEmit.ReactJSX,
        lib: ['lib.esnext.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        types: ['node'],
    };
    const host = ts.createCompilerHost(options);
    const readFile = host.readFile.bind(host);
    const fileExists = host.fileExists.bind(host);
    host.readFile = (file) => (file === snippetPath ? snippet : readFile(file));
    host.fileExists = (file) => file === snippetPath || fileExists(file);
    const program = ts.createProgram([snippetPath], options, host);
    return program.getSemanticDiagnostics(program.getSourceFile(snippetPath)).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

describe('locale 可空类型', () => {
    it('严格空值检查下 LocaleProvider 与 ConfigProvider 可以传 locale={null}', () => {
        expect(strictDiagnostics()).toEqual([]);
    }, 60_000);
});
