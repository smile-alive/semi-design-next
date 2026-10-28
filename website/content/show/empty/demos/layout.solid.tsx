import { IllustrationSuccess, IllustrationSuccessDark } from '@fibrae/semi-illustrations-solid';
import { Button, Empty } from '@fibrae/semi-ui-solid';

const illustrationStyle = { width: '150px', height: '150px' };

export default function EmptyDemo() {
    return (
        <Empty
            title="创建成功"
            image={<IllustrationSuccess style={illustrationStyle} />}
            darkModeImage={<IllustrationSuccessDark style={illustrationStyle} />}
            layout="horizontal"
            description="这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。这是一段很长的描述文本，当文本过长的时候推荐使用这种布局形式。"
            style={{ width: '800px', margin: '0 auto' }}
        >
            <Button type="primary" theme="solid" style={{ padding: '6px 24px' }}>
                开始操作
            </Button>
        </Empty>
    );
}
