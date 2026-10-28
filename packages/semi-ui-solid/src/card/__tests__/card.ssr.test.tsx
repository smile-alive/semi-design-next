import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Card from '..';

it('loading 时不创建 children', async () => {
    let created = 0;
    const Counted = () => {
        created += 1;
        return 'body text';
    };
    const { html, errors } = await renderServer({
        render: () => (
            <Card loading>
                <Counted />
            </Card>
        ),
    });
    expect(errors).toEqual([]);
    expect(html).toContain('semi-skeleton');
    expect(html).not.toContain('body text');
    expect(created).toBe(0);
});
