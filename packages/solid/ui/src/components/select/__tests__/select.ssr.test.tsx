import { expect, it } from 'vite-plus/test';
import { renderServer, serverText } from '@test/solid/ssr.solid';
import Select from '..';

it('select/选项的 children 只在插入处创建', async () => {
    const created: string[] = [];
    const counted = (name: string) => () => {
        created.push(name);
        return <b>{name}</b>;
    };
    const Apple = counted('Apple');
    const Banana = counted('Banana');
    const { html, errors } = await renderServer({
        render: () => (
            <Select defaultValue="apple">
                <Select.Option value="apple">
                    <Apple />
                </Select.Option>
                <Select.Option value="banana">
                    <Banana />
                </Select.Option>
            </Select>
        ),
    });
    expect(errors).toEqual([]);
    expect(serverText(html)).toContain('Apple');
    // the closed dropdown inserts no rows: only the selected content in the trigger is created
    expect(created).toEqual(['Apple']);
});

it('select/label 只接受文本', async () => {
    const { errors } = await renderServer({
        render: () => (
            <>
                {/* @ts-expect-error markup goes in the Option's children or renderOptionItem */}
                <Select optionList={[{ value: 'a', label: <b>A</b> }]} />
                <Select>
                    {/* @ts-expect-error markup goes in the Option's children */}
                    <Select.Option value="a" label={<b>A</b>} />
                    {/* @ts-expect-error a group title is text */}
                    <Select.OptGroup label={<b>G</b>}>
                        <Select.Option value="b" label="B" />
                    </Select.OptGroup>
                </Select>
            </>
        ),
    });
    expect(errors).toEqual([]);
});
