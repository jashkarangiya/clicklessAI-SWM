/**
 * ClickLess AI – Semantic Token Resolver
 *
 * Returns the correct color token set based on color scheme.
 * Consumed by mantineTheme.ts and CSS variable injection.
 */
import { dark, light, type ColorSchemeTokens, type ColorSchemeLightTokens } from './colors';

export function getSemanticTokens(scheme: 'dark' | 'light'): ColorSchemeTokens | ColorSchemeLightTokens {
    return scheme === 'dark' ? dark : light;
}

// Named export for use in non-reactive contexts (build time, SSR metadata, etc.)
export { dark as darkTokens, light as lightTokens };
