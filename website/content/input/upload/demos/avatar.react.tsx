import { useState } from 'react';
import { IconCamera } from '@fibrae/semi-icons-react';
import { Upload, Avatar, Toast } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

const api = '/upload';
const imageOnly = 'image/*';

const maskStyle = {
    backgroundColor: 'var(--semi-color-overlay-bg)',
    height: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--semi-color-white)',
};

export default function UploadDemo() {
    const [url, setUrl] = useState('/assets/placeholder/avatar-a.svg');

    const onSuccess = () => {
        Toast.success('头像更新成功');
        setUrl('/assets/ttmoment.jpeg');
    };

    return (
        <Upload className="avatar-upload" action={api} customRequest={mockUpload} onSuccess={onSuccess} accept={imageOnly} showUploadList={false} onError={() => Toast.error('上传失败')}>
            {/* the avatar is the whole content of the upload button, so its alt names the button */}
            <Avatar
                src={url}
                alt="上传头像"
                style={{ margin: 4 }}
                hoverMask={
                    <div style={maskStyle}>
                        <IconCamera />
                    </div>
                }
            />
        </Upload>
    );
}
