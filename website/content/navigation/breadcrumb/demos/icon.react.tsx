import { IconHome, IconArticle } from '@fibrae/semi-icons-react';
import { Breadcrumb } from '@fibrae/semi-ui-react';

export default function BreadcrumbDemo() {
    return (
        <Breadcrumb>
            <Breadcrumb.Item icon={<IconHome size="small" />} />
            <Breadcrumb.Item icon={<IconArticle size="small" />}>Breadcrumb</Breadcrumb.Item>
            <Breadcrumb.Item>With Icon</Breadcrumb.Item>
        </Breadcrumb>
    );
}
