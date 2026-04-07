"""
Stage 1: BM25/TF-IDF Candidate Generation

Implements BM25 (Okapi BM25) retrieval for matching user query terms
against product titles and descriptions. This is the classical baseline
ranker that produces Top-N candidates from raw scraped products.

Reference: Robertson & Zaragoza (2009). BM25 and Beyond.
"""

import math
import re
import logging
from typing import List, Dict, Optional
from collections import Counter

logger = logging.getLogger(__name__)


class BM25Ranker:
    """
    BM25 (Okapi BM25) ranker for product retrieval.

    Scores each product's text (title) against the user query using
    term frequency, inverse document frequency, and document length
    normalization.

    Parameters:
        k1: Term frequency saturation parameter (default 1.5)
        b: Document length normalization parameter (default 0.75)
    """

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b

    def _tokenize(self, text: str) -> List[str]:
        """Lowercase and split text into tokens, removing punctuation."""
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        tokens = text.split()
        # Remove common stopwords that don't help ranking
        stopwords = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
            'to', 'for', 'of', 'with', 'by', 'from', 'is', 'it', 'as',
            'was', 'are', 'be', 'this', 'that', 'i', 'we', 'you', 'my'
        }
        return [t for t in tokens if t not in stopwords and len(t) > 1]

    def _get_product_text(self, product: Dict) -> str:
        """Extract searchable text from product fields."""
        parts = []
        if product.get('title'):
            parts.append(product['title'])
        if product.get('brand'):
            parts.append(product['brand'])
        if product.get('features'):
            if isinstance(product['features'], list):
                parts.extend(product['features'])
            else:
                parts.append(str(product['features']))
        return ' '.join(parts)

    def score(self, query: str, products: List[Dict]) -> List[Dict]:
        """
        Score products against query using BM25.

        Args:
            query: User search query string
            products: List of product dictionaries

        Returns:
            Products with 'bm25_score' field added, sorted descending
        """
        if not products:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            logger.warning("BM25: Empty query after tokenization")
            for p in products:
                p['bm25_score'] = 0.0
            return products

        # Build corpus: tokenize all product texts
        corpus = []
        for product in products:
            text = self._get_product_text(product)
            tokens = self._tokenize(text)
            corpus.append(tokens)

        # Calculate average document length
        doc_lengths = [len(doc) for doc in corpus]
        avgdl = sum(doc_lengths) / len(doc_lengths) if doc_lengths else 1.0
        N = len(corpus)

        # Calculate IDF for each query term
        idf = {}
        for term in query_tokens:
            # Number of documents containing the term
            df = sum(1 for doc in corpus if term in doc)
            # BM25 IDF formula: log((N - df + 0.5) / (df + 0.5) + 1)
            idf[term] = math.log((N - df + 0.5) / (df + 0.5) + 1.0)

        # Score each product
        for i, product in enumerate(products):
            doc = corpus[i]
            dl = doc_lengths[i]
            doc_tf = Counter(doc)

            score = 0.0
            for term in query_tokens:
                tf = doc_tf.get(term, 0)
                # BM25 term score
                numerator = tf * (self.k1 + 1)
                denominator = tf + self.k1 * (1 - self.b + self.b * (dl / avgdl))
                term_score = idf.get(term, 0) * (numerator / denominator) if denominator > 0 else 0
                score += term_score

            product['bm25_score'] = round(score, 4)

        # Sort by BM25 score descending
        products.sort(key=lambda p: p.get('bm25_score', 0), reverse=True)

        logger.info(f"BM25: Scored {len(products)} products. "
                    f"Top score: {products[0].get('bm25_score', 0):.4f}" if products else "")

        return products

    def retrieve(self, query: str, products: List[Dict],
                 max_price: Optional[float] = None,
                 min_rating: Optional[float] = None,
                 top_n: int = 50) -> List[Dict]:
        """
        Stage 1: Candidate Generation

        Apply hard filters (price, rating, availability) then BM25 ranking
        to produce Top-N candidates.

        Args:
            query: User search query
            products: Raw scraped products from all sources
            max_price: Maximum price constraint (hard filter)
            min_rating: Minimum rating constraint (hard filter)
            top_n: Number of candidates to return (default 50)

        Returns:
            Top-N candidates after filtering and BM25 scoring
        """
        logger.info(f"Stage 1 (BM25): Processing {len(products)} raw products")

        # === Hard Filters ===

        filtered = list(products)  # Copy to avoid mutating original

        # Price filter
        if max_price is not None:
            before = len(filtered)
            filtered = [p for p in filtered if p.get('price', float('inf')) <= max_price]
            logger.info(f"  Price filter (max ${max_price}): {before} -> {len(filtered)}")

        # Rating filter
        if min_rating is not None:
            before = len(filtered)
            filtered = [p for p in filtered
                        if p.get('rating', 0) >= min_rating or p.get('rating') is None]
            logger.info(f"  Rating filter (min {min_rating}): {before} -> {len(filtered)}")

        # Availability filter - remove products with price = 0 or no title
        before = len(filtered)
        filtered = [p for p in filtered
                    if p.get('price', 0) > 0 and p.get('title', '').strip()]
        logger.info(f"  Availability filter: {before} -> {len(filtered)}")

        if not filtered:
            logger.warning("Stage 1: No products passed hard filters")
            return []

        # === Deduplicate ===
        seen_titles = set()
        unique = []
        for p in filtered:
            title_key = p.get('title', '').lower().strip()
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                unique.append(p)
        filtered = unique
        logger.info(f"  After dedup: {len(filtered)} unique products")

        # === BM25 Scoring ===
        scored = self.score(query, filtered)

        # Return Top-N candidates
        candidates = scored[:top_n]
        logger.info(f"Stage 1 Complete: Returning {len(candidates)} candidates")

        return candidates


