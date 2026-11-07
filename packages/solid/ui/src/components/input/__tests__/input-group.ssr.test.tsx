import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Input, { InputGroup } from '..';

it('label.text 只创建一次', async () => {
    let created = 0;
    const Counted = () => {
        created += 1;
        return 'group label';
    };
    const { html, errors } = await renderServer({
        render: () => (
            <InputGroup label={{ text: <Counted /> }}>
                <Input />
            </InputGroup>
        ),
    });
    expect(errors).toEqual([]);
    expect(html).toContain('group label');
    expect(created).toBe(1);
});
