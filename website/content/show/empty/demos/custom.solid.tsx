import { IllustrationNoContent, IllustrationNoContentDark } from '@fibrae/semi-illustrations-solid';
import { Button, Empty } from '@fibrae/semi-ui-solid';

const illustrationStyle = { width: '150px', height: '150px' };

export default function EmptyDemo() {
    return (
        <Empty image={<IllustrationNoContent style={illustrationStyle} />} darkModeImage={<IllustrationNoContentDark style={illustrationStyle} />} title="空状态标题" description="开始创建你的第一个仪表盘吧！">
            <div>
                <Button style={{ padding: '6px 24px', 'margin-right': '12px' }} type="primary">
                    二级按钮
                </Button>
                <Button style={{ padding: '6px 24px' }} theme="solid" type="primary">
                    一级按钮
                </Button>
            </div>
        </Empty>
    );
}
