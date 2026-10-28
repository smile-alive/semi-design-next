import type { ReactNode } from 'react';
import '@fibrae/semi-foundation/notification/notification.scss';
import type { NoticeProps } from '@fibrae/semi-ui-react';
import NotificationCard from '@fibrae/semi-ui-react/notification/notice';

interface TaskNotificationProps extends Pick<NoticeProps, 'title' | 'style'> {
    action: ReactNode;
}

export default function TaskNotification({ title, action, style }: TaskNotificationProps) {
    return (
        <NotificationCard
            type="info"
            style={style}
            title={title}
            content={
                <div>
                    400 tasks succeed and 600 failed
                    <div style={{ color: 'var(--semi-color-primary)', marginTop: 4, fontWeight: 600 }}>{action}</div>
                </div>
            }
        />
    );
}
