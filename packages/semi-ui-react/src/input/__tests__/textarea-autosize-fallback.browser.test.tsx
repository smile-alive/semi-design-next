import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { TextArea } from '@fibrae/semi-ui-react';
import { disableFieldSizing } from '@test/utils/browser';

describe('TextArea autosize（不支持 field-sizing）', () => {
    it('高度随行数增长，并受 maxRows 限制', async () => {
        disableFieldSizing();
        render(<TextArea aria-label="content" autosize={{ minRows: 1, maxRows: 3 }} />);
        const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');
        const heightOf = async (rows: number) => {
            await userEvent.fill(textarea, Array.from({ length: rows }, (_, i) => `line ${i}`).join('\n'));
            return textarea.getBoundingClientRect().height;
        };

        expect(textarea.style.height).not.toBe('');
        const one = textarea.getBoundingClientRect().height;
        const two = await heightOf(2);
        expect(two).toBeGreaterThan(one);
        const three = await heightOf(3);
        expect(three).toBeGreaterThan(two);
        const six = await heightOf(6);
        expect(six).toBe(three);
        expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight);
    });

    it('清空内容后高度回到 minRows', async () => {
        disableFieldSizing();
        render(<TextArea aria-label="content" defaultValue={'a\nb\nc\nd\ne'} autosize={{ minRows: 2 }} />);
        const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');
        const tall = textarea.getBoundingClientRect().height;
        await userEvent.clear(textarea);
        await waitFor(() => expect(textarea.getBoundingClientRect().height).toBeLessThan(tall));
    });
});
