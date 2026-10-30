import { render, screen } from '@testing-library/react';
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { Button, Form } from '@fibrae/semi-ui-react';
import type { FormApi } from '../interface';

const getInput = (field) => document.querySelector(`[x-field-id="${field}"] input`);

describe('Form', () => {
    it('labelPosition 为 inset 时，不支持内嵌标签的字段回退 top，label 位于控件上方', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        onTestFinished(() => warn.mockRestore());
        render(
            <Form labelPosition="inset">
                <Form.Switch field="on" label="Notify" />
                <Form.Input field="name" label="Name" />
            </Form>
        );
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no inset label, so Field "on" is laid out with labelPosition'));
        const switchRect = screen.getByRole('switch', { name: 'Notify' }).getBoundingClientRect();
        const labelRect = screen.getByText('Notify').getBoundingClientRect();
        expect(labelRect.bottom).toBeLessThanOrEqual(switchRect.top);
        const input = screen.getByRole('textbox');
        expect(screen.getByText('Name').getBoundingClientRect().bottom).toBeGreaterThan(input.getBoundingClientRect().top);
    });

    it('InputGroup 在字段校验完成时显示无效状态，整组错误等全部校验结束后显示', async () => {
        const fast = Promise.withResolvers<string>();
        const slow = Promise.withResolvers<string>();
        let api: FormApi;
        let validation: Promise<unknown>;
        render(
            <Form getFormApi={(value) => (api = value)}>
                <Form.InputGroup label="分组">
                    <Form.Input field="fast" validator={() => fast.promise} />
                    <Form.Input field="slow" validator={() => slow.promise} />
                </Form.InputGroup>
                <Button
                    type="tertiary"
                    onClick={() => {
                        validation = api.validate().catch((errors: unknown) => errors);
                    }}
                >
                    校验
                </Button>
            </Form>
        );
        await userEvent.click(screen.getByRole('button', { name: '校验' }));
        fast.resolve('快速字段错误');
        const input = screen.getAllByRole('textbox')[0];
        await expect.poll(() => input.getAttribute('aria-invalid')).toBe('true');
        await new Promise(requestAnimationFrame);
        expect(screen.queryByText('快速字段错误')).toBeNull();
        expect(screen.queryByText('慢速字段错误')).toBeNull();

        slow.resolve('慢速字段错误');
        await validation;
        await expect.poll(() => screen.queryByText('快速字段错误, 慢速字段错误')).not.toBeNull();
        expect(screen.getByText('快速字段错误, 慢速字段错误')).toBeVisible();
    });

    it('formApi-setValue 使用数组字段路径，3 变为 2，删除中间行字段', async () => {
        let formApi;
        const initValues = {
            effects: [
                { name: '1-name', type: '1-type', key: 0 },
                { name: '2-name', type: '2-type', key: 1 },
                { name: '3-name', type: '3-type', key: 2 },
            ],
        };
        const remove = (key) => {
            const effects = formApi.getValue('effects').filter((effect) => effect.key !== key);
            formApi.setValue('effects', effects.length ? effects : undefined);
        };
        render(
            <Form getFormApi={(api) => (formApi = api)} initValues={initValues}>
                {({ values }) =>
                    values.effects &&
                    values.effects.map((effect, i) => (
                        <div key={effect.key}>
                            <Form.Input field={`effects[${i}].name`} />
                            <Form.Input field={`effects[${i}].type`} />
                            <Button onClick={() => remove(effect.key)}>Remove</Button>
                        </div>
                    ))
                }
            </Form>
        );

        await userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[1]);
        expect(getInput('effects[0].name')).toHaveValue('1-name');
        expect(getInput('effects[0].type')).toHaveValue('1-type');
        expect(getInput('effects[1].name')).toHaveValue('3-name');
        expect(getInput('effects[1].type')).toHaveValue('3-type');
        expect(getInput('effects[2].name')).toBeNull();
    });
});
