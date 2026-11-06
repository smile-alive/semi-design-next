import { IconArticle, IconHome } from '@fibrae/semi-icons-solid';
import { Breadcrumb } from '@fibrae/semi-ui-solid';

export default function BreadcrumbDemo() {
    return (
        <Breadcrumb>
            <Breadcrumb.Item icon={<IconHome aria-label="Home" size="small" />} />
            <Breadcrumb.Item icon={<IconArticle size="small" />}>Breadcrumb</Breadcrumb.Item>
            <Breadcrumb.Item>With Icon</Breadcrumb.Item>
        </Breadcrumb>
    );
}