class TFIDFRanker:
    """
    TF-IDF + Cosine Similarity baseline ranker.

    Simpler alternative to BM25 for comparison. Computes TF-IDF vectors
    for query and each product, then ranks by cosine similarity.
    """

    def _tokenize(self, text: str) -> List[str]:
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        stopwords = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
            'to', 'for', 'of', 'with', 'by', 'from', 'is', 'it'
        }
        return [t for t in text.split() if t not in stopwords and len(t) > 1]

    def score(self, query: str, products: List[Dict]) -> List[Dict]:
        """Score products using TF-IDF cosine similarity."""
        if not products:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            for p in products:
                p['tfidf_score'] = 0.0
            return products

        # Build vocabulary and document frequencies
        corpus = []
        for p in products:
            title = p.get('title', '')
            tokens = self._tokenize(title)
            corpus.append(tokens)

        N = len(corpus)
        vocab = set()
        for doc in corpus:
            vocab.update(doc)
        vocab.update(query_tokens)

        # IDF for each term
        idf = {}
        for term in vocab:
            df = sum(1 for doc in corpus if term in doc)
            idf[term] = math.log((N + 1) / (df + 1)) + 1  # Smoothed IDF

        # Score each product via cosine similarity with query
        query_tf = Counter(query_tokens)
        query_vec = {t: query_tf[t] * idf.get(t, 0) for t in query_tokens}
        query_norm = math.sqrt(sum(v ** 2 for v in query_vec.values())) or 1.0

        for i, product in enumerate(products):
            doc_tf = Counter(corpus[i])
            doc_vec = {t: doc_tf[t] * idf.get(t, 0) for t in corpus[i]}
            doc_norm = math.sqrt(sum(v ** 2 for v in doc_vec.values())) or 1.0

            # Cosine similarity (dot product / norms)
            dot = sum(query_vec.get(t, 0) * doc_vec.get(t, 0) for t in vocab)
            similarity = dot / (query_norm * doc_norm)

            product['tfidf_score'] = round(similarity, 4)

        products.sort(key=lambda p: p.get('tfidf_score', 0), reverse=True)
        return products
