import { Index, Show } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconPlus } from '@fibrae/semi-icons-solid';
import { type FormApi, Form, FormInput, FormSwitch, FormUpload } from '..';
import Button from '../../button';

const getInput = (field: string) => document.querySelector(`[x-field-id="${field}"] input`);

describe('Form', () => {
    it('labelPosition 为 inset 时，不支持内嵌标签的字段回退 top，label 位于控件上方', () => {
        render(() => (
            <Form labelPosition="inset">
                <FormSwitch field="on" label="Notify" />
                <FormInput field="name" label="Name" />
            </Form>
        ));
        const switchRect = screen.getByRole('switch', { name: 'Notify' }).getBoundingClientRect();
        const labelRect = screen.getByText('Notify').getBoundingClientRect();
        expect(labelRect.bottom).toBeLessThanOrEqual(switchRect.top);
        const input = screen.getByRole('textbox');
        expect(screen.getByText('Name').getBoundingClientRect().bottom).toBeGreaterThan(input.getBoundingClientRect().top);
    });

    it('InputGroup 在字段校验完成时显示无效状态，整组错误等全部校验结束后显示', async () => {
        const fast = Promise.withResolvers<string>();
        const slow = Promise.withResolvers<string>();
        let api: FormApi | undefined;
        let validation: Promise<unknown> | undefined;
        render(() => (
            <Form getFormApi={(value) => (api = value)}>
                <Form.InputGroup label="分组">
                    <FormInput field="fast" validator={() => fast.promise} />
                    <FormInput field="slow" validator={() => slow.promise} />
                </Form.InputGroup>
                <Button
                    type="tertiary"
                    onClick={() => {
                        validation = api?.validate().catch((errors: unknown) => errors);
                    }}
                >
                    校验
                </Button>
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

    // #2448: inside a Form field the error outline of a failed picture card was hidden, so the card also draws the
    // error color as a border, kept inside its 96px box
    it('FormUpload 中上传失败的图片卡片在卡片内显示错误边框', () => {
        const { container } = render(() => (
            <Form>
                <FormUpload multiple accept="image/*" action="https://semi.design/upload" field="files" initValue={[{ uid: '1', name: 'dy.png', status: 'uploadFail', url: '' }]} listType="picture">
                    <IconPlus size="extra-large" />
                </FormUpload>
            </Form>
        ));
        const card = container.querySelector(`.${BASE_CLASS_PREFIX}-upload-picture-file-card-error`) as HTMLElement;
        expect(card).not.toBeNull();
        const style = getComputedStyle(card);
        expect(style.borderTopStyle).toBe('solid');
        expect(style.borderTopWidth).toBe('1px');
        expect(style.borderTopColor).toBe(style.outlineColor);
        expect(style.borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
        const { width, height } = card.getBoundingClientRect();
        expect(width).toBe(96);
        expect(height).toBe(96);
    });

    it('formApi.setValue 使用数组字段路径，3 变为 2，删除中间行字段', async () => {
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
            const effects = (api.getValue('effects') as typeof initValues.effects).filter((effect) => effect.key !== key);
            api.setValue('effects', effects.length ? effects : undefined);
        };
        render(() => (
            <Form getFormApi={(api) => (formApi = api)} initValues={initValues}>
                {(props) => (
                    <Show when={props.values.effects}>
                        {(effects) => (
                            // Index, not For: every field write renews the row objects, and For would remount the rows
                            <Index each={effects() as typeof initValues.effects}>
                                {(effect, i) => (
                                    <div>
                                        <FormInput field={`effects[${i}].name`} />
                                        <FormInput field={`effects[${i}].type`} />
                                        <Button onClick={() => remove(effect().key)}>Remove</Button>
                                    </div>
                                )}
                            </Index>
                        )}
                    </Show>
                )}
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
