import { IconUploadError } from '@fibrae/semi-icons-solid';
import { Image } from '@fibrae/semi-ui-solid';

export default function ImageDemo() {
    return (
        <div style={{ display: 'flex', 'align-items': 'center', 'flex-direction': 'column' }}>
            <span>加载失败默认样式</span>
            <Image width={200} height={200} src="https://load-error.jpeg" alt="加载失败的图片" />
            <br />
            <span>自定义加载失败占位图</span>
            <Image width={200} height={200} src="https://load-error.jpeg" alt="加载失败的图片" fallback={<IconUploadError style={{ 'font-size': '50px' }} />} />
        </div>
    );
}
