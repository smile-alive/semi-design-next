import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-react';
import { Empty, Button } from '@fibrae/semi-ui-react';

export default function EmptyDemo() {
    return (
        <Empty
            title="创建成功"
            image={<IllustrationSuccess style={{ width: 150, height: 150 }} />}
            darkModeImage={<IllustrationSuccessDark style={{ width: 150, height: 150 }} />}
            layout="horizontal"
            description="这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。"
            style={{ width: 800, margin: '0 auto' }}
        >
            <Button type="primary" theme="solid" style={{ padding: '6px 24px' }}>
                开始操作
            </Button>
        </Empty>
    );
}
