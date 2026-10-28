import { createSignal } from 'solid-js';
import { Avatar, Button, Skeleton, Switch } from '@fibrae/semi-ui-solid';

export default function SkeletonDemo() {
    const [loading, setLoading] = createSignal(true);

    return (
        <>
            <span style={{ display: 'flex', 'align-items': 'center' }}>
                <Switch aria-labelledby="skeleton-basic-toggle" onChange={() => setLoading((value) => !value)} />
                <span id="skeleton-basic-toggle" style={{ 'margin-left': '10px' }}>
                    显示加载内容
                </span>
            </span>
            <br />
            <Skeleton placeholder={<Skeleton.Avatar />} loading={loading()}>
                <Avatar color="blue" style={{ 'margin-bottom': '10px' }}>
                    U
                </Avatar>
            </Skeleton>
            <br />
            <Skeleton style={{ width: '200px', height: '150px' }} placeholder={<Skeleton.Image />} loading={loading()}>
                <img src="/assets/placeholder/avatar-a.svg" height="150" alt="avatar" />
            </Skeleton>
            <br />
            <Skeleton style={{ width: '80px' }} placeholder={<Skeleton.Title style={{ 'margin-bottom': '10px' }} />} loading={loading()}>
                <h4 style={{ 'margin-bottom': '0' }}>Semi UI</h4>
            </Skeleton>
            <Skeleton style={{ width: '240px' }} placeholder={<Skeleton.Paragraph rows={2} />} loading={loading()}>
                <p style={{ width: '240px' }}>精心打磨每一个组件的用户体验，从用户的角度考虑每个组件的使用场景。</p>
            </Skeleton>
            <br />
            <Skeleton placeholder={<Skeleton.Button />} loading={loading()}>
                <Button>Button</Button>
            </Skeleton>
        </>
    );
}
