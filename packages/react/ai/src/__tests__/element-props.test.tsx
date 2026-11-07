import type { ReactElement } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { AIChatDialogue, AIChatInput, Annotation, Chat, MCPConfigure, Sidebar } from '../index';

// Literal JSX attributes, because spread props skip the excess-property check (F6); runtime checks where they land (F2)
const onKeyDown = vi.fn<() => void>();
const roleConfig = { user: { name: 'User' } };
const cases: [string, () => ReactElement, string][] = [
    ['AIChatDialogue', () => <AIChatDialogue id="probe" data-probe="" title="t" roleConfig={roleConfig} onKeyDown={onKeyDown} />, 'ai-chat-dialogue'],
    ['AIChatInput', () => <AIChatInput id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'aiChatInput'],
    ['Chat', () => <Chat id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'chat'],
    ['Sidebar', () => <Sidebar id="probe" data-probe="" visible onKeyDown={onKeyDown} />, 'sidebar-container'],
    ['Sidebar.Container', () => <Sidebar.Container id="probe" data-probe="" visible onKeyDown={onKeyDown} />, 'sidebar-container'],
    ['Annotation', () => <Annotation id="probe" data-probe="" visible onKeyDown={onKeyDown} />, 'sidebar-container'],
    ['MCPConfigure', () => <MCPConfigure id="probe" data-probe="" visible onKeyDown={onKeyDown} />, 'sidebar-container'],
    ['AIChatDialogue.Reasoning', () => <AIChatDialogue.Reasoning id="probe" data-probe="" status="completed" summary={[]} onKeyDown={onKeyDown} />, 'ai-chat-dialogue-reasoning-wrapper'],
    ['AIChatDialogue.Step', () => <AIChatDialogue.Step id="probe" data-probe="" title="t" steps={[]} onKeyDown={onKeyDown} />, 'ai-chat-dialogue-step-wrapper'],
    ['AIChatDialogue.Annotation', () => <AIChatDialogue.Annotation id="probe" data-probe="" title="t" annotation={[]} maxCount={3} onKeyDown={onKeyDown} />, 'ai-chat-dialogue-annotation-wrapper'],
    ['Sidebar.FileContent', () => <Sidebar.FileContent id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'sidebar-collapse-file'],
    ['Sidebar.CodeContent', () => <Sidebar.CodeContent id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'sidebar-collapse-code'],
    ['Sidebar.FileItem', () => <Sidebar.FileItem id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'sidebar-file'],
    ['Sidebar.CodeItem', () => <Sidebar.CodeItem id="probe" data-probe="" title="t" content="x" onKeyDown={onKeyDown} />, 'sidebar-code-content'],
    ['Annotation.AnnotationContent', () => <Annotation.AnnotationContent id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'sidebar-collapse'],
];

describe('未声明属性落在根元素上，且 Props 类型接受', () => {
    it.each(cases)('%s', (_, renderElement, cls) => {
        onKeyDown.mockClear();
        const { container } = render(renderElement());
        const root = container.querySelector<HTMLElement>('[data-probe]');
        expect(root).toHaveClass(`${BASE_CLASS_PREFIX}-${cls}`);
        expect(root).toHaveAttribute('id', 'probe');
        fireEvent.keyDown(root, { key: 'Enter' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('Sidebar.CodeItem 合并 className 与 style', () => {
        const { container } = render(<Sidebar.CodeItem className="mine" style={{ color: 'red' }} content="x" />);
        const root = container.firstElementChild;
        expect(root).toHaveClass(`${BASE_CLASS_PREFIX}-sidebar-code-content`, 'mine');
        expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('Annotation.AnnotationContent 的 onClick 仍只给条目，不落到根元素', () => {
        const onClick = vi.fn<() => void>();
        const { container } = render(<Annotation.AnnotationContent data-probe="" onClick={onClick} />);
        fireEvent.click(container.querySelector('[data-probe]'));
        expect(onClick).not.toHaveBeenCalled();
    });
});
