import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Avatar, { AvatarGroup } from '..';

it('avatar/超出 maxCount 的头像不在服务端创建', async () => {
    const created: string[] = [];
    const counted = (name: string) => () => {
        created.push(name);
        return name;
    };
    const [A, B, Top, Bottom] = ['A', 'B', 'top', 'bottom'].map(counted);
    const { html, errors } = await renderServer({
        render: () => (
            <AvatarGroup maxCount={1}>
                <Avatar>
                    <A />
                </Avatar>
                <Avatar alt="Hidden" topSlot={{ text: () => <Top /> }} bottomSlot={{ text: () => <Bottom /> }}>
                    <B />
                </Avatar>
            </AvatarGroup>
        ),
    });
    expect(errors).toEqual([]);
    expect(created).toEqual(['A']);
    expect(html).toContain('+1');
});
