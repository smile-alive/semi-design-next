import { onMount } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import autofocus from '../autofocus';

describe('autofocus', () => {
    function Field(props: { flag: boolean }) {
        let input: HTMLInputElement | undefined;
        onMount(() => autofocus(props.flag, input));
        return <input ref={(node) => (input = node)} />;
    }

    it('flag 为 true 时在 onMount 中聚焦运行时插入的元素', () => {
        render(() => <Field flag />);
        expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('flag 为 false 时不聚焦', () => {
        render(() => <Field flag={false} />);
        expect(screen.getByRole('textbox')).not.toHaveFocus();
    });

    it('元素不存在时不报错', () => {
        expect(() => autofocus(true, undefined)).not.toThrow();
        expect(() => autofocus(true, null)).not.toThrow();
    });
});
