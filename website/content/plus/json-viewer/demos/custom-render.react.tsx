import { JsonViewer, Rating, Popover, Tag, Image, type JsonViewerCustomRenderRule as CustomRenderRule } from '@fibrae/semi-ui-react';
const data = `{
  "name": "Semi",
  "version": "2.7.4",
  "rating": 5,
  "tags": ["design", "react", "ui"],
  "image": "/assets/root-web-sites/abstract.jpg"
}`;
export default function JsonViewerDemo() {
    const customRenderRule: CustomRenderRule[] = [
        {
            match: 'Semi',
            render: (content) => {
                return (
                    <Popover showArrow content="我是用户自定义的渲染" trigger="hover">
                        <span>{content}</span>
                    </Popover>
                );
            },
        },
        {
            match: (value) => value == 5,
            render: (content) => {
                return <Rating defaultValue={Number(content)} size={10} disabled />;
            },
        },
        {
            match: (_value, path) => path === 'root.tags[0]' || path === 'root.tags[1]' || path === 'root.tags[2]',
            render: (content) => {
                return (
                    <Tag size="small" shape="circle">
                        {content}
                    </Tag>
                );
            },
        },
        {
            match: new RegExp('^http'),
            render: (content) => {
                // content is the raw string token with its quotes; without them it is a valid URL
                return (
                    <Popover showArrow content={<Image width={100} height={100} src={content.replace(/^"|"$/g, '')} />} trigger="hover">
                        <span>{content}</span>
                    </Popover>
                );
            },
        },
    ];
    return (
        <div>
            <div style={{ marginBottom: 16, marginTop: 16 }}>
                <JsonViewer
                    height={200}
                    width={600}
                    value={data}
                    showSearch={false}
                    options={{
                        formatOptions: { tabSize: 4, insertSpaces: true, eol: '\n' },
                        customRenderRule,
                        readOnly: true,
                        autoWrap: true,
                    }}
                />
            </div>
        </div>
    );
}
