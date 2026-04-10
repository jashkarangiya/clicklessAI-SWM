"""
Stage 2: LambdaMART / XGBoost Learning-to-Rank

Feature-based ranking using gradient-boosted decision trees trained on
user click/selection signals from MongoDB conversation history.

Training Labels:
- Positive (label=2): User confirmed product selection
- Relevant (label=1): Product viewed/considered but not selected
- Negative (label=0): Product in Top-K but skipped/unselected

Cold-start: Uses heuristic scoring until enough training data accumulates,
then transitions to trained XGBoost model.

References:
  Burges (2010). From RankNet to LambdaRank to LambdaMART.
  Chen & Guestrin (2016). XGBoost: A Scalable Tree Boosting System.
"""

import os
import json
import logging
import pickle
from typing import List, Dict, Optional, Tuple
from backend.ranking.feature_extractor import FeatureExtractor

logger = logging.getLogger(__name__)

# Model save path
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'lambdamart_model.pkl')


class LambdaMARTRanker:
    """
    Stage 2: Feature-Based Ranking using XGBoost (LambdaMART objective).

    Scores Top-N candidates from Stage 1 using 21 features across 5 groups.
    Falls back to heuristic weighted scoring when no trained model exists.
    """

    def __init__(self):
        self.feature_extractor = FeatureExtractor()
        self.model = None
        self.is_trained = False

        # Try to load a pre-trained model
        self._load_model()

        # Heuristic weights for cold-start (before model is trained)
        # These weights approximate what LambdaMART would learn
        self.heuristic_weights = {
            # Group 1: Constraint Satisfaction (30%)
            'constraint_feature_match': 0.10,
            'constraint_color_match': 0.05,
            'constraint_brand_match': 0.05,
            'constraint_price_within': 0.05,
            'constraint_overall': 0.05,
            # Group 2: Price (20%)
            'price_normalized': 0.05,
            'price_budget_margin': 0.08,
            'price_value_score': 0.05,
            'price_log_normalized': 0.02,
            # Group 3: Quality (25%)
            'quality_rating': 0.12,
            'quality_above_4': 0.05,
            'quality_review_count': 0.05,
            'quality_has_rating': 0.03,
            # Group 4: Delivery (10%)
            'delivery_available': 0.03,
            'delivery_source_reliability': 0.04,
            'delivery_free_shipping': 0.02,
            'delivery_speed': 0.01,
            # Group 5: Text Similarity (15%)
            'text_query_overlap': 0.04,
            'text_query_coverage': 0.05,
            'text_exact_match': 0.03,
            'text_bm25_score': 0.03,
        }

    def rank(self, products: List[Dict], query: str,
             constraints: Optional[Dict] = None,
             top_m: int = 10) -> List[Dict]:
        """
        Stage 2: Feature-Based Ranking

        Score candidates using LambdaMART model (or heuristic fallback)
        and return Top-M products.

        Args:
            products: Top-N candidates from Stage 1 (BM25)
            query: User search query
            constraints: Parsed constraints from LLM
            top_m: Number of products to return (default 10)

        Returns:
            Top-M ranked products with 'ltr_score' and 'features' fields
        """
        if not products:
            return []

        logger.info(f"Stage 2 (LTR): Ranking {len(products)} candidates")

        # Extract features for all products
        feature_dicts = self.feature_extractor.extract_batch(products, query, constraints)

        # Score using trained model or heuristic fallback
        if self.is_trained and self.model is not None:
            scores = self._score_with_model(feature_dicts)
            logger.info("  Using trained XGBoost model")
        else:
            scores = self._score_with_heuristic(feature_dicts)
            logger.info("  Using heuristic weights (cold-start)")

        # Attach scores and features to products
        for i, product in enumerate(products):
            product['ltr_score'] = round(scores[i], 4)
            product['ltr_features'] = feature_dicts[i]

        # Sort by LTR score descending
        products.sort(key=lambda p: p.get('ltr_score', 0), reverse=True)

        result = products[:top_m]
        logger.info(f"Stage 2 Complete: Returning {len(result)} products "
                    f"(top LTR score: {result[0].get('ltr_score', 0):.4f})" if result else "")

        return result

    def _score_with_model(self, feature_dicts: List[Dict[str, float]]) -> List[float]:
        """Score products using trained XGBoost model."""
        try:
            feature_matrix = self.feature_extractor.to_feature_matrix(feature_dicts)
            # XGBoost predict returns relevance scores
            import numpy as np
            X = np.array(feature_matrix)
            scores = self.model.predict(X)
            return scores.tolist()
        except Exception as e:
            logger.error(f"Model scoring failed, falling back to heuristic: {e}")
            return self._score_with_heuristic(feature_dicts)

    def _score_with_heuristic(self, feature_dicts: List[Dict[str, float]]) -> List[float]:
        """Score products using handcrafted heuristic weights (cold-start)."""
        scores = []
        for features in feature_dicts:
            score = sum(
                features.get(name, 0.0) * weight
                for name, weight in self.heuristic_weights.items()
            )
            # Clamp to 0-1
            scores.append(max(0.0, min(1.0, score)))
        return scores

    # =========================================================================
    # Training Pipeline
    # =========================================================================

    def train(self, training_data: List[Dict]) -> Dict:
        """
        Train the XGBoost ranking model on labeled data.

        Args:
            training_data: List of dicts with:
                - 'product': product dict
                - 'query': search query string
                - 'constraints': parsed constraints
                - 'label': relevance label (0=skip, 1=view, 2=select)
                - 'group_id': query group ID (for pairwise learning)

        Returns:
            Training metrics (NDCG, MAP, etc.)
        """
        try:
            import xgboost as xgb
            import numpy as np
        except ImportError:
            logger.error("XGBoost not installed. Run: pip install xgboost")
            return {'error': 'xgboost not installed'}

        if len(training_data) < 20:
            logger.warning(f"Insufficient training data: {len(training_data)} examples (need >= 20)")
            return {'error': 'insufficient data', 'count': len(training_data)}

        logger.info(f"Training LambdaMART on {len(training_data)} examples")

        # Extract features and labels
        X = []
        y = []
        groups = {}

        for item in training_data:
            features = self.feature_extractor.extract_features(
                item['product'], item['query'], item.get('constraints', {})
            )
            X.append(self.feature_extractor.to_feature_vector(features))
            y.append(item['label'])

            gid = item.get('group_id', 'default')
            groups[gid] = groups.get(gid, 0) + 1

        X = np.array(X)
        y = np.array(y)

        # Group sizes for pairwise/listwise learning
        group_sizes = list(groups.values())

        # Train/test split (80/20)
        split_idx = int(0.8 * len(X))
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        # Build group sizes for train/test
        train_groups = []
        test_groups = []
        cumsum = 0
        for g in group_sizes:
            if cumsum + g <= split_idx:
                train_groups.append(g)
            else:
                remaining_train = max(0, split_idx - cumsum)
                if remaining_train > 0:
                    train_groups.append(remaining_train)
                test_groups.append(g - remaining_train if remaining_train > 0 else g)
            cumsum += g

        if not train_groups:
            train_groups = [len(X_train)]
        if not test_groups:
            test_groups = [len(X_test)]

        # XGBoost LambdaMART parameters
        params = {
            'objective': 'rank:ndcg',
            'learning_rate': 0.1,
            'max_depth': 6,
            'n_estimators': 100,
            'eval_metric': 'ndcg@5',
        }

        # Train model
        model = xgb.XGBRanker(**params)
        model.fit(
            X_train, y_train,
            group=train_groups,
            eval_set=[(X_test, y_test)],
            eval_group=[test_groups],
            verbose=False
        )

        self.model = model
        self.is_trained = True

        # Save model
        self._save_model()

        # Calculate training metrics
        train_scores = model.predict(X_train)
        test_scores = model.predict(X_test)

        metrics = {
            'status': 'trained',
            'training_examples': len(training_data),
            'feature_count': len(FeatureExtractor.FEATURE_NAMES),
            'train_mean_score': float(np.mean(train_scores)),
            'test_mean_score': float(np.mean(test_scores)),
        }

        # Feature importance
        importance = model.feature_importances_
        feature_importance = dict(zip(FeatureExtractor.FEATURE_NAMES, importance.tolist()))
        metrics['feature_importance'] = dict(
            sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:10]
        )

        logger.info(f"Training complete: {metrics}")
        return metrics

    def collect_training_signal(self, session_data: Dict) -> List[Dict]:
        """
        Convert a user session into training examples.

        From MongoDB session logs:
        - Selected product -> label = 2 (positive)
        - Products shown but not selected -> label = 0 (negative)

        Args:
            session_data: Dict with 'query', 'constraints', 'products', 'selected_product'

        Returns:
            List of training examples
        """
        examples = []
        query = session_data.get('query', '')
        constraints = session_data.get('parsed_query', {})
        products = session_data.get('products', [])
        selected = session_data.get('selected_product')
        group_id = session_data.get('session_id', 'unknown')

        selected_title = selected.get('title', '').lower() if selected else ''

        for product in products:
            title = product.get('title', '').lower()
            if selected and title == selected_title:
                label = 2  # Confirmed selection
            else:
                label = 0  # Unselected

            examples.append({
                'product': product,
                'query': query,
                'constraints': constraints,
                'label': label,
                'group_id': group_id,
            })

        return examples

    # =========================================================================
    # Model Persistence
    # =========================================================================

    def _save_model(self):
        """Save trained model to disk."""
        try:
            os.makedirs(MODEL_DIR, exist_ok=True)
            with open(MODEL_PATH, 'wb') as f:
                pickle.dump(self.model, f)
            logger.info(f"Model saved to {MODEL_PATH}")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")

    def _load_model(self):
        """Load pre-trained model from disk."""
        try:
            if os.path.exists(MODEL_PATH):
                with open(MODEL_PATH, 'rb') as f:
                    self.model = pickle.load(f)
                self.is_trained = True
                logger.info(f"Loaded pre-trained model from {MODEL_PATH}")
        except Exception as e:
            logger.warning(f"Failed to load model: {e}")
            self.model = None
            self.is_trained = False
