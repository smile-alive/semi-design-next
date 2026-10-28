import { useEffect } from 'react';

// ?token=<name> scrolls to and highlights the row until the next click; the table renders client-side, poll up to 5 s
export default function JumpToToken() {
    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get('token');
        if (!token) {
            return;
        }
        const timer = setInterval(() => {
            const targetDom = document.querySelector<HTMLElement>(`[data-token="${CSS.escape(token)}"]`);
            if (!targetDom) {
                return;
            }
            targetDom.scrollIntoView({ block: 'center' });
            const originBGColor = targetDom.style.backgroundColor;
            targetDom.style.backgroundColor = 'yellow';
            const removeBGColor = () => {
                targetDom.style.backgroundColor = originBGColor;
                window.removeEventListener('click', removeBGColor);
                window.removeEventListener('touchend', removeBGColor);
            };
            window.addEventListener('click', removeBGColor);
            window.addEventListener('touchend', removeBGColor);
            clearInterval(timer);
        }, 500);
        const timeout = setTimeout(() => clearInterval(timer), 5000);
        return () => {
            clearInterval(timer);
            clearTimeout(timeout);
        };
    }, []);
    return null;
}
