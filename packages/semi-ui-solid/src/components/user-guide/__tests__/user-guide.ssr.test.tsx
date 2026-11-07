import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import UserGuide from '..';

// the dialog opens after mount, so the server has no markup for the step content
it('modal 模式在服务端不读取也不创建步骤内容', async () => {
    const created: string[] = [];
    const { errors } = await renderServer({
        render: () => (
            <UserGuide
                mode="modal"
                visible
                steps={[
                    {
                        title: 'Title',
                        get description() {
                            created.push('description');
                            return 'Body';
                        },
                    },
                ]}
                renderCover={() => {
                    created.push('cover');
                    return <img alt="cover" />;
                }}
                renderTitle={() => {
                    created.push('title');
                    return <b>Title</b>;
                }}
                renderDescription={() => {
                    created.push('render description');
                    return <i>Body</i>;
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(created).toEqual([]);
});
