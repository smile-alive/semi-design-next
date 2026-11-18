import { Button } from '@fibrae/semi-ui-solid';

export default function DarkModeDemo() {
    const switchMode = () => {
        const root = document.documentElement;
        if (root.hasAttribute('theme-mode')) {
            root.removeAttribute('theme-mode');
        } else {
            root.setAttribute('theme-mode', 'dark');
        }
    };

    return <Button onClick={switchMode}>Switch Mode</Button>;
}
