import { createEffect, createSignal } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import forwardFocus from '../forward-focus';

describe('forwardFocus', () => {
    it('focuses the target read at call time and blurs whichever control holds focus', () => {
        let root!: HTMLDivElement;
        let useSecond = false;
        render(() => (
            <div ref={(node) => forwardFocus((root = node), () => screen.getByRole('textbox', { name: useSecond ? 'b' : 'a' }))}>
                <input aria-label="a" />
                <input aria-label="b" />
            </div>
        ));

        root.focus();
        expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'a' }));
        useSecond = true;
        root.focus();
        expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'b' }));
        root.blur();
        expect(document.activeElement).toBe(document.body);
    });

    it('leaves focus outside the root alone on blur', () => {
        let root!: HTMLDivElement;
        render(() => (
            <>
                <div ref={(node) => forwardFocus((root = node), () => node.querySelector('input'))}>
                    <input aria-label="inner" />
                </div>
                <button>outside</button>
            </>
        ));

        screen.getByRole('button').focus();
        root.blur();
        expect(document.activeElement).toBe(screen.getByRole('button'));
    });

    it('focuses and blurs the root itself when the target falls back to it', () => {
        let root!: HTMLButtonElement;
        render(() => <button ref={(node) => forwardFocus((root = node), () => node)}>root</button>);

        root.focus();
        expect(document.activeElement).toBe(root);
        root.blur();
        expect(document.activeElement).toBe(document.body);
    });

    it('does not subscribe the calling effect to what the target and defaults read', () => {
        let root!: HTMLDivElement;
        const [preventScroll, setPreventScroll] = createSignal(false);
        let runs = 0;
        render(() => {
            createEffect(() => {
                runs++;
                root.focus();
            });
            return (
                <div
                    ref={(node) =>
                        forwardFocus(
                            (root = node),
                            () => node.querySelector('input'),
                            () => ({ preventScroll: preventScroll() })
                        )
                    }
                >
                    <input aria-label="inner" />
                </div>
            );
        });

        setPreventScroll(true);
        expect(runs).toBe(1);
    });
});
