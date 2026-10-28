import { Toast, Upload } from '@fibrae/semi-ui-solid';

export default function UploadDemo() {
    return <Upload action="https://api.semi.design/upload" addOnPasting draggable dragMainText="复制截图或文件后，在页面上按 Ctrl/Cmd + V" dragSubText="也可以点击或拖拽上传" onPastingError={() => Toast.error('读取剪贴板中的文件失败')} />;
}
