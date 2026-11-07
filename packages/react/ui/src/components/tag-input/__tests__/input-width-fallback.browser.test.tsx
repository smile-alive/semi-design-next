import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { TagInput } from '@fibrae/semi-ui-react';
import { disableFieldSizing } from '@test/utils/browser';

describe('TagInput 输入框宽度（不支持 field-sizing）', () => {
    it('输入框宽度随内容增长', async () => {
        disableFieldSizing();
        render(
            <div style={{ width: 400 }}>
                <TagInput />
            </div>
        );
        const input = screen.getByRole<HTMLInputElement>('textbox');
        const widthOf = async (text: string) => {
            await userEvent.fill(input, text);
            return parseFloat(input.style.width);
        };

        const short = await widthOf('ab');
        expect(short).toBeGreaterThan(0);
        expect(await widthOf('abcdefghijklmnop')).toBeGreaterThan(short);
    });

    it('文字放不进当前行时输入框换到下一行', async () => {
        disableFieldSizing();
        render(
            <div style={{ width: 300 }}>
                <TagInput defaultValue={['tag']} />
            </div>
        );
        const input = screen.getByRole<HTMLInputElement>('textbox');
        const tag = document.querySelector('.semi-tag') as HTMLElement;
        expect(input.getBoundingClientRect().top).toBeLessThan(tag.getBoundingClientRect().bottom);

        await userEvent.fill(input, 'W'.repeat(40));
        expect(input.getBoundingClientRect().top).toBeGreaterThanOrEqual(tag.getBoundingClientRect().bottom);
    });
});
