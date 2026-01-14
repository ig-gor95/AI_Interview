"""Evaluation service coordinating all analyzers"""
import asyncio
from typing import List, Dict, Any, Optional
from app.analyzers.registry import AnalyzerRegistry
from app.analyzers.base import AnalysisResult
from app.config import settings


class EvaluationService:
    """Service for coordinating interview evaluation using multiple analyzers"""
    
    def __init__(self, analyzer_registry: AnalyzerRegistry):
        self.registry = analyzer_registry
        # Default weights - can be overridden from settings
        self.weights = {
            "pronunciation_alphabet": settings.pronunciation_weight,
            "clarity_analyzer": settings.clarity_weight,
            "gpt_content_analyzer": settings.gpt_content_weight,
            "stress_handling_analyzer": settings.stress_handling_weight,
        }
    
    async def evaluate_interview(
        self,
        interview_id: str,
        audio_data: Optional[bytes],
        transcript: List[Dict[str, Any]],
        metadata: Dict[str, Any],
        enabled_analyzers: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate interview using all enabled analyzers
        
        Args:
            interview_id: ID of the interview
            audio_data: Raw audio bytes
            transcript: Interview transcript
            metadata: Additional metadata
            enabled_analyzers: List of analyzer names to use (uses config if None)
            
        Returns:
            Aggregated evaluation results
        """
        # Get enabled analyzers
        if enabled_analyzers is None:
            enabled_analyzers = settings.enabled_analyzers_list
        
        analyzers = self.registry.get_analyzers(enabled_analyzers)
        
        if not analyzers:
            raise ValueError("No analyzers available for evaluation")
        
        # Run all analyzers in parallel
        tasks = [
            analyzer.analyze(audio_data, transcript, metadata)
            for analyzer in analyzers
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and log them
        valid_results = []
        errors = []
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                errors.append({
                    "analyzer": analyzers[i].name,
                    "error": str(result)
                })
            else:
                valid_results.append(result)
        
        # Aggregate results
        aggregated = self._aggregate_results(valid_results)
        
        return {
            "interview_id": interview_id,
            "overall_score": aggregated["overall_score"],
            "analyzer_results": [
                {
                    "name": r.analyzer_name,
                    "score": r.score,
                    "details": r.details,
                    "recommendations": r.recommendations,
                }
                for r in valid_results
            ],
            "aggregated_details": aggregated["details"],
            "all_recommendations": aggregated["recommendations"],
            "errors": errors if errors else None,
        }
    
    def _aggregate_results(self, results: List[AnalysisResult]) -> Dict[str, Any]:
        """Aggregate multiple analyzer results into final score"""
        if not results:
            return {
                "overall_score": 0.0,
                "details": {},
                "recommendations": [],
            }
        
        # Calculate weighted average
        total_weight = 0.0
        weighted_sum = 0.0
        
        for result in results:
            weight = self.weights.get(result.analyzer_name, 1.0)
            weighted_sum += result.score * weight
            total_weight += weight
        
        overall_score = weighted_sum / total_weight if total_weight > 0 else 0.0
        
        # Collect all recommendations
        all_recommendations = []
        for result in results:
            all_recommendations.extend(result.recommendations)
        
        # Aggregate details
        aggregated_details = {
            "analyzers_used": len(results),
            "analyzer_names": [r.analyzer_name for r in results],
        }
        
        return {
            "overall_score": round(overall_score, 2),
            "details": aggregated_details,
            "recommendations": list(set(all_recommendations)),  # Remove duplicates
        }

