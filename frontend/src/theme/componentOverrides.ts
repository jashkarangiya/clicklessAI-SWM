/**
 * ClickLess AI – Mantine Component Overrides & Variants
 *
 * All default component styles and custom variants live here.
 * Uses Mantine 8's `createTheme` components API.
 */
import { MantineThemeOverride } from '@mantine/core';

export const componentOverrides: MantineThemeOverride['components'] = {
    Button: {
        defaultProps: {
            radius: 'md',
        },
        vars: (theme: any, props: { variant: string; }) => {
            if (props.variant === 'brand') {
                return {
                    root: {
                        '--button-bg': 'var(--cl-brand)',
                        '--button-color': '#fff',
                        '--button-hover': 'var(--cl-brand-glow)',
                        '--button-bd': 'none',
                    },
                };
            }
            if (props.variant === 'brand-outline') {
                return {
                    root: {
                        '--button-bg': 'transparent',
                        '--button-color': 'var(--cl-brand)',
                        '--button-hover': 'var(--cl-brand-soft)',
                        '--button-bd': '1px solid var(--cl-brand)',
                    },
                };
            }
            if (props.variant === 'surface') {
                return {
                    root: {
                        '--button-bg': 'var(--cl-surface-raised)',
                        '--button-color': 'var(--cl-text-primary)',
                        '--button-hover': 'var(--cl-surface-alt)',
                        '--button-bd': '1px solid var(--cl-border)',
                    },
                };
            }
            if (props.variant === 'danger') {
                return {
                    root: {
                        '--button-bg': 'var(--cl-error-soft)',
                        '--button-color': 'var(--cl-error)',
                        '--button-hover': 'var(--cl-error)',
                        '--button-bd': '1px solid var(--cl-error)',
                    },
                };
            }
            return { root: {} };
        },
    },

    Paper: {
        defaultProps: {
            radius: 'md',
            p: 'md',
        },
    },

    Card: {
        defaultProps: {
            radius: 'md',
            padding: 'md',
        },
    },

    Modal: {
        defaultProps: {
            radius: 'lg',
            centered: true,
            overlayProps: { blur: 4 },
        },
        styles: {
            header: {
                borderBottom: '1px solid var(--cl-border)',
                paddingBottom: 'var(--mantine-spacing-sm)',
            },
            title: {
                fontWeight: 600,
                fontSize: 'var(--mantine-font-size-lg)',
            },
        },
    },

    TextInput: {
        defaultProps: {
            radius: 'md',
        },
        styles: {
            input: {
                backgroundColor: 'var(--cl-surface)',
                borderColor: 'var(--cl-border)',
                color: 'var(--cl-text-primary)',
            },
        },
    },

    PasswordInput: {
        defaultProps: {
            radius: 'md',
        },
        styles: {
            input: {
                backgroundColor: 'var(--cl-surface)',
                borderColor: 'var(--cl-border)',
                color: 'var(--cl-text-primary)',
            },
        },
    },

    Select: {
        defaultProps: {
            radius: 'md',
        },
        styles: {
            input: {
                backgroundColor: 'var(--cl-surface)',
                borderColor: 'var(--cl-border)',
                color: 'var(--cl-text-primary)',
            },
        },
    },

    Badge: {
        defaultProps: {
            radius: 'sm',
        },
        vars: (theme: any, props: { variant: string; }) => {
            if (props.variant === 'brand') {
                return {
                    root: {
                        '--badge-bg': 'var(--cl-brand-soft)',
                        '--badge-color': 'var(--cl-brand)',
                        '--badge-bd': '1px solid var(--cl-brand)',
                    },
                };
            }
            if (props.variant === 'success') {
                return {
                    root: {
                        '--badge-bg': 'var(--cl-success-soft)',
                        '--badge-color': 'var(--cl-success)',
                        '--badge-bd': 'none',
                    },
                };
            }
            if (props.variant === 'warning') {
                return {
                    root: {
                        '--badge-bg': 'var(--cl-warning-soft)',
                        '--badge-color': 'var(--cl-warning)',
                        '--badge-bd': 'none',
                    },
                };
            }
            if (props.variant === 'error') {
                return {
                    root: {
                        '--badge-bg': 'var(--cl-error-soft)',
                        '--badge-color': 'var(--cl-error)',
                        '--badge-bd': 'none',
                    },
                };
            }
            return { root: {} };
        },
    },

    Divider: {
        defaultProps: {
            color: 'var(--cl-border)',
        },
    },

    Tabs: {
        styles: {
            tab: {
                color: 'var(--cl-text-secondary)',
                '&[dataActive]': {
                    color: 'var(--cl-brand)',
                    borderBottomColor: 'var(--cl-brand)',
                },
            },
            list: {
                borderBottomColor: 'var(--cl-border)',
            },
        },
    },

    Tooltip: {
        defaultProps: {
            radius: 'sm',
            withArrow: true,
        },
        styles: {
            tooltip: {
                backgroundColor: 'var(--cl-surface-raised)',
                color: 'var(--cl-text-primary)',
                border: '1px solid var(--cl-border)',
                fontSize: '0.8rem',
            },
        },
    },

    Alert: {
        defaultProps: {
            radius: 'md',
        },
    },

    Notification: {
        defaultProps: {
            radius: 'md',
        },
        styles: {
            root: {
                backgroundColor: 'var(--cl-surface-raised)',
                border: '1px solid var(--cl-border)',
            },
            title: {
                color: 'var(--cl-text-primary)',
            },
            description: {
                color: 'var(--cl-text-secondary)',
            },
        },
    },
};
