import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import Tag from '../index';
import SplitTagGroup from '../split-tag-group';

describe('SplitTagGroup 样式', () => {
    it.each(['square', 'circle'] as const)('%s 首尾圆角跟随直接子元素变化', (shape) => {
        const view = render(
            <SplitTagGroup>
                <Tag shape={shape}>
                    A<Tag className="nested">nested</Tag>
                </Tag>
                <Tag shape={shape}>B</Tag>
                <Tag shape={shape}>C</Tag>
            </SplitTagGroup>
        );
        const tags = screen.getByRole('group').children;
        const radius = getComputedStyle(tags[0]).borderTopLeftRadius;
        expect(radius).not.toBe('0px');
        expect(getComputedStyle(tags[0]).borderTopRightRadius).toBe('0px');
        expect(getComputedStyle(tags[1]).borderRadius).toBe('0px');
        expect(getComputedStyle(tags[2]).borderTopLeftRadius).toBe('0px');
        expect(getComputedStyle(tags[2]).borderTopRightRadius).toBe(radius);
        expect(getComputedStyle(document.querySelector('.nested') as HTMLElement).borderTopLeftRadius).not.toBe('0px');
        view.rerender(
            <SplitTagGroup>
                <Tag shape={shape}>Only</Tag>
            </SplitTagGroup>
        );
        expect(getComputedStyle(screen.getByRole('group').children[0]).borderTopLeftRadius).toBe(radius);
        expect(getComputedStyle(screen.getByRole('group').children[0]).borderTopRightRadius).toBe(radius);
    });
});
