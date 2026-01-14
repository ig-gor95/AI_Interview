"""GPT-4 based content analyzer"""
from typing import Dict, List, Any, Optional
from app.analyzers.base import BaseAnalyzer, AnalysisResult
from app.services.openai_service import OpenAIService


class GPTContentAnalyzer(BaseAnalyzer):
    """Analyzer using GPT-4 for content analysis"""
    
    def __init__(self, openai_client: Optional[OpenAIService] = None):
        self.openai_service = openai_client
    
    @property
    def name(self) -> str:
        return "gpt_content_analyzer"
    
    @property
    def version(self) -> str:
        return "1.0.0"
    
    @property
    def description(self) -> str:
        return "Analyzes interview content using GPT-4"
    
    async def analyze(
        self,
        audio_data: Optional[bytes],
        transcript: List[Dict[str, Any]],
        metadata: Dict[str, Any]
    ) -> AnalysisResult:
        """
        Analyze interview content using GPT-4
        
        Uses OpenAI service to analyze transcript and extract insights
        """
        if not self.openai_service:
            # Fallback if OpenAI service not available
            return AnalysisResult(
                analyzer_name=self.name,
                score=0.0,
                details={"error": "OpenAI service not available"},
                recommendations=["OpenAI service configuration required"],
                metadata={}
            )
        
        try:
            # Get evaluation criteria from metadata
            evaluation_criteria = metadata.get("evaluation_criteria", [])
            
            # Build session params for analysis
            session_params = {
                "position": metadata.get("position", ""),
                "company": metadata.get("company", ""),
                "evaluation_criteria": evaluation_criteria,
            }
            
            # Analyze transcript using OpenAI service
            analysis_result = await self.openai_service.analyze_transcript(
                transcript=transcript,
                session_params=session_params,
                evaluation_criteria=evaluation_criteria
            )
            
            # Extract scores and details
            overall_score = analysis_result.get("score", 0)
            
            # Build recommendations from analysis
            recommendations = []
            improvements = analysis_result.get("improvements", [])
            if improvements:
                recommendations.extend(improvements[:3])  # Top 3 improvements
            
            # Add key phrase recommendations
            key_phrases = analysis_result.get("keyPhrases", {})
            to_improve = key_phrases.get("toImprove", [])
            if to_improve:
                for phrase_info in to_improve[:2]:  # Top 2 phrases to improve
                    if isinstance(phrase_info, dict) and "note" in phrase_info:
                        recommendations.append(phrase_info["note"])
            
            return AnalysisResult(
                analyzer_name=self.name,
                score=float(overall_score),
                details={
                    "content_score": overall_score / 100,
                    "summary": analysis_result.get("summary", ""),
                    "readiness": analysis_result.get("readiness", ""),
                    "observations": analysis_result.get("observations", {}),
                    "strengths": analysis_result.get("strengths", []),
                    "total_questions_answered": len([m for m in transcript if m.get("role") == "user"]),
                    "evaluation_criteria": evaluation_criteria,
                    "full_analysis": analysis_result,  # Include full analysis for detailed evaluation
                },
                recommendations=recommendations if recommendations else [
                    "Review interview transcript for detailed insights"
                ],
                metadata={
                    "model_used": "gpt-4",
                    "analyzer_version": self.version,
                    "recommendation": analysis_result.get("recommendation", ""),
                }
            )
            
        except Exception as e:
            # Error handling - return fallback result
            return AnalysisResult(
                analyzer_name=self.name,
                score=0.0,
                details={
                    "error": str(e),
                    "transcript_length": len(transcript),
                },
                recommendations=["Error during analysis - manual review recommended"],
                metadata={
                    "error_type": type(e).__name__,
                    "analyzer_version": self.version,
                }
            )

