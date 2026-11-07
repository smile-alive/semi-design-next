import { createSignal, type JSX } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { clickOutside } from '@test/utils/browser';
import HotKeys from '..';

function Counter(props: { children: (onHotKey: () => void) => JSX.Element }) {
    const [count, setCount] = createSignal(0);
    return (
        <div>
            {props.children(() => setCount((c) => c + 1))}
            <pre data-testid="pre">{count()}</pre>
        </div>
    );
}

describe('HotKeys（浏览器）', () => {
    it('基础用法', async () => {
        render(() => <Counter>{(onHotKey) => <HotKeys content={['Control', 'K']} hotKeys={[HotKeys.Keys.Control, 'k']} onHotKey={onHotKey} />}</Counter>);
        await clickOutside();
        await userEvent.keyboard('{Control>}k{/Control}');
        expect(screen.getByTestId('pre')).toMatchTextContent(/^1$/);
    });

    it('组合键', async () => {
        render(() => (
            <Counter>
                {(onHotKey) => (
                    <>
                        <HotKeys hotKeys={[HotKeys.Keys.Meta, HotKeys.Keys.Alt, 'k']} onHotKey={onHotKey} />
                        <HotKeys hotKeys={['Meta', 'Shift', 'k']} onHotKey={onHotKey} />
                    </>
                )}
            </Counter>
        ));
        await clickOutside();
        await userEvent.keyboard('{Meta>}{Alt>}k{/Alt}{/Meta}');
        await userEvent.keyboard('{Meta>}{Shift>}k{/Shift}{/Meta}');
        expect(screen.getByTestId('pre')).toMatchTextContent(/^2$/);
    });

    it('目标元素', async () => {
        render(() => (
            <Counter>
                {(onHotKey) => (
                    <>
                        <input id="test" placeholder="test for target" />
                        <HotKeys getListenerTarget={() => document.getElementById('test')} hotKeys={['Meta', HotKeys.Keys.S]} onHotKey={onHotKey} />
                    </>
                )}
            </Counter>
        ));
        await userEvent.click(screen.getByPlaceholderText('test for target'));
        await userEvent.keyboard('{Meta>}s{/Meta}');
        expect(screen.getByTestId('pre')).toMatchTextContent(/^1$/);
    });
});
