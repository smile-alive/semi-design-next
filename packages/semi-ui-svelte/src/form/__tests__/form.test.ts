import { describe, expect, it } from 'vite-plus/test';
import { getInput, input, renderForm, typeInto } from './helpers';

describe('Svelte Form 基础', () => {
    it('allowEmpty 时值变为空后保留 key', async () => {
        const { api } = renderForm({ allowEmpty: true }, [input('name', { initValue: 'a' })]);
        await typeInto(getInput(), '');
        expect(api().getValues()).toHaveProperty('name');
        const other = renderForm({}, [input('name', { initValue: 'a' })]);
        await typeInto(getInput(other.container), '');
        expect(other.api().getValues()).not.toHaveProperty('name');
    });
});
