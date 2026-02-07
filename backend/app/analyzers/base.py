"""Base analyzer class and interfaces"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Any, Optional


@dataclass
class AnalysisResult:
    """Result of analyzer execution"""
    analyzer_name: str
    score: float  # 0-100
    details: Dict[str, Any]  # Detailed analysis results
    recommendations: List[str]  # Recommendations for improvement
    metadata: Dict[str, Any]  # Additional metadata
    
    def __post_init__(self):
        """Validate score range"""
        if not 0 <= self.score <= 100:
            raise ValueError(f"Score must be between 0 and 100, got {self.score}")


class BaseAnalyzer(ABC):
    """Base class for all analyzers"""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Unique name of the analyzer"""
        pass
    
    @property
    @abstractmethod
    def version(self) -> str:
        """Version of the analyzer"""
        pass
    
    @property
    def description(self) -> str:
        """Description of what this analyzer does"""
        return ""
    
    @abstractmethod
    async def analyze(
        self,
        audio_data: Optional[bytes],
        transcript: List[Dict[str, Any]],
        metadata: Dict[str, Any]
    ) -> AnalysisResult:
        """
        Main analysis method
        
        Args:
            audio_data: Raw audio bytes (optional)
            transcript: List of transcript messages with role, message, timestamp
            metadata: Additional metadata about the interview
            
        Returns:
            AnalysisResult with score, details, and recommendations
        """
        pass
    
    def is_enabled(self, enabled_analyzers: List[str]) -> bool:
        """Check if analyzer is enabled in configuration"""
        return self.name in enabled_analyzers

