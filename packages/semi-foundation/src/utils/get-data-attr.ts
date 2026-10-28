export default function getDataAttr(props: Record<string, any>) {
    return Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith('data-')));
}
