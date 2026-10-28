import { IllustrationConstruction, IllustrationConstructionDark } from '@fibrae/semi-illustrations-solid';
import { Empty } from '@fibrae/semi-ui-solid';

const illustrationStyle = { width: '150px', height: '150px' };

export default function EmptyDemo() {
    return <Empty image={<IllustrationConstruction style={illustrationStyle} />} darkModeImage={<IllustrationConstructionDark style={illustrationStyle} />} title="功能建设中" description="当前功能暂未开放，敬请期待。" />;
}
