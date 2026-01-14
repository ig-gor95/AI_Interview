"""Evaluation Pydantic schemas"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class EvaluationObservation(BaseModel):
    """Evaluation observation schema"""
    category: str
    observation_text: str
    
    class Config:
        from_attributes = True


class EvaluationStrength(BaseModel):
    """Evaluation strength schema"""
    strength_text: str
    
    class Config:
        from_attributes = True


class EvaluationImprovement(BaseModel):
    """Evaluation improvement schema"""
    improvement_text: str
    
    class Config:
        from_attributes = True


class EvaluationKeyPhrase(BaseModel):
    """Evaluation key phrase schema"""
    phrase_type: str  # 'effective' or 'to_improve'
    phrase_text: str
    note: Optional[str] = None
    
    class Config:
        from_attributes = True


class EvaluationResponse(BaseModel):
    """Full evaluation response schema"""
    id: str
    interview_id: str
    overall_score: int
    summary: Optional[str] = None
    readiness: Optional[str] = None
    recommendation: Optional[str] = None
    observations: List[EvaluationObservation] = []
    strengths: List[EvaluationStrength] = []
    improvements: List[EvaluationImprovement] = []
    key_phrases: List[EvaluationKeyPhrase] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AnalyzerResult(BaseModel):
    """Individual analyzer result"""
    analyzer_name: str
    score: float
    details: Dict[str, Any]
    recommendations: List[str]


class EvaluationResultResponse(BaseModel):
    """Evaluation result with analyzer breakdown"""
    interview_id: str
    overall_score: float
    analyzer_results: List[AnalyzerResult]
    aggregated_details: Dict[str, Any]
    all_recommendations: List[str]
    errors: Optional[List[Dict[str, str]]] = None

