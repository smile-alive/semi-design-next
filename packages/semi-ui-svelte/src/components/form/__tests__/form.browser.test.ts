import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import type { FormApi } from '../interface';
import GroupValidateFixture from './group-validate-fixture.svelte';
import { renderForm, settle } from './helpers';

const fieldInput = (field: string) => document.querySelector(`[x-field-id="${field}"] input`);

describe('Svelte Form（浏览器）', () => {
    it('InputGroup 在字段校验完成时显示无效状态，整组错误等全部校验结束后显示', async () => {
        const fast = Promise.withResolvers<string>();
        const slow = Promise.withResolvers<string>();
        let api = {} as FormApi;
        render(GroupValidateFixture, { props: { fast: () => fast.promise, slow: () => slow.promise, onApi: (formApi: FormApi) => (api = formApi) } });
        const validation = api.validate().catch((errors: unknown) => errors);
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
        const effects = [1, 2, 3].map((n, key) => ({ name: `${n}-name`, type: `${n}-type`, key }));
        const { api } = renderForm({ initValues: { effects } }, [], { rows: { path: 'effects', subs: ['name', 'type'], keyBy: 'key' } });
        api().setValue(
            'effects',
            (api().getValue('effects') as Effect[]).filter((effect) => effect.key !== 1)
        );
        await settle();
        expect(fieldInput('effects[0].name')).toHaveValue('1-name');
        expect(fieldInput('effects[0].type')).toHaveValue('1-type');
        expect(fieldInput('effects[1].name')).toHaveValue('3-name');
        expect(fieldInput('effects[1].type')).toHaveValue('3-type');
        expect(fieldInput('effects[2].name')).toBeNull();
    });
});
