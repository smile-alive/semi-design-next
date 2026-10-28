import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { HotKeys } from '@fibrae/semi-ui-react';
import { clickOutside } from '@test/utils/browser';

function Counter({ children }) {
    const [cnt, setCnt] = useState(0);
    const onHotKey = () => setCnt((c) => c + 1);
    return (
        <div>
            {children(onHotKey)}
            <pre data-testid="pre">{cnt}</pre>
        </div>
    );
}

describe('HotKeys', () => {
    it('基础用法', async () => {
        render(<Counter>{(onHotKey) => <HotKeys content={['Control', 'K']} hotKeys={[HotKeys.Keys.Control, 'k']} onHotKey={onHotKey} />}</Counter>);
        await clickOutside();
        await userEvent.keyboard('{Control>}k{/Control}');
        expect(screen.getByTestId('pre')).toMatchTextContent(/^1$/);
    });

    it('组合键', async () => {
        render(
            <Counter>
                {(onHotKey) => (
                    <>
                        <HotKeys hotKeys={[HotKeys.Keys.Meta, HotKeys.Keys.Alt, 'k']} onHotKey={onHotKey} />
                        <HotKeys hotKeys={['Meta', 'Shift', 'k']} onHotKey={onHotKey} />
                    </>
                )}
            </Counter>
        );
        await clickOutside();
        await userEvent.keyboard('{Meta>}{Alt>}k{/Alt}{/Meta}');
        await userEvent.keyboard('{Meta>}{Shift>}k{/Shift}{/Meta}');
        expect(screen.getByTestId('pre')).toMatchTextContent(/^2$/);
    });

    it('目标元素', async () => {
        render(
            <Counter>
                {(onHotKey) => (
                    <>
                        <input id="test" placeholder="test for target" />
                        <HotKeys getListenerTarget={() => document.getElementById('test')} hotKeys={['Meta', HotKeys.Keys.S]} onHotKey={onHotKey} />
                    </>
                )}
            </Counter>
        );
        await userEvent.click(screen.getByPlaceholderText('test for target'));
        await userEvent.keyboard('{Meta>}s{/Meta}');
        expect(screen.getByTestId('pre')).toMatchTextContent(/^1$/);
    });
});
