"""Core application initialization"""
from app.analyzers import create_analyzer_registry, AnalyzerRegistry
from app.services.evaluation_service import EvaluationService
from app.services.openai_service import OpenAIService
from app.config import settings

# Initialize OpenAI service
openai_service = OpenAIService()

# Create analyzer registry
analyzer_registry: AnalyzerRegistry = create_analyzer_registry(openai_client=openai_service)

# Create evaluation service
evaluation_service = EvaluationService(analyzer_registry)

