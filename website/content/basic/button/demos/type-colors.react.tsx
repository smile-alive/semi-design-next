export default function ButtonDemo() {
    const types = [
        ['primary', '主要'],
        ['secondary', '次要'],
        ['tertiary', '第三'],
        ['warning', '警告'],
        ['danger', '危险'],
    ];

    return (
        <article>
            {types.map(([type, label]) => (
                <strong key={type} style={{ color: `var(--semi-color-${type})`, marginRight: 10 }}>
                    {label}
                </strong>
            ))}
        </article>
    );
}
