import path from 'node:path';
import ts from 'typescript';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { OverrideDefaultProps } from '@fibrae/semi-ui-react/_utils/semi-global';
import type { AIChatDialogueMessage, AIChatInputProps, ChatMessage, ChatProps } from '../index';

const packageRoot = path.resolve(import.meta.dirname, '../..');
const entry = path.join(packageRoot, 'src/index.ts');

// Building the program takes seconds, so the cases share one
let entryExportNames: Set<string> | undefined;
function readEntryExports() {
    if (entryExportNames) return entryExportNames;
    const config = ts.readConfigFile(path.join(packageRoot, 'tsconfig.json'), (file) => ts.sys.readFile(file));
    const options = ts.parseJsonConfigFileContent(config.config, ts.sys, packageRoot).options;
    const program = ts.createProgram([entry], { ...options, noEmit: true });
    const checker = program.getTypeChecker();
    const entryFile = program.getSourceFile(entry);
    const entrySymbol = entryFile && checker.getSymbolAtLocation(entryFile);
    if (!entrySymbol) throw new Error('index.ts is not a module');
    entryExportNames = new Set(checker.getExportsOfModule(entrySymbol).map((s) => s.name));
    return entryExportNames;
}

describe('主入口公开类型', () => {
    it('每个组件的 <Name>Props 都从入口导出', () => {
        const entryExports = readEntryExports();
        const components = ['Chat', 'AIChatDialogue', 'AIChatInput', 'MCPConfigure', 'Annotation'];
        const missing = components.filter((name) => !entryExports.has(name) || !entryExports.has(`${name}Props`));
        expect(missing).toEqual([]);
        expect(entryExports.has('SideBarProps')).toBe(true);
    }, 120_000);

    it('Chat props 与回调用到的辅助类型以 Chat 前缀导出', () => {
        const names = ['ChatMetadata', 'ChatDefaultActionNodeObj', 'ChatFullChatBoxNodes', 'ChatEnableUploadProps', 'ChatContent', 'ChatBoxRenderConfig'];
        expect(names.filter((name) => !readEntryExports().has(name))).toEqual([]);
    }, 120_000);

    it('Message 类型区分 Chat 与对话组件', () => {
        expectTypeOf<ChatProps>().toHaveProperty('chats');
        expectTypeOf<ChatMessage>().toHaveProperty('content');
        expectTypeOf<AIChatDialogueMessage>().toHaveProperty('content');
        expectTypeOf<AIChatInputProps>().toHaveProperty('onMessageSend');
    });

    it('全局默认值的类型不含实例 id', () => {
        expectTypeOf<ChatProps>().toHaveProperty('id');
        expectTypeOf<NonNullable<OverrideDefaultProps['Chat']>>().not.toHaveProperty('id');
        expectTypeOf<NonNullable<OverrideDefaultProps['AIChatInput']>>().not.toHaveProperty('id');
        expectTypeOf<NonNullable<OverrideDefaultProps['Chat']>>().toHaveProperty('chats');
    });
});
