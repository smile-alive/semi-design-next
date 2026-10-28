import { createSignal } from 'solid-js';
import { IconCamera } from '@fibrae/semi-icons-solid';
import { Avatar, Toast, Upload } from '@fibrae/semi-ui-solid';

const api = 'https://api.semi.design/upload';
const imageOnly = 'image/*';

const maskStyle = {
    'background-color': 'var(--semi-color-overlay-bg)',
    height: '100%',
    width: '100%',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    color: 'var(--semi-color-white)',
};

export default function UploadDemo() {
    const [url, setUrl] = createSignal('/assets/placeholder/avatar-a.svg');

    const onSuccess = () => {
        Toast.success('头像更新成功');
        setUrl('/assets/ttmoment.jpeg');
    };

    return (
        <Upload class="avatar-upload" action={api} onSuccess={onSuccess} accept={imageOnly} showUploadList={false} onError={() => Toast.error('上传失败')}>
            {/* the avatar is the whole content of the upload button, so its alt names the button */}
            <Avatar
                src={url()}
                alt="上传头像"
                style={{ margin: '4px' }}
                hoverMask={
                    <div style={maskStyle}>
                        <IconCamera />
                    </div>
                }
            />
        </Upload>
    );
}
