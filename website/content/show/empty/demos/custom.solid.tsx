import { IllustrationNoContent, IllustrationNoContentDark } from '@fibrae/semi-illustrations-solid';
import { Button, Empty } from '@fibrae/semi-ui-solid';

const imageStyle = { width: '150px', height: '150px' };

export default function EmptyDemo() {
    return (
        <Empty image={<IllustrationNoContent style={imageStyle} />} darkModeImage={<IllustrationNoContentDark style={imageStyle} />} title="空状态标题" description="开始创建你的第一个仪表盘吧！">
            <div>
                <Button style={{ padding: '6px 24px', 'margin-inline-end': '12px' }} type="primary">
                    二级按钮
                </Button>
                <Button style={{ padding: '6px 24px' }} theme="solid" type="primary">
                    一级按钮
                </Button>
            </div>
        </Empty>
    );
}
