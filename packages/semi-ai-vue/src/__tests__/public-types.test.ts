import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';
import type { OverrideDefaultProps } from '@fibrae/semi-ui-vue/_utils/semi-global';
import type { AIChatDialogueMessage, AIChatDialogueProps, AIChatInputEmits, AIChatInputMessageContent, ChatEmits, ChatMessage, ChatProps, SidebarContainerHandle } from '../index';
import type { SidebarContainerHandle as SubpathHandle } from '../sidebar/index';

// ts.createProgram cannot read .vue files, so the value half reads the entry's text; the type half is the
// `import type` above, which vue-tsc (vitest/vue/tsconfig.vue.json) rejects when a name is missing
const packages = path.resolve(import.meta.dirname, '../../..');
const read = (pkg: string) => readFileSync(path.join(packages, pkg, 'src/index.ts'), 'utf8');

function exportedNames(source: string, kind?: 'value' | 'type') {
    const blocks = [...source.matchAll(/^export (type )?\{([^}]*)\}/gm)].filter(([, type]) => !kind || (kind === 'type') === !!type);
    return new Set(
        blocks.flatMap(([, , names]) =>
            names
                .split(',')
                .map((name) =>
                    name
                        .trim()
                        .split(/\s+as\s+/)
                        .at(-1)
                )
                .filter((name): name is string => !!name)
        )
    );
}

const entry = read('semi-ai-vue');
const components = ['Chat', 'AIChatDialogue', 'AIChatInput', 'MCPConfigure', 'Annotation', 'Sidebar'];

// React types Vue does not export: render-prop types replaced by slots (see their <Component>…SlotProps types),
// and the React-only ChatBoxRenderConfig
const replacedBySlots = [
    'ChatRenderInputAreaProps',
    'ChatRenderTitleProps',
    'ChatRenderAvatarProps',
    'ChatRenderContentProps',
    'ChatRenderActionProps',
    'ChatRenderFullChatBoxProps',
    'ChatBoxRenderConfig',
    'DialogueContentItemRenderer',
    'DialogueContentItemRendererMap',
    'DialogueRenderConfig',
    'AIChatDialogueRenderTitleProps',
    'AIChatDialogueRenderAvatarProps',
    'AIChatDialogueRenderContentProps',
    'AIChatDialogueRenderActionProps',
    'AIChatDialogueRenderFullDialogueProps',
    'RenderUploadButtonProps',
    'RenderSuggestionItemProps',
    'RenderSkillItemProps',
    'AIChatInputRenderTopSlotProps',
    'AIChatInputActionAreaProps',
];

describe('主入口公开类型', () => {
    it('每个组件的 <Name>Props 都从入口导出', () => {
        const values = exportedNames(entry, 'value');
        const types = exportedNames(entry, 'type');
        expect(components.filter((name) => !values.has(name))).toEqual([]);
        const propsTypes = components.map((name) => (name === 'Sidebar' ? 'SideBarProps' : `${name}Props`));
        expect(propsTypes.filter((name) => !types.has(name))).toEqual([]);
    });

    it('React 主入口的导出 Vue 都有同名导出，被插槽取代的除外', () => {
        const vue = exportedNames(entry);
        const react = [...exportedNames(read('semi-ai-react'))].filter((name) => !replacedBySlots.includes(name));
        expect(react.filter((name) => !vue.has(name))).toEqual([]);
        expect(replacedBySlots.filter((name) => vue.has(name))).toEqual([]);
    });

    it('Message 类型区分 Chat 与对话组件', () => {
        expectTypeOf<ChatProps['chats']>().toEqualTypeOf<ChatMessage[] | undefined>();
        expectTypeOf<AIChatDialogueProps['chats']>().toEqualTypeOf<AIChatDialogueMessage[] | undefined>();
        // The dialogue message requires id and role; Chat's are optional
        expectTypeOf<AIChatDialogueMessage['id']>().toEqualTypeOf<string>();
        expectTypeOf<ChatMessage['id']>().toEqualTypeOf<string | undefined>();
        expectTypeOf<ChatMessage>().not.toEqualTypeOf<AIChatDialogueMessage>();
        expectTypeOf<AIChatInputEmits['messageSend']>().toEqualTypeOf<[message: AIChatInputMessageContent]>();
        expectTypeOf<ChatEmits['messageSend'][0]>().toEqualTypeOf<string>();
    });

    it('SidebarContainerHandle 从包根与 sidebar 子路径导出且同型', () => {
        expectTypeOf<SidebarContainerHandle>().toEqualTypeOf<SubpathHandle>();
        expectTypeOf<SidebarContainerHandle['root']>().toEqualTypeOf<HTMLDivElement | null>();
        expect(entry).toContain('SidebarContainerHandle');
    });

    it('全局默认值的类型不含实例 id', () => {
        expectTypeOf<NonNullable<OverrideDefaultProps['AIChatInput']>>().not.toHaveProperty('id');
        expectTypeOf<NonNullable<OverrideDefaultProps['Chat']>>().not.toHaveProperty('id');
        expectTypeOf<NonNullable<OverrideDefaultProps['Chat']>>().toHaveProperty('chats');
    });
});
