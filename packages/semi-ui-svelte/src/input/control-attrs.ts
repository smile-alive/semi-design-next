/** class and style size the visual root; every other attribute belongs to the inner native control */
export const isNotClassOrStyle = (key: string) => key !== 'class' && key !== 'style';
