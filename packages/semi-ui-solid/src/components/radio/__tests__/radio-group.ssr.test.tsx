import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import { RadioGroup, type OptionItem } from '..';

it('类型：options 只放数据', () => {
    // @ts-expect-error a non-text label goes through renderLabel
    const label: OptionItem = { label: <b />, value: 'a' };
    // @ts-expect-error a non-text extra goes through renderExtra
    const extra: OptionItem = { value: 'a', extra: <b /> };
    expect([label, extra]).toHaveLength(2);
});

it('renderLabel、renderExtra 按项创建一次内容', async () => {
    const created: string[] = [];
    const mark = (id: string) => {
        created.push(id);
        return <i data-mark={id} />;
    };
    const options: OptionItem[] = [
        { label: 'Fast', value: 'fast', extra: 'Quick' },
        { label: 'Think', value: 'think' },
    ];
    const { html, errors } = await renderServer({ render: () => <RadioGroup options={options} renderLabel={(option, index) => mark(`label-${String(option.value)}-${index}`)} renderExtra={(option) => mark(`extra-${String(option.value)}`)} /> });
    expect(errors).toEqual([]);
    expect(html).toContain('data-mark="label-fast-0"');
    expect(html).toContain('data-mark="extra-think"');
    expect(html).not.toContain('Fast');
    expect(created).toEqual(['label-fast-0', 'extra-fast', 'label-think-1', 'extra-think']);
});

it('按钮型 RadioGroup 不调用 renderExtra', async () => {
    const created: string[] = [];
    const { html, errors } = await renderServer({
        render: () => (
            <RadioGroup
                type="button"
                options={[{ label: 'Fast', value: 'fast' }]}
                renderExtra={() => {
                    created.push('extra');
                    return <i />;
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(html).toContain('Fast');
    expect(created).toEqual([]);
});
