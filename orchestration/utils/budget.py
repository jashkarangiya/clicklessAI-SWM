"""Shared budget label normalization used by intent_detection and validate_enrich."""


def parse_budget_label(answer) -> str:
    """Normalize a budget value (string or numeric) to a canonical label.

    Canonical labels match the keys used in _BUDGET_MAX_PRICE and _filter_by_budget.
    Handles int/float from LLM entity extraction (e.g. budget=300 → "high_end").
    Returns the raw string if no canonical mapping is found.
    """
    if isinstance(answer, (int, float)):
        n = float(answer)
        if n <= 0:
            return "no_limit"
        if n < 50:
            return "under_50"
        if n <= 100:
            return "50_100"
        if n <= 200:
            return "100_200"
        return "high_end"
    a = str(answer).lower().strip()
    if "no limit" in a or a in ("any", "no budget", "unlimited"):
        return "no_limit"
    if "under" in a and "50" in a:
        return "under_50"
    if "50" in a and "100" in a:
        return "50_100"
    if "100" in a and "200" in a:
        return "100_200"
    if "200" in a and ("500" in a or "high" in a):
        return "high_end"
    return str(answer)
