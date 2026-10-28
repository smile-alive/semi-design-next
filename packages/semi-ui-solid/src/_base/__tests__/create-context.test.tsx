import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { createContext } from '../create-context';

describe('createContext', () => {
    it('默认必选：没有 provider 时抛错并带上调用方名，有 provider 时读到值', () => {
        const [LabelContext, useLabel] = createContext<string>('Probe');
        const Child = () => <span>{useLabel('Probe.Child')}</span>;
        expect(() => render(() => <Child />)).toThrow('Probe.Child must be used inside Probe');
        render(() => (
            <LabelContext.Provider value="from-parent">
                <Child />
            </LabelContext.Provider>
        ));
        expect(screen.getByText('from-parent')).toBeTruthy();
    });

    it('optional：没有 provider 时读到 undefined', () => {
        const [, useLabel] = createContext<string>('Probe', { optional: true });
        const Child = () => <span>{useLabel() ?? 'none'}</span>;
        render(() => <Child />);
        expect(screen.getByText('none')).toBeTruthy();
    });

    it('defaultValue：没有 provider 时读到默认值，内层 provider 覆盖外层', () => {
        const [SizeContext, useSize] = createContext<string>('Size', { defaultValue: 'normal' });
        const Child = (props: { id: string }) => <span data-testid={props.id}>{useSize()}</span>;
        render(() => (
            <>
                <Child id="alone" />
                <SizeContext.Provider value="small">
                    <Child id="outer" />
                    <SizeContext.Provider value="large">
                        <Child id="inner" />
                    </SizeContext.Provider>
                </SizeContext.Provider>
            </>
        ));
        expect(screen.getByTestId('alone').textContent).toBe('normal');
        expect(screen.getByTestId('outer').textContent).toBe('small');
        expect(screen.getByTestId('inner').textContent).toBe('large');
    });
});
