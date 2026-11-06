import { IllustrationConstruction, IllustrationConstructionDark } from '@fibrae/semi-illustrations-react';
import { Empty } from '@fibrae/semi-ui-react';

const imageStyle = { width: 150, height: 150 };

export default function EmptyDemo() {
    return <Empty image={<IllustrationConstruction style={imageStyle} />} darkModeImage={<IllustrationConstructionDark style={imageStyle} />} title="功能建设中" description="当前功能暂未开放，敬请期待。" />;
}
