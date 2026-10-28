import { IllustrationConstruction, IllustrationConstructionDark } from '@fibrae/semi-illustrations-react';
import { Empty } from '@fibrae/semi-ui-react';

export default function EmptyDemo() {
    return <Empty image={<IllustrationConstruction style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationConstructionDark style={{ width: 150, height: 150 }} />} title="功能建设中" description="当前功能暂未开放，敬请期待。" />;
}
