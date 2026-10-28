import { IllustrationNoAccess, IllustrationNoAccessDark } from '@fibrae/semi-illustrations-react';
import { Button, Empty } from '@fibrae/semi-ui-react';

export default function NoAccess({ action }: { action: string }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <Empty image={<IllustrationNoAccess style={{ width: 150, height: 150 }} />} darkModeImage={<IllustrationNoAccessDark style={{ width: 150, height: 150 }} />} description="No permission to view this page" />
            <Button theme="solid" type="primary" style={{ marginTop: 12 }}>
                {action}
            </Button>
        </div>
    );
}
