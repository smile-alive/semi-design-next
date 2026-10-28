import { IconArrowUp } from '@fibrae/semi-icons-solid';
import { BackTop } from '@fibrae/semi-ui-solid';

export default function BackTopDemo() {
    return (
        <div>
            <span>向下滚动，右下角会出现一个方形的多彩按钮。</span>
            <BackTop aria-label="回到顶部" icon={<IconArrowUp />} shape="square" size="large" colorful style={{ bottom: '100px' }} />
        </div>
    );
}
