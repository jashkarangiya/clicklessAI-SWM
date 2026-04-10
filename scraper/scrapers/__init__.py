"""
Scrapers package.
Provides concurrent search across Amazon and Walmart using asyncio.gather.
"""

import asyncio
import logging
from typing import List, Dict, Optional

from scraper.scrapers.amazon import search_amazon
from scraper.scrapers.walmart import search_walmart
from scraper.scrapers.detail import scrape_product_detail

logger = logging.getLogger(__name__)


async def search_all_sites(
    query: str,
    max_results: int = 10,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
) -> Dict[str, List[Dict]]:
    """
    Search both Amazon and Walmart concurrently using asyncio.gather.

    Args:
        query: Search query string.
        max_results: Max results per site.
        max_price: Optional price ceiling.
        min_rating: Optional minimum rating.

    Returns:
        Dict with 'amazon' and 'walmart' keys, each containing a product list.
    """
    logger.info(f"Concurrent search on all sites: '{query}'")

    amazon_task = search_amazon(query, max_results, max_price, min_rating)
    walmart_task = search_walmart(query, max_results, max_price, min_rating)

    results = await asyncio.gather(amazon_task, walmart_task, return_exceptions=True)

    amazon_results = results[0] if not isinstance(results[0], Exception) else []
    walmart_results = results[1] if not isinstance(results[1], Exception) else []

    if isinstance(results[0], Exception):
        logger.error(f"Amazon search failed: {results[0]}")
    if isinstance(results[1], Exception):
        logger.error(f"Walmart search failed: {results[1]}")

    combined = {
        "amazon": amazon_results,
        "walmart": walmart_results,
        "total": len(amazon_results) + len(walmart_results),
    }

    logger.info(
        f"Concurrent search complete: {len(amazon_results)} Amazon + "
        f"{len(walmart_results)} Walmart = {combined['total']} total"
    )
    return combined
