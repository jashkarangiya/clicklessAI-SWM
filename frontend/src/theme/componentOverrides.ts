/**
 * ClickLess AI – Mantine Component Overrides & Variants
 *
 * All default component styles and custom variants live here.
 * Uses Mantine 8's `createTheme` components API.
 *
 * Design direction: pill buttons, large rounded inputs, calm badges,
 * editorial spacing, commerce-grade trust.
 */
import { MantineThemeOverride } from '@mantine/core';

export const componentOverrides: MantineThemeOverride['components'] = {
    Button: {
        defaultProps: {
            radius: 9999,
        },
        styles: {
            root: {
                fontWeight: 600,
                transition: 'all 0.15s ease',
            },
        },
        vars: (theme: any, props: { variant: string; }) => {
            if (props.variant === 'brand') {
                return {
                    root: {
                        '--button-bg': 'var(--cl-brand)',
                        '--button-color': '#fff',
                        '--button-hover': 'var(--cl-brand-glow)',
                        '--button-bd': 'none',
                        '--button-hover-color': '#fff',
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
                        '--button-bg': 'var(--cl-surface)',
                        '--button-color': 'var(--cl-text-primary)',
                        '--button-hover': 'var(--cl-surface-raised)',
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
                        '--button-hover-color': '#fff',
                        '--button-bd': '1px solid var(--cl-error)',
                    },
                };
            }
            return { root: {} };
        },
    },

    Paper: {
        defaultProps: {
            radius: 'lg',
            p: 'lg',
        },
    },

    Card: {
        defaultProps: {
            radius: 'lg',
            padding: 'lg',
        },
        styles: {
            root: {
                border: '1px solid var(--cl-border)',
            },
        },
    },

    Modal: {
        defaultProps: {
            radius: 'xl',
            centered: true,
            overlayProps: { blur: 6, backgroundOpacity: 0.25 },
        },
        styles: {
            header: {
                borderBottom: '1px solid var(--cl-border)',
                paddingBottom: 'var(--mantine-spacing-sm)',
            },
            title: {
                fontWeight: 600,
                fontSize: 'var(--mantine-font-size-lg)',
                color: 'var(--cl-text-primary)',
            },
            content: {
                backgroundColor: 'var(--cl-surface)',
            },
        },
    },

    TextInput: {
        defaultProps: {
            radius: 8,
            size: 'md',
        },
        styles: {
            input: {
                backgroundColor: '#FFFFFF',
                borderColor: '#D9DEE6',
                borderWidth: 1,
                color: '#142033',
                height: 44,
                fontSize: '0.9rem',
                paddingLeft: 14,
                paddingRight: 14,
                transition: 'border-color 140ms ease',
            },
            label: {
                color: '#4A5568',
                fontWeight: 500,
                fontSize: '0.82rem',
                marginBottom: 5,
            },
        },
    },

    PasswordInput: {
        defaultProps: {
            radius: 8,
            size: 'md',
        },
        styles: {
            input: {
                backgroundColor: '#FFFFFF',
                borderColor: '#D9DEE6',
                borderWidth: 1,
                color: '#142033',
                height: 44,
                fontSize: '0.9rem',
                paddingLeft: 14,
                transition: 'border-color 140ms ease',
            },
            innerInput: {
                height: 44,
                fontSize: '0.9rem',
            },
            label: {
                color: '#4A5568',
                fontWeight: 500,
                fontSize: '0.82rem',
                marginBottom: 5,
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
                height: 48,
            },
            label: {
                color: 'var(--cl-text-primary)',
                fontWeight: 500,
                marginBottom: 6,
            },
        },
    },

    Badge: {
        defaultProps: {
            radius: 9999,
            tt: 'none',
        },
        vars: (theme: any, props: { variant: string; }) => {
            if (props.variant === 'brand') {
                return {
                    root: {
                        '--badge-bg': 'var(--cl-brand-soft)',
                        '--badge-color': 'var(--cl-brand)',
                        '--badge-bd': 'none',
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
                fontWeight: 500,
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
                backgroundColor: 'var(--cl-text-primary)',
                color: '#fff',
                fontSize: '0.8rem',
            },
        },
    },

    Alert: {
        defaultProps: {
            radius: 'lg',
        },
    },

    Notification: {
        defaultProps: {
            radius: 'lg',
        },
        styles: {
            root: {
                backgroundColor: 'var(--cl-surface)',
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

    NumberInput: {
        defaultProps: {
            radius: 'md',
        },
        styles: {
            input: {
                backgroundColor: 'var(--cl-surface)',
                borderColor: 'var(--cl-border)',
                color: 'var(--cl-text-primary)',
                height: 48,
            },
            label: {
                color: 'var(--cl-text-primary)',
                fontWeight: 500,
                marginBottom: 6,
            },
        },
    },

    TagsInput: {
        defaultProps: {
            radius: 'md',
        },
        styles: {
            input: {
                backgroundColor: 'var(--cl-surface)',
                borderColor: 'var(--cl-border)',
            },
            label: {
                color: 'var(--cl-text-primary)',
                fontWeight: 500,
                marginBottom: 6,
            },
        },
    },

    Switch: {
        styles: {
            label: {
                color: 'var(--cl-text-primary)',
            },
        },
    },

    Checkbox: {
        styles: {
            label: {
                color: 'var(--cl-text-secondary)',
                cursor: 'pointer',
            },
        },
    },

    Slider: {
        styles: {
            track: {
                backgroundColor: 'var(--cl-border)',
            },
        },
    },

    SegmentedControl: {
        defaultProps: {
            radius: 9999,
        },
        styles: {
            root: {
                backgroundColor: 'var(--cl-surface-raised)',
                border: '1px solid var(--cl-border)',
                padding: 3,
            },
            indicator: {
                backgroundColor: 'var(--cl-surface)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                borderRadius: 9999,
            },
            label: {
                color: 'var(--cl-text-secondary)',
                fontWeight: 500,
                '&[data-active]': {
                    color: 'var(--cl-text-primary)',
                },
            },
        },
    },
};
