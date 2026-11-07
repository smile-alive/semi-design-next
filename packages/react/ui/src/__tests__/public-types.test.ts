import path from 'node:path';
import ts from 'typescript';
import { beforeAll, describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { ColumnProps, FileItem, FormApi, ModalProps, SelectProps, TableProps, TreeNodeData } from '../index';

const packageRoot = path.resolve(import.meta.dirname, '../..');
const entry = path.join(packageRoot, 'src/index.ts');

let checker: ts.TypeChecker;
let entryNames: Map<string, ts.Symbol>;
let exportsByDir: Map<string, Set<string>>;

beforeAll(() => {
    const config = ts.readConfigFile(path.join(packageRoot, 'tsconfig.json'), (file) => ts.sys.readFile(file));
    const options = ts.parseJsonConfigFileContent(config.config, ts.sys, packageRoot).options;
    const program = ts.createProgram([entry], { ...options, noEmit: true });
    checker = program.getTypeChecker();

    const entryFile = program.getSourceFile(entry);
    const entrySymbol = entryFile && checker.getSymbolAtLocation(entryFile);
    if (!entrySymbol) throw new Error('index.ts is not a module');
    entryNames = new Map(checker.getExportsOfModule(entrySymbol).map((symbol) => [symbol.name, symbol]));

    exportsByDir = new Map();
    for (const file of program.getSourceFiles()) {
        const moduleSymbol = checker.getSymbolAtLocation(file);
        if (!moduleSymbol || file.fileName.includes('/node_modules/') || file.fileName.includes('/__tests__/')) continue;
        const dir = path.dirname(file.fileName);
        const names = exportsByDir.get(dir) ?? new Set<string>();
        for (const symbol of checker.getExportsOfModule(moduleSymbol)) names.add(symbol.name);
        exportsByDir.set(dir, names);
    }
}, 120_000);

function declarationDir(symbol: ts.Symbol): string | undefined {
    const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    const file = target.declarations?.[0]?.getSourceFile().fileName;
    return file && file.startsWith(packageRoot + path.sep) ? path.dirname(file) : undefined;
}

describe('主入口公开类型', () => {
    it('每个有 <Name>Props 的组件，入口都导出同名 Props 类型', () => {
        const missing: string[] = [];
        let checked = 0;
        for (const [name, symbol] of entryNames) {
            const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
            if (!(target.flags & ts.SymbolFlags.Value) || !/^[A-Z]/.test(name)) continue;
            const dir = declarationDir(symbol);
            if (!dir || !exportsByDir.get(dir)?.has(`${name}Props`)) continue;
            checked += 1;
            if (!entryNames.has(`${name}Props`)) missing.push(`${name}Props (${path.relative(packageRoot, dir)})`);
        }
        expect(checked).toBeGreaterThan(40);
        expect(missing).toEqual([]);
    });

    it('入口导出的名称不指向内部类型', () => {
        const internal = ['HeadTableProps', 'ColGroupProps', 'TableState', 'NormalTableState'];
        expect(internal.filter((name) => entryNames.has(name))).toEqual([]);
    });

    it('辅助类型保留关键字段', () => {
        expectTypeOf<ColumnProps>().toHaveProperty('dataIndex');
        expectTypeOf<TableProps>().toHaveProperty('columns');
        expectTypeOf<SelectProps>().toHaveProperty('optionList');
        expectTypeOf<TreeNodeData>().toHaveProperty('key');
        expectTypeOf<FileItem>().toHaveProperty('uid');
        expectTypeOf<ModalProps>().toHaveProperty('visible');
        expectTypeOf<FormApi>().toHaveProperty('getValue');
    });
});
