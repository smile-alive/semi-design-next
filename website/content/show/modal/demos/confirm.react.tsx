import { IconSend } from '@fibrae/semi-icons-react';
import { Modal, Button } from '@fibrae/semi-ui-react';

export default function ModalDemo() {
    function success() {
        Modal.success({ title: 'This is a success message', content: 'bla bla bla...' });
    }

    function info() {
        Modal.info({ title: 'Here is some info', content: 'bla bla bla...' });
    }

    function error() {
        Modal.error({ title: 'Unfortunately, there is an error', content: 'bla bla bla...' });
    }

    function warning() {
        Modal.warning({ title: 'Warning: be cautious ahead', content: 'bla bla bla...' });
    }

    function confirm() {
        Modal.confirm({ title: 'Are you sure ?', content: 'bla bla bla...' });
    }

    function custom() {
        Modal.info({
            title: 'This is a custom modal',
            content: 'bla bla bla...',
            icon: <IconSend />,
            cancelButtonProps: { theme: 'borderless' },
            okButtonProps: { theme: 'solid' },
        });
    }

    return (
        <div>
            <Button onClick={info}>Info</Button>
            <br />
            <br />
            <Button onClick={success}>Success</Button>
            <br />
            <br />
            <Button onClick={error} type="danger">
                Error
            </Button>
            <br />
            <br />
            <Button onClick={warning} type="warning">
                Warning
            </Button>
            <br />
            <br />
            <Button onClick={confirm} type="primary">
                Confirm
            </Button>
            <br />
            <br />
            <Button onClick={custom}>Custom</Button>
        </div>
    );
}
