import { Button } from '@fibrae/semi-ui-solid';

export default function DarkModeDemo() {
    const switchMode = () => {
        const body = document.body;
        if (body.hasAttribute('theme-mode')) {
            body.removeAttribute('theme-mode');
        } else {
            body.setAttribute('theme-mode', 'dark');
        }
    };

    return <Button onClick={switchMode}>Switch Mode</Button>;
}
