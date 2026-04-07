"""
Three-Stage Ranking Pipeline

Combines all three ranking stages into a single pipeline:
  Stage 1: BM25/TF-IDF Candidate Generation (Top-N)
  Stage 2: LambdaMART Feature-Based Ranking (Top-M)
  Stage 3: SBERT Neural Re-ranking (Final Top-K)

This is the main entry point for the ranking system.
"""

import logging
from typing import List, Dict, Optional

from backend.ranking.bm25_ranker import BM25Ranker
from backend.ranking.lambdamart_ranker import LambdaMARTRanker
from backend.ranking.sbert_ranker import SBERTRanker

logger = logging.getLogger(__name__)


class ThreeStageRanker:
    """
    Three-stage ranking pipeline for ClickLess AI.

    Flow:
        Raw Products (all scraped)
            -> Stage 1: BM25 hard filters + text matching -> Top-N (50)
            -> Stage 2: LambdaMART feature scoring -> Top-M (10-30)
            -> Stage 3: SBERT semantic re-ranking -> Final Top-K (5-10)
    """

    def __init__(self):
        self.bm25 = BM25Ranker()
        self.ltr = LambdaMARTRanker()
        self.sbert = SBERTRanker()

        logger.info("Three-Stage Ranking Pipeline initialized")
        logger.info(f"  Stage 1: BM25 (k1={self.bm25.k1}, b={self.bm25.b})")
        logger.info(f"  Stage 2: LambdaMART (trained={self.ltr.is_trained})")
        logger.info(f"  Stage 3: SBERT (lazy-loaded)")

    def rank_products(self, products: List[Dict], query: str,
                      constraints: Optional[Dict] = None,
                      max_price: Optional[float] = None,
                      min_rating: Optional[float] = None,
                      top_n: int = 50,
                      top_m: int = 20,
                      top_k: int = 5) -> List[Dict]:
        """
        Run the full three-stage ranking pipeline.

        Args:
            products: Raw scraped products from all sources
            query: User search query string
            constraints: Parsed constraints from LLM parser
            max_price: Maximum price (hard filter)
            min_rating: Minimum rating (hard filter)
            top_n: Stage 1 output size (default 50)
            top_m: Stage 2 output size (default 20)
            top_k: Final output size (default 5)

        Returns:
            Top-K ranked products with scores from all stages
        """
        if not products:
            logger.warning("No products to rank")
            return []

        logger.info(f"{'='*60}")
        logger.info(f"THREE-STAGE RANKING PIPELINE")
        logger.info(f"Input: {len(products)} raw products | Query: '{query}'")
        logger.info(f"Pipeline: Top-{top_n} -> Top-{top_m} -> Top-{top_k}")
        logger.info(f"{'='*60}")

        # Merge max_price from constraints if not explicitly provided
        if max_price is None and constraints:
            max_price = constraints.get('max_price')
        if min_rating is None and constraints:
            min_rating = constraints.get('min_rating')

        # =====================================================================
        # Stage 1: BM25 Candidate Generation
        # =====================================================================
        candidates = self.bm25.retrieve(
            query=query,
            products=products,
            max_price=max_price,
            min_rating=min_rating,
            top_n=top_n
        )

        if not candidates:
            logger.warning("Stage 1 returned no candidates")
            return []

        # =====================================================================
        # Stage 2: LambdaMART Feature-Based Ranking
        # =====================================================================
        ranked = self.ltr.rank(
            products=candidates,
            query=query,
            constraints=constraints,
            top_m=top_m
        )

        if not ranked:
            logger.warning("Stage 2 returned no products")
            return candidates[:top_k]  # Fallback to Stage 1 results

        # =====================================================================
        # Stage 3: SBERT Neural Re-ranking
        # =====================================================================
        final = self.sbert.rerank(
            products=ranked,
            query=query,
            top_k=top_k
        )

        if not final:
            logger.warning("Stage 3 returned no products")
            return ranked[:top_k]  # Fallback to Stage 2 results

        logger.info(f"{'='*60}")
        logger.info(f"PIPELINE COMPLETE: {len(products)} -> {len(candidates)} "
                    f"-> {len(ranked)} -> {len(final)}")
        logger.info(f"{'='*60}")

        return final

    def get_ranking_explanation(self, product: Dict) -> str:
        """
        Generate a human-readable explanation of why a product ranked highly.

        Args:
            product: Product dict with ranking features attached

        Returns:
            Natural language explanation string
        """
        features = product.get('ltr_features', {})
        reasons = []

        # Check constraint satisfaction
        if features.get('constraint_feature_match', 0) > 0.7:
            reasons.append("matches most of your required features")
        if features.get('constraint_color_match', 0) > 0.8:
            reasons.append("matches your color preference")
        if features.get('constraint_price_within', 0) > 0.8:
            reasons.append("within your budget")

        # Check quality
        if features.get('quality_rating', 0) > 0.8:
            rating = product.get('rating', 0)
            reasons.append(f"highly rated ({rating}/5 stars)")
        if features.get('quality_review_count', 0) > 0.5:
            reasons.append("popular with many reviews")

        # Check value
        if features.get('price_value_score', 0) > 0.7:
            reasons.append("excellent value for money")

        # Check text match
        if features.get('text_query_coverage', 0) > 0.8:
            reasons.append("closely matches your search")

        # SBERT score
        sbert = product.get('sbert_score', 0)
        if sbert > 0.7:
            reasons.append("semantically relevant to your request")

        if not reasons:
            reasons.append("good overall match for your criteria")

        return "This product ranks highly because it " + ", ".join(reasons) + "."

    def collect_feedback(self, session_data: Dict) -> int:
        """
        Collect training signal from user session for LambdaMART.

        Args:
            session_data: Session dict with query, products, selected_product

        Returns:
            Number of training examples collected
        """
        examples = self.ltr.collect_training_signal(session_data)
        logger.info(f"Collected {len(examples)} training examples from session")
        return len(examples)
