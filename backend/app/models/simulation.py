"""Simulation models - Customer simulation scenarios"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


class SimulationScenario(Base):
    """Simulation scenario - Customer simulation if used"""
    __tablename__ = "simulation_scenarios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), unique=True, nullable=False, index=True)
    scenario_type = Column(String(255), nullable=False)  # тип сценария
    scenario_description = Column(Text, nullable=False)
    client_role = Column(String(255), nullable=False)  # роль клиента
    client_behavior = Column(Text, nullable=True)  # описание поведения
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    interview = relationship("Interview", back_populates="simulation_scenario")
    dialog = relationship("SimulationDialog", back_populates="scenario", cascade="all, delete-orphan", order_by="SimulationDialog.order_index")
    
    def __repr__(self):
        return f"<SimulationScenario(id={self.id}, type={self.scenario_type})>"


class SimulationDialog(Base):
    """Simulation dialog messages"""
    __tablename__ = "simulation_dialog"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_id = Column(UUID(as_uuid=True), ForeignKey("simulation_scenarios.id"), nullable=False, index=True)
    role = Column(String(10), nullable=False)  # 'ai' or 'user'
    message_text = Column(Text, nullable=False)
    tone = Column(String(50), nullable=True)  # aggressive, neutral, friendly
    order_index = Column(Integer, nullable=False, default=0)
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    scenario = relationship("SimulationScenario", back_populates="dialog")
    
    def __repr__(self):
        return f"<SimulationDialog(id={self.id}, role={self.role}, order={self.order_index})>"

