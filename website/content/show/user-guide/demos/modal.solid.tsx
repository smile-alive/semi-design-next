import { createSignal } from 'solid-js';
import { Button, Image, Typography, type UserGuideStepItem, UserGuide } from '@fibrae/semi-ui-solid';

const steps: UserGuideStepItem[] = [
    { title: '欢迎使用 Semi DSM!', position: 'bottom' },
    {
        title: '高可用的色盘',
        description: '选取主色后，我们的颜色算法会为你生成一套高可用的色盘',
        position: 'bottom',
    },
    { title: '自由定制', description: '开始定制属于你的设计系统吧！', position: 'bottom' },
];

const covers = ['/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'];

export default function UserGuideDemo() {
    const [visible, setVisible] = createSignal(false);
    const showDialog = () => {
        setVisible(true);
    };
    return (
        <div>
            <Button onClick={showDialog}>开始引导</Button>
            <UserGuide
                mode="modal"
                mask
                visible={visible()}
                steps={steps}
                renderCover={({ index }) => <Image width="600px" height="100%" src={covers[index]} />}
                renderDescription={({ index }) =>
                    index === 0 ? (
                        <div>
                            你可以从已发布的主题出发，或者选择<Typography.Text strong>立即创造</Typography.Text>
                            来创造一个新的主题
                        </div>
                    ) : undefined
                }
                onChange={(current) => {
                    console.log('当前引导步骤', current);
                }}
                onNext={() => {
                    console.log('下一步引导');
                }}
                onPrev={() => {
                    console.log('上一步引导');
                }}
                onFinish={() => {
                    setVisible(false);
                    console.log('引导完成');
                }}
                onSkip={() => {
                    setVisible(false);
                    console.log('跳过引导');
                }}
            />
        </div>
    );
}
