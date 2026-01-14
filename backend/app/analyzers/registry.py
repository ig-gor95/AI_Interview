"""Analyzer registry for managing and discovering analyzers"""
from typing import Dict, List, Optional
from app.analyzers.base import BaseAnalyzer


class AnalyzerRegistry:
    """Registry for managing analyzers"""
    
    def __init__(self):
        self._analyzers: Dict[str, BaseAnalyzer] = {}
    
    def register(self, analyzer: BaseAnalyzer) -> None:
        """Register an analyzer"""
        if not isinstance(analyzer, BaseAnalyzer):
            raise ValueError(f"Analyzer must be instance of BaseAnalyzer, got {type(analyzer)}")
        
        if analyzer.name in self._analyzers:
            raise ValueError(f"Analyzer with name '{analyzer.name}' already registered")
        
        self._analyzers[analyzer.name] = analyzer
    
    def get(self, name: str) -> Optional[BaseAnalyzer]:
        """Get analyzer by name"""
        return self._analyzers.get(name)
    
    def get_all(self) -> Dict[str, BaseAnalyzer]:
        """Get all registered analyzers"""
        return self._analyzers.copy()
    
    def get_analyzers(self, enabled_names: Optional[List[str]] = None) -> List[BaseAnalyzer]:
        """
        Get list of analyzers by names
        
        Args:
            enabled_names: List of analyzer names to get. If None, returns all.
            
        Returns:
            List of analyzer instances
        """
        if enabled_names is None:
            return list(self._analyzers.values())
        
        analyzers = []
        for name in enabled_names:
            analyzer = self.get(name)
            if analyzer:
                analyzers.append(analyzer)
            else:
                # Log warning about missing analyzer
                print(f"Warning: Analyzer '{name}' not found in registry")
        
        return analyzers
    
    def unregister(self, name: str) -> bool:
        """Unregister an analyzer"""
        if name in self._analyzers:
            del self._analyzers[name]
            return True
        return False
    
    def clear(self) -> None:
        """Clear all registered analyzers"""
        self._analyzers.clear()

