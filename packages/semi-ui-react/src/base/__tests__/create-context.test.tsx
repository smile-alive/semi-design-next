import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createContext } from '../create-context';

describe('createContext', () => {
    it('默认必选：没有 provider 时抛错并带上调用方名，有 provider 时读到值', () => {
        const [LabelContext, useLabel] = createContext<string>('Probe');
        const Child = () => <span>{useLabel('Probe.Child')}</span>;
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<Child />)).toThrow('Probe.Child must be used inside Probe');
        vi.restoreAllMocks();
        render(
            <LabelContext value="from-parent">
                <Child />
            </LabelContext>
        );
        expect(screen.getByText('from-parent')).toBeTruthy();
    });

    it('optional：没有 provider 时读到 undefined', () => {
        const [, useLabel] = createContext<string>('Probe', { optional: true });
        const Child = () => <span>{useLabel() ?? 'none'}</span>;
        render(<Child />);
        expect(screen.getByText('none')).toBeTruthy();
    });

    it('defaultValue：没有 provider 时读到默认值，内层 provider 覆盖外层', () => {
        const [SizeContext, useSize] = createContext<string>('Size', { defaultValue: 'normal' });
        const Child = ({ id }: { id: string }) => <span data-testid={id}>{useSize()}</span>;
        render(
            <>
                <Child id="alone" />
                <SizeContext value="small">
                    <Child id="outer" />
                    <SizeContext value="large">
                        <Child id="inner" />
                    </SizeContext>
                </SizeContext>
            </>
        );
        expect(screen.getByTestId('alone').textContent).toBe('normal');
        expect(screen.getByTestId('outer').textContent).toBe('small');
        expect(screen.getByTestId('inner').textContent).toBe('large');
    });
});
