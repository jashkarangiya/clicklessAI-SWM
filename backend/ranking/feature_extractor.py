"""
Feature Extractor for Learning-to-Rank

Extracts 5 feature groups from products for LambdaMART/XGBoost training:
  1. Constraint Satisfaction - hard/soft attribute matches
  2. Price - absolute, budget margin, value score
  3. Quality - star rating, review count, brand reliability
  4. Delivery - shipping days, cost, availability
  5. Text Similarity - BM25 score, embedding cosine similarity

Reference: Burges (2010). From RankNet to LambdaRank to LambdaMART.
"""

import re
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class FeatureExtractor:
    """
    Extracts feature vectors from products for the LambdaMART ranking model.

    Each product is represented by a feature vector spanning 5 groups:
    constraint satisfaction, price, quality, delivery, and text similarity.
    """

    def extract_features(self, product: Dict, query: str,
                         constraints: Optional[Dict] = None) -> Dict[str, float]:
        """
        Extract all feature groups for a single product.

        Args:
            product: Product dictionary with title, price, rating, etc.
            query: Original user search query
            constraints: Parsed constraints from LLM (max_price, features, color, etc.)

        Returns:
            Dictionary of feature_name -> feature_value (all floats 0-1)
        """
        constraints = constraints or {}
        features = {}

        # Group 1: Constraint Satisfaction
        features.update(self._constraint_features(product, constraints))

        # Group 2: Price Features
        features.update(self._price_features(product, constraints))

        # Group 3: Quality Features
        features.update(self._quality_features(product))

        # Group 4: Delivery Features
        features.update(self._delivery_features(product))

        # Group 5: Text Similarity Features
        features.update(self._text_similarity_features(product, query))

        return features

    def extract_batch(self, products: List[Dict], query: str,
                      constraints: Optional[Dict] = None) -> List[Dict[str, float]]:
        """Extract features for all products in batch."""
        return [self.extract_features(p, query, constraints) for p in products]

    # =========================================================================
    # Group 1: Constraint Satisfaction Features
    # =========================================================================

    def _constraint_features(self, product: Dict, constraints: Dict) -> Dict[str, float]:
        """
        How well does this product match the user's explicit constraints?

        Features:
        - feature_match_ratio: Fraction of required features found in title
        - color_match: 1.0 if color matches, 0.0 if not
        - brand_match: 1.0 if preferred brand, 0.0 if not
        - price_within_budget: 1.0 if under max_price, 0.0 if over
        - constraint_satisfaction_score: Overall constraint satisfaction (0-1)
        """
        title_lower = product.get('title', '').lower()

        # Feature match ratio
        required_features = constraints.get('features', [])
        if required_features:
            matches = sum(1 for f in required_features if f.lower() in title_lower)
            feature_match = matches / len(required_features)
        else:
            feature_match = 0.5  # Neutral when no features specified

        # Color match
        color = constraints.get('color', '')
        color_match = 1.0 if color and color.lower() in title_lower else 0.0
        if not color:
            color_match = 0.5  # Neutral

        # Brand match
        preferred_brands = constraints.get('preferred_brands', [])
        brand_match = 0.0
        if preferred_brands:
            brand_match = 1.0 if any(b.lower() in title_lower for b in preferred_brands) else 0.0
        else:
            brand_match = 0.5  # Neutral

        # Price within budget
        max_price = constraints.get('max_price')
        price = product.get('price', 0)
        if max_price and price > 0:
            price_within = 1.0 if price <= max_price else 0.0
        else:
            price_within = 0.5

        # Overall constraint satisfaction
        scores = [feature_match, color_match, brand_match, price_within]
        overall = sum(scores) / len(scores)

        return {
            'constraint_feature_match': feature_match,
            'constraint_color_match': color_match,
            'constraint_brand_match': brand_match,
            'constraint_price_within': price_within,
            'constraint_overall': overall,
        }

    # =========================================================================
    # Group 2: Price Features
    # =========================================================================

    def _price_features(self, product: Dict, constraints: Dict) -> Dict[str, float]:
        """
        Price-related features.

        Features:
        - price_normalized: Price normalized to 0-1 range (lower = higher score)
        - budget_margin: How far under budget (1.0 = way under, 0.0 = at/over budget)
        - price_percentile: Relative price position (computed externally if batch)
        - value_score: Rating per dollar (higher = better value)
        """
        price = product.get('price', 0)
        max_price = constraints.get('max_price')
        rating = product.get('rating', 0) or 0

        # Normalized price (inverse, capped at $2000)
        price_norm = 1.0 - min(price / 2000.0, 1.0) if price > 0 else 0.0

        # Budget margin (how much room under max_price)
        if max_price and max_price > 0 and price > 0:
            margin = (max_price - price) / max_price
            budget_margin = max(0.0, min(1.0, margin))
        else:
            budget_margin = 0.5

        # Value score: rating per $100
        if price > 0 and rating > 0:
            value = (rating / 5.0) / (price / 100.0)
            value_score = min(1.0, value)  # Cap at 1.0
        else:
            value_score = 0.0

        # Log price (compressed scale)
        import math
        log_price = 1.0 - (math.log(price + 1) / math.log(2001)) if price > 0 else 0.0

        return {
            'price_normalized': round(price_norm, 4),
            'price_budget_margin': round(budget_margin, 4),
            'price_value_score': round(value_score, 4),
            'price_log_normalized': round(log_price, 4),
        }

    # =========================================================================
    # Group 3: Quality Features
    # =========================================================================

    def _quality_features(self, product: Dict) -> Dict[str, float]:
        """
        Quality signal features.

        Features:
        - rating_normalized: Star rating / 5.0
        - rating_above_4: Binary indicator for 4+ stars
        - review_count_log: Log-normalized review count (popularity signal)
        - has_rating: Whether product has a rating at all
        """
        rating = product.get('rating', 0) or 0
        review_count = product.get('review_count', 0) or 0

        # Rating normalized (0-1)
        rating_norm = rating / 5.0 if rating > 0 else 0.0

        # High rating indicator
        rating_above_4 = 1.0 if rating >= 4.0 else 0.0

        # Review count (log scale, normalized)
        import math
        review_log = math.log(review_count + 1) / math.log(10001) if review_count > 0 else 0.0

        # Has rating (binary)
        has_rating = 1.0 if rating > 0 else 0.0

        return {
            'quality_rating': round(rating_norm, 4),
            'quality_above_4': rating_above_4,
            'quality_review_count': round(review_log, 4),
            'quality_has_rating': has_rating,
        }

    # =========================================================================
    # Group 4: Delivery Features
    # =========================================================================

    def _delivery_features(self, product: Dict) -> Dict[str, float]:
        """
        Delivery and availability features.

        Features:
        - is_available: 1.0 if in stock, 0.0 if not
        - source_reliability: Score based on retailer (Amazon > Walmart > others)
        - has_free_shipping: 1.0 if free shipping indicated
        - shipping_speed: Estimated speed (1.0 = prime/fast, 0.5 = standard)
        """
        source = product.get('source', '').lower()
        title_lower = product.get('title', '').lower()
        price = product.get('price', 0)

        # Availability (price > 0 implies in stock from our scrapers)
        is_available = 1.0 if price > 0 else 0.0

        # Source reliability score
        source_scores = {
            'amazon': 0.9,
            'walmart': 0.8,
            'ikea': 0.7,
            'mock': 0.3,
        }
        source_reliability = source_scores.get(source, 0.5)

        # Free shipping indicator (heuristic from title/source)
        has_free_shipping = 0.0
        if 'free shipping' in title_lower or 'free delivery' in title_lower:
            has_free_shipping = 1.0
        elif source == 'amazon' and price >= 35:
            has_free_shipping = 0.8  # Amazon free shipping over $35
        elif source == 'walmart' and price >= 35:
            has_free_shipping = 0.8

        # Shipping speed (heuristic)
        shipping_speed = 0.5  # Default standard
        if 'prime' in title_lower or source == 'amazon':
            shipping_speed = 0.9
        if 'next day' in title_lower or 'same day' in title_lower:
            shipping_speed = 1.0

        return {
            'delivery_available': is_available,
            'delivery_source_reliability': source_reliability,
            'delivery_free_shipping': has_free_shipping,
            'delivery_speed': shipping_speed,
        }

    # =========================================================================
    # Group 5: Text Similarity Features
    # =========================================================================

    def _text_similarity_features(self, product: Dict, query: str) -> Dict[str, float]:
        """
        Text similarity features between query and product.

        Features:
        - title_query_overlap: Word overlap ratio
        - title_query_coverage: Fraction of query words found in title
        - exact_match: 1.0 if all query words appear in title
        - bm25_score: BM25 score (if pre-computed by Stage 1)
        """
        query_tokens = set(self._tokenize(query))
        title_tokens = set(self._tokenize(product.get('title', '')))

        if not query_tokens or not title_tokens:
            return {
                'text_query_overlap': 0.0,
                'text_query_coverage': 0.0,
                'text_exact_match': 0.0,
                'text_bm25_score': product.get('bm25_score', 0.0),
            }

        # Word overlap (Jaccard-like)
        intersection = query_tokens & title_tokens
        union = query_tokens | title_tokens
        overlap = len(intersection) / len(union) if union else 0.0

        # Query coverage (what fraction of query words appear in title)
        coverage = len(intersection) / len(query_tokens)

        # Exact match (all query words in title)
        exact_match = 1.0 if query_tokens.issubset(title_tokens) else 0.0

        # BM25 score (if already computed by Stage 1)
        bm25 = product.get('bm25_score', 0.0)
        # Normalize BM25 to 0-1 range (approximate)
        bm25_norm = min(bm25 / 10.0, 1.0) if bm25 > 0 else 0.0

        return {
            'text_query_overlap': round(overlap, 4),
            'text_query_coverage': round(coverage, 4),
            'text_exact_match': exact_match,
            'text_bm25_score': round(bm25_norm, 4),
        }

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization."""
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
                     'to', 'for', 'of', 'with', 'by', 'from', 'is', 'it'}
        return [t for t in text.split() if t not in stopwords and len(t) > 1]

    # =========================================================================
    # Feature Vector for XGBoost/LambdaMART
    # =========================================================================

    # Ordered list of all feature names (for consistent vector ordering)
    FEATURE_NAMES = [
        # Group 1: Constraint Satisfaction
        'constraint_feature_match',
        'constraint_color_match',
        'constraint_brand_match',
        'constraint_price_within',
        'constraint_overall',
        # Group 2: Price
        'price_normalized',
        'price_budget_margin',
        'price_value_score',
        'price_log_normalized',
        # Group 3: Quality
        'quality_rating',
        'quality_above_4',
        'quality_review_count',
        'quality_has_rating',
        # Group 4: Delivery
        'delivery_available',
        'delivery_source_reliability',
        'delivery_free_shipping',
        'delivery_speed',
        # Group 5: Text Similarity
        'text_query_overlap',
        'text_query_coverage',
        'text_exact_match',
        'text_bm25_score',
    ]

    def to_feature_vector(self, features: Dict[str, float]) -> List[float]:
        """Convert feature dict to ordered list for XGBoost input."""
        return [features.get(name, 0.0) for name in self.FEATURE_NAMES]

    def to_feature_matrix(self, feature_list: List[Dict[str, float]]) -> List[List[float]]:
        """Convert list of feature dicts to 2D matrix for XGBoost."""
        return [self.to_feature_vector(f) for f in feature_list]
