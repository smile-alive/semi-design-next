import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Rating from '..';

it('每个字符位置只创建一次 character', async () => {
    let created = 0;
    const Counted = () => {
        created += 1;
        return <b>*</b>;
    };
    const { html, errors } = await renderServer({ render: () => <Rating count={3} character={<Counted />} /> });
    expect(errors).toEqual([]);
    // count stars and the empty one
    expect(html.match(/<b[^>]*>\*<\/b>/g)).toHaveLength(4);
    expect(created).toBe(4);
});
