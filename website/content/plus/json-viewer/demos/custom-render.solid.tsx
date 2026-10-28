import { Image, JsonViewer, Popover, Rating, Tag, type JsonViewerCustomRenderRule } from '@fibrae/semi-ui-solid';

const data = `{
  "name": "Semi",
  "version": "2.7.4",
  "rating": 5,
  "tags": ["design", "react", "ui"],
  "image": "/assets/root-web-sites/abstract.jpg"
}`;

const customRenderRule: JsonViewerCustomRenderRule[] = [
    {
        match: 'Semi',
        render: (content) => (
            <Popover showArrow content="我是用户自定义的渲染" trigger="hover">
                <span>{content}</span>
            </Popover>
        ),
    },
    {
        match: (value) => value == 5,
        render: (content) => <Rating defaultValue={Number(content)} size={10} disabled />,
    },
    {
        match: (_value, path) => path === 'root.tags[0]' || path === 'root.tags[1]' || path === 'root.tags[2]',
        render: (content) => (
            <Tag size="small" shape="circle">
                {content}
            </Tag>
        ),
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

export default function JsonViewerDemo() {
    return (
        <div>
            <div style={{ 'margin-bottom': '16px', 'margin-top': '16px' }}>
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
