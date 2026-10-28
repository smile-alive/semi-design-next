import { IconHome } from '@fibrae/semi-icons-solid';
import { Breadcrumb } from '@fibrae/semi-ui-solid';

export default function BreadcrumbDemo() {
    // Several breadcrumbs on one page are told apart by aria-label
    return (
        <div>
            <Breadcrumb compact aria-label="紧凑面包屑">
                <Breadcrumb.Item icon={<IconHome size="small" />} />
                <Breadcrumb.Item>Breadcrumb</Breadcrumb.Item>
                <Breadcrumb.Item>Loose</Breadcrumb.Item>
            </Breadcrumb>
            <br />
            <Breadcrumb compact={false} aria-label="宽松面包屑">
                <Breadcrumb.Item icon={<IconHome size="small" />} />
                <Breadcrumb.Item>Breadcrumb</Breadcrumb.Item>
                <Breadcrumb.Item>Loose</Breadcrumb.Item>
            </Breadcrumb>
        </div>
    );
}
