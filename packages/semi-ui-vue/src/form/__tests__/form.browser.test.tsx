/** @jsxImportSource vue */
import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from '@test/utils/vue';
import { Form, FormInputGroup, type FormApi, type FormDefaultSlotProps } from '..';
import Button from '../../button';
import { FormInput } from './fixtures/fields';

const getInput = (field: string) => document.querySelector(`[x-field-id="${field}"] input`);

describe('Form（浏览器）', () => {
    it('InputGroup 在字段校验完成时显示无效状态，整组错误等全部校验结束后显示', async () => {
        const fast = Promise.withResolvers<string>();
        const slow = Promise.withResolvers<string>();
        let api: FormApi | undefined;
        let validation: Promise<unknown> | undefined;
        render(() => (
            <Form onGetFormApi={(formApi: FormApi) => (api = formApi)}>
                {() => (
                    <>
                        <FormInputGroup label="分组">
                            {() => (
                                <>
                                    <FormInput field="fast" validator={() => fast.promise} />
                                    <FormInput field="slow" validator={() => slow.promise} />
                                </>
                            )}
                        </FormInputGroup>
                        <Button
                            type="tertiary"
                            onClick={() => {
                                validation = api?.validate().catch((errors: unknown) => errors);
                            }}
                        >
                            {() => '校验'}
                        </Button>
                    </>
                )}
            </Form>
        ));
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
        type Effect = { name: string; type: string; key: number };
        let formApi: FormApi | undefined;
        const initValues = {
            effects: [
                { name: '1-name', type: '1-type', key: 0 },
                { name: '2-name', type: '2-type', key: 1 },
                { name: '3-name', type: '3-type', key: 2 },
            ],
        };
        const remove = (key: number) => {
            const api = formApi as FormApi;
            const effects = (api.getValue('effects') as Effect[]).filter((effect) => effect.key !== key);
            api.setValue('effects', effects.length ? effects : undefined);
        };
        render(() => (
            <Form onGetFormApi={(api: FormApi) => (formApi = api)} initValues={initValues}>
                {({ values }: FormDefaultSlotProps) =>
                    (values.effects as Effect[] | undefined)?.map((effect, i) => (
                        <div key={effect.key}>
                            <FormInput field={`effects[${i}].name`} />
                            <FormInput field={`effects[${i}].type`} />
                            <Button onClick={() => remove(effect.key)}>{() => 'Remove'}</Button>
                        </div>
                    ))
                }
            </Form>
        ));

        await userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[1]);
        expect(getInput('effects[0].name')).toHaveValue('1-name');
        expect(getInput('effects[0].type')).toHaveValue('1-type');
        expect(getInput('effects[1].name')).toHaveValue('3-name');
        expect(getInput('effects[1].type')).toHaveValue('3-type');
        expect(getInput('effects[2].name')).toBeNull();
    });
});
