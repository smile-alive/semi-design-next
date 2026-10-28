import { createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import Tag, { SplitTagGroup } from '..';

describe('SplitTagGroup 样式（浏览器）', () => {
    it.each(['square', 'circle'] as const)('%s 首尾圆角跟随直接子元素变化', (shape) => {
        const [only, setOnly] = createSignal(false);
        render(() => (
            <SplitTagGroup>
                <Tag shape={shape}>
                    A<Tag class="nested">nested</Tag>
                </Tag>
                {!only() && <Tag shape={shape}>B</Tag>}
                {!only() && <Tag shape={shape}>C</Tag>}
            </SplitTagGroup>
        ));
        const tags = screen.getByRole('group').children;
        const radius = getComputedStyle(tags[0]).borderTopLeftRadius;
        expect(radius).not.toBe('0px');
        expect(getComputedStyle(tags[0]).borderTopRightRadius).toBe('0px');
        expect(getComputedStyle(tags[1]).borderRadius).toBe('0px');
        expect(getComputedStyle(tags[2]).borderTopLeftRadius).toBe('0px');
        expect(getComputedStyle(tags[2]).borderTopRightRadius).toBe(radius);
        expect(getComputedStyle(document.querySelector('.nested') as HTMLElement).borderTopLeftRadius).not.toBe('0px');
        setOnly(true);
        expect(getComputedStyle(screen.getByRole('group').children[0]).borderTopLeftRadius).toBe(radius);
        expect(getComputedStyle(screen.getByRole('group').children[0]).borderTopRightRadius).toBe(radius);
    });
});
