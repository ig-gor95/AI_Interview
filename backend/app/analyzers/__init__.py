"""Analyzer modules for speech and content analysis"""
from app.analyzers.base import BaseAnalyzer, AnalysisResult
from app.analyzers.registry import AnalyzerRegistry
from app.analyzers.speech.pronunciation import PronunciationAnalyzer
from app.analyzers.speech.clarity import ClarityAnalyzer
from app.analyzers.content.gpt_analyzer import GPTContentAnalyzer
from typing import Optional
from app.services.openai_service import AIService


def create_analyzer_registry(openai_client: Optional[AIService] = None) -> AnalyzerRegistry:
    """Create and populate analyzer registry with all analyzers"""
    registry = AnalyzerRegistry()
    
    # Register speech analyzers
    registry.register(PronunciationAnalyzer())
    registry.register(ClarityAnalyzer())
    
    # Register content analyzers
    registry.register(GPTContentAnalyzer(openai_client=openai_client))
    
    # Future: register behavior analyzers
    # registry.register(StressHandlingAnalyzer())
    
    return registry


__all__ = [
    "BaseAnalyzer",
    "AnalysisResult",
    "AnalyzerRegistry",
    "create_analyzer_registry",
    "PronunciationAnalyzer",
    "ClarityAnalyzer",
    "GPTContentAnalyzer",
]
