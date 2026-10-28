import { IllustrationNoContent, IllustrationNoContentDark } from '@fibrae/semi-illustrations-react';
import { Empty, Button } from '@fibrae/semi-ui-react';

export default function EmptyDemo() {
    return (
        <Empty image={<IllustrationNoContent style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 150, height: 150 }} />} title="空状态标题" description="开始创建你的第一个仪表盘吧！">
            <div>
                <Button style={{ padding: '6px 24px', marginRight: 12 }} type="primary">
                    二级按钮
                </Button>
                <Button style={{ padding: '6px 24px' }} theme="solid" type="primary">
                    一级按钮
                </Button>
            </div>
        </Empty>
    );
}
