/**
 * ClickLess AI – Price / Date / Rating Formatters
 * Centralise all display formatting here so components stay clean.
 */

export function formatPrice(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatPriceCompact(amount: number): string {
    if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(1)}k`;
    }
    return formatPrice(amount);
}

export function formatDiscount(pct: number): string {
    return `-${Math.round(pct)}%`;
}

export function formatRating(avg: number): string {
    return avg.toFixed(1);
}

export function formatReviewCount(count: number): string {
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k reviews`;
    }
    return `${count} reviews`;
}

export function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
}

export function formatDateRelative(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.round((d.getTime() - now.getTime()) / 86_400_000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff > 1) return `In ${diff} days`;
    return formatDate(iso);
}

export function formatTimestamp(iso: string): string {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso));
}

export function formatDelivery(days?: number, label?: string): string {
    if (label) return label;
    if (days === undefined) return 'Delivery info unavailable';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
}

/** Generate a short unique ID for mock/frontend use */
export function nanoid(): string {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
