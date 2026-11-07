import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import TriggerContent, { type TriggerContentField } from './trigger-content.svelte';

const types: TriggerContentField[] = ['select', 'cascader', 'treeSelect', 'autoComplete', 'datePicker', 'timePicker'];

// the field's own `trigger` is the validation timing, so the control's trigger snippet comes in as `triggerContent`
describe('Form 字段的 triggerContent', () => {
    it.each(types)('%s 字段把 triggerContent 作为控件的 trigger 渲染', (type) => {
        render(TriggerContent, { props: { type } });
        expect(screen.getByTestId('custom-trigger')).toHaveTextContent('custom');
    });

    it.each(types)('%s 字段带自定义触发器时 labelPosition="inset" 回落到 top', (type) => {
        const { container } = render(TriggerContent, { props: { type, labelPosition: 'inset' } });
        expect(container.querySelector('.semi-form-field')).toHaveAttribute('x-label-pos', 'top');
    });
});
