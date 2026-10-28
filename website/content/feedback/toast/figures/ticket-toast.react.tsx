import type { ReactNode } from 'react';
import '@fibrae/semi-foundation/toast/toast.scss';
import type { ToastProps } from '@fibrae/semi-ui-react';
import ToastCard from '@fibrae/semi-ui-react/toast/toast';

interface TicketToastProps extends Pick<ToastProps, 'type' | 'content'> {
    action?: ReactNode;
}

export default function TicketToast({ type, content, action }: TicketToastProps) {
    return (
        <ToastCard
            type={type}
            content={
                action ? (
                    <div>
                        {content} <span style={{ color: 'var(--semi-color-primary)', marginLeft: 4, cursor: 'pointer' }}>{action}</span>{' '}
                    </div>
                ) : (
                    content
                )
            }
        />
    );
}
