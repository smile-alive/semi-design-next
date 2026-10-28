import type { Component } from 'vue';
import { fireEvent } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import AIChatDialogue from '../ai-chat-dialogue/index';
import AIChatInput from '../ai-chat-input/index';
import Chat from '../chat/index';
import Annotation from '../sidebar/annotation/index';
import Sidebar from '../sidebar/index';
import MCPConfigure from '../sidebar/mcp-configure/index';

// Runtime half of F2; the type half is fixtures/attrs.vue. vue-tsc infers native attributes only where the template
// binds them to an element, so a component whose root is another component or that splits `$attrs` in script
// carries only declared props there.
const roleConfig = { user: { name: 'User' } };
const cases: [string, Component, Record<string, unknown>, string][] = [
    ['AIChatDialogue', AIChatDialogue, { roleConfig }, 'ai-chat-dialogue'],
    ['AIChatInput', AIChatInput, {}, 'aiChatInput'],
    ['Chat', Chat, {}, 'chat'],
    ['Sidebar', Sidebar, { visible: true }, 'sidebar-container'],
    ['Sidebar.Container', Sidebar.Container, { visible: true }, 'sidebar-container'],
    ['Annotation', Annotation, { visible: true }, 'sidebar-container'],
    ['MCPConfigure', MCPConfigure, { visible: true }, 'sidebar-container'],
    ['AIChatDialogue.Reasoning', AIChatDialogue.Reasoning, { status: 'completed', summary: [] }, 'ai-chat-dialogue-reasoning-wrapper'],
    ['AIChatDialogue.Step', AIChatDialogue.Step, { steps: [] }, 'ai-chat-dialogue-step-wrapper'],
    ['AIChatDialogue.Annotation', AIChatDialogue.Annotation, { annotation: [], maxCount: 3 }, 'ai-chat-dialogue-annotation-wrapper'],
    ['Sidebar.FileContent', Sidebar.FileContent, {}, 'sidebar-collapse-file'],
    ['Sidebar.CodeContent', Sidebar.CodeContent, {}, 'sidebar-collapse-code'],
    ['Sidebar.FileItem', Sidebar.FileItem, {}, 'sidebar-file'],
    ['Sidebar.CodeItem', Sidebar.CodeItem, { content: 'x' }, 'sidebar-code-content'],
    ['Annotation.AnnotationContent', Annotation.AnnotationContent, {}, 'sidebar-collapse'],
];

describe('未声明属性落在根元素上', () => {
    it.for(cases)('%s', async ([, component, props, cls]) => {
        const onKeydown = vi.fn<() => void>();
        const view = render(component, {
            props,
            attrs: { id: 'probe', 'data-probe': '', onKeydown },
        });
        const root = view.container.querySelector<HTMLElement>('[data-probe]');
        expect(root).toHaveClass(`${BASE_CLASS_PREFIX}-${cls}`);
        expect(root).toHaveAttribute('id', 'probe');
        await fireEvent.keyDown(root as HTMLElement, { key: 'Enter' });
        expect(onKeydown).toHaveBeenCalledTimes(1);
    });

    it('Sidebar.CodeItem 合并 class 与 style', () => {
        const view = render(Sidebar.CodeItem, {
            props: { content: 'x' },
            attrs: { class: 'mine', style: { color: 'red' } },
        });
        const root = view.container.firstElementChild;
        expect(root).toHaveClass(`${BASE_CLASS_PREFIX}-sidebar-code-content`, 'mine');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Annotation.AnnotationContent 的条目点击不落到根元素', async () => {
        const onClick = vi.fn<() => void>();
        const view = render(Annotation.AnnotationContent, {
            attrs: { 'data-probe': '', onClick },
        });
        await fireEvent.click(view.container.querySelector('[data-probe]') as HTMLElement);
        expect(onClick).not.toHaveBeenCalled();
    });
});
