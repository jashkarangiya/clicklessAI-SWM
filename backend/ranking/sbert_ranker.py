"""
Stage 3: SBERT Neural Re-ranking

Semantic re-ranking using Sentence-BERT embeddings. Computes cosine
similarity between the user query and product text embeddings for
deeper semantic understanding beyond keyword matching.

Falls back to keyword-based scoring if sentence-transformers is not
installed or model loading fails.

Reference: Reimers & Gurevych (2019). Sentence-BERT: Sentence
Embeddings using Siamese BERT Networks. EMNLP.
"""

import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# Lazy load to avoid slow startup
_sbert_model = None
_sbert_available = None


def _load_sbert():
    """Lazy-load SBERT model on first use."""
    global _sbert_model, _sbert_available

    if _sbert_available is not None:
        return _sbert_available

    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading SBERT model (all-MiniLM-L6-v2)... this may take a moment")
        _sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
        _sbert_available = True
        logger.info("SBERT model loaded successfully")
        return True
    except ImportError:
        logger.warning("sentence-transformers not installed. "
                       "Run: pip install sentence-transformers")
        _sbert_available = False
        return False
    except Exception as e:
        logger.warning(f"SBERT model loading failed: {e}")
        _sbert_available = False
        return False


class SBERTRanker:
    """
    Stage 3: Neural Re-ranking using SBERT embeddings.

    Re-ranks Top-M products from Stage 2 using semantic similarity
    between query and product text. Produces final Top-K results
    with natural-language explanations.
    """

    def __init__(self):
        # Don't load model at init - lazy load on first use
        pass

    def rerank(self, products: List[Dict], query: str,
               top_k: int = 5) -> List[Dict]:
        """
        Stage 3: Neural Re-ranking

        Re-rank products using SBERT semantic similarity.

        Args:
            products: Top-M products from Stage 2 (LambdaMART)
            query: User search query
            top_k: Final number of products to return

        Returns:
            Top-K products with 'sbert_score' and final 'score'
        """
        if not products:
            return []

        logger.info(f"Stage 3 (SBERT): Re-ranking {len(products)} products")

        if _load_sbert() and _sbert_model is not None:
            products = self._rerank_with_sbert(products, query)
        else:
            products = self._rerank_with_fallback(products, query)

        # Compute final combined score
        for product in products:
            product['score'] = self._compute_final_score(product)

        # Sort by final score
        products.sort(key=lambda p: p.get('score', 0), reverse=True)

        result = products[:top_k]

        logger.info(f"Stage 3 Complete: Returning {len(result)} products "
                    f"(top score: {result[0].get('score', 0):.4f})" if result else "")

        return result

    def _rerank_with_sbert(self, products: List[Dict], query: str) -> List[Dict]:
        """Re-rank using actual SBERT embeddings."""
        try:
            import numpy as np

            # Get product texts
            texts = [self._get_product_text(p) for p in products]

            # Encode query and products
            query_embedding = _sbert_model.encode(query, convert_to_numpy=True)
            product_embeddings = _sbert_model.encode(texts, convert_to_numpy=True)

            # Compute cosine similarities
            # Normalize vectors
            query_norm = query_embedding / (np.linalg.norm(query_embedding) + 1e-8)
            product_norms = product_embeddings / (
                np.linalg.norm(product_embeddings, axis=1, keepdims=True) + 1e-8
            )

            similarities = np.dot(product_norms, query_norm)

            for i, product in enumerate(products):
                product['sbert_score'] = round(float(similarities[i]), 4)

            logger.info(f"  SBERT scoring complete. "
                        f"Max sim: {max(similarities):.4f}, "
                        f"Min sim: {min(similarities):.4f}")

        except Exception as e:
            logger.error(f"SBERT scoring failed: {e}")
            for p in products:
                p['sbert_score'] = 0.0

        return products

    def _rerank_with_fallback(self, products: List[Dict], query: str) -> List[Dict]:
        """
        Fallback re-ranking using enhanced keyword similarity
        when SBERT is not available.
        """
        import re

        query_words = set(self._tokenize(query))

        for product in products:
            title_words = set(self._tokenize(product.get('title', '')))

            if not query_words or not title_words:
                product['sbert_score'] = 0.0
                continue

            # Enhanced keyword similarity
            intersection = query_words & title_words
            coverage = len(intersection) / len(query_words) if query_words else 0

            # Bigram overlap bonus
            query_bigrams = self._get_bigrams(query.lower())
            title_bigrams = self._get_bigrams(product.get('title', '').lower())
            bigram_overlap = len(query_bigrams & title_bigrams) / max(len(query_bigrams), 1)

            # Combined fallback score (simulates semantic similarity)
            product['sbert_score'] = round(0.7 * coverage + 0.3 * bigram_overlap, 4)

        logger.info("  Using fallback keyword similarity (SBERT not available)")
        return products

    def _compute_final_score(self, product: Dict) -> float:
        """
        Compute final combined score from all three stages.

        Weighting:
        - BM25 (Stage 1): 15% - basic relevance signal
        - LTR (Stage 2): 50% - feature-based ranking (main signal)
        - SBERT (Stage 3): 35% - semantic understanding
        """
        bm25 = min(product.get('bm25_score', 0) / 10.0, 1.0)  # Normalize
        ltr = product.get('ltr_score', 0)
        sbert = product.get('sbert_score', 0)

        # Weighted combination
        final = (bm25 * 0.15) + (ltr * 0.50) + (sbert * 0.35)

        return round(max(0.0, min(1.0, final)), 4)

    def _get_product_text(self, product: Dict) -> str:
        """Build rich text representation for SBERT encoding."""
        parts = []
        if product.get('title'):
            parts.append(product['title'])
        if product.get('brand'):
            parts.append(f"by {product['brand']}")
        if product.get('source'):
            parts.append(f"from {product['source']}")
        if product.get('price'):
            parts.append(f"${product['price']}")
        if product.get('rating'):
            parts.append(f"{product['rating']} stars")
        return ' '.join(parts)

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenizer."""
        import re
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
                     'to', 'for', 'of', 'with', 'by', 'from', 'is', 'it'}
        return [t for t in text.split() if t not in stopwords and len(t) > 1]

    def _get_bigrams(self, text: str) -> set:
        """Extract character bigrams from text."""
        words = text.split()
        bigrams = set()
        for w in words:
            for i in range(len(w) - 1):
                bigrams.add(w[i:i+2])
        return bigrams
