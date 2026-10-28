import { IconArrowRight } from '@fibrae/semi-icons-solid';
import { Breadcrumb, Tag } from '@fibrae/semi-ui-solid';

export default function BreadcrumbDemo() {
    // Several breadcrumbs on one page are told apart by aria-label
    return (
        <div>
            <Breadcrumb separator=">" aria-label="文字分隔符">
                <Breadcrumb.Item>Semi-ui</Breadcrumb.Item>
                <Breadcrumb.Item>Breadcrumb</Breadcrumb.Item>
                <Breadcrumb.Item>Default</Breadcrumb.Item>
            </Breadcrumb>
            <br />
            <Breadcrumb separator={<IconArrowRight size="small" />} aria-label="图标分隔符">
                <Breadcrumb.Item>Semi-ui</Breadcrumb.Item>
                <Breadcrumb.Item>Breadcrumb</Breadcrumb.Item>
                <Breadcrumb.Item>Default</Breadcrumb.Item>
            </Breadcrumb>
            <br />
            <Tag>{`v>=1.16.0`}</Tag>
            <br />
            <Breadcrumb aria-label="单项分隔符">
                <Breadcrumb.Item separator=":">Semi-ui</Breadcrumb.Item>
                <Breadcrumb.Item>Breadcrumb</Breadcrumb.Item>
                <Breadcrumb.Item>Default</Breadcrumb.Item>
            </Breadcrumb>
        </div>
    );
}
