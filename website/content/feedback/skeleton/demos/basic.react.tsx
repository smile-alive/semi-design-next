import { useState } from 'react';
import { Skeleton, Switch, Avatar, Button } from '@fibrae/semi-ui-react';

export default function SkeletonDemo() {
    const [loading, setLoading] = useState(true);
    const showContent = () => {
        setLoading(!loading);
    };
    return (
        <>
            <span style={{ display: 'flex', alignItems: 'center' }}>
                <Switch aria-labelledby="skeleton-basic-toggle" onChange={() => showContent()} />
                <span id="skeleton-basic-toggle" style={{ marginLeft: '10px' }}>
                    显示加载内容
                </span>
            </span>
            <br />
            <Skeleton placeholder={<Skeleton.Avatar />} loading={loading}>
                <Avatar color="blue" style={{ marginBottom: 10 }}>
                    U
                </Avatar>
            </Skeleton>
            <br />
            <Skeleton style={{ width: 200, height: 150 }} placeholder={<Skeleton.Image />} loading={loading}>
                <img src="/assets/placeholder/avatar-a.svg" height="150" alt="avatar" />
            </Skeleton>
            <br />
            <Skeleton style={{ width: 80 }} placeholder={<Skeleton.Title style={{ marginBottom: 10 }} />} loading={loading}>
                <h4 style={{ marginBottom: 0 }}>Semi UI</h4>
            </Skeleton>
            <Skeleton style={{ width: 240 }} placeholder={<Skeleton.Paragraph rows={2} />} loading={loading}>
                <p style={{ width: 240 }}>精心打磨每一个组件的用户体验，从用户的角度考虑每个组件的使用场景。</p>
            </Skeleton>
            <br />
            <Skeleton placeholder={<Skeleton.Button />} loading={loading}>
                <Button>Button</Button>
            </Skeleton>
        </>
    );
}
