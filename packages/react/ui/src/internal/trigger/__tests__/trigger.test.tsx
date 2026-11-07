import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import Trigger from '../index';

describe('Trigger', () => {
    it('trigger 基础用法', () => {
        render(<Trigger triggerRender={() => <div className="trigger-cls">trigger</div>} />);
        expect(screen.getByText('trigger')).toHaveClass('trigger-cls');
    });

    it('triggerRender 接收除 triggerRender 外的所有属性', () => {
        const triggerRender = vi.fn<(props: Record<string, unknown>) => string>(() => 'rendered');
        const onChange = vi.fn<() => void>();
        const componentProps = { a: 1 };
        render(<Trigger className="cls" disabled placeholder="ph" value={['v']} componentProps={componentProps} inputValue="in" triggerRender={triggerRender} onChange={onChange} />);
        expect(screen.getByText('rendered')).toBeInTheDocument();
        expect(triggerRender).toHaveBeenLastCalledWith({
            componentProps,
            value: ['v'],
            inputValue: 'in',
            placeholder: 'ph',
            disabled: true,
            onChange,
            className: 'cls',
        });
    });
});
