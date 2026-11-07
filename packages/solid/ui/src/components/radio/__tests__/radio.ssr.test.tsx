import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Radio from '..';

it('按钮型 Radio 不创建 extra', async () => {
    let created = 0;
    const Counted = () => {
        created += 1;
        return 'extra text';
    };
    const { html, errors } = await renderServer({
        render: () => (
            <Radio type="button" extra={<Counted />}>
                Choice
            </Radio>
        ),
    });
    expect(errors).toEqual([]);
    expect(html).toContain('Choice');
    expect(html).not.toContain('extra text');
    expect(created).toBe(0);
});
