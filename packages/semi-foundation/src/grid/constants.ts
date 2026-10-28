import { BASE_CLASS_PREFIX } from '../base/constants';

export const cssClasses = {
    PREFIX: `${BASE_CLASS_PREFIX}`,
};

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export type ResponsiveMap = Record<Breakpoint, string>;

// Shared by Row, Layout.Sider and ConfigProvider. The pixel values mirror the $width-grid_screen-* variables in
// grid/variables.scss, which a theme can override while this JS table cannot follow at runtime
export const defaultResponsiveMap: ResponsiveMap = {
    xs: '(max-width: 575px)',
    sm: '(min-width: 576px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 992px)',
    xl: '(min-width: 1200px)',
    xxl: '(min-width: 1600px)',
};
