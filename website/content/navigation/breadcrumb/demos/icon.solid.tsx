import { IconArticle, IconHome } from '@fibrae/semi-icons-solid';
import { Breadcrumb } from '@fibrae/semi-ui-solid';

export default function BreadcrumbDemo() {
    return (
        <Breadcrumb>
            <Breadcrumb.Item icon={<IconHome size="small" />} />
            <Breadcrumb.Item icon={<IconArticle size="small" />}>Breadcrumb</Breadcrumb.Item>
            <Breadcrumb.Item>With Icon</Breadcrumb.Item>
        </Breadcrumb>
    );
}
