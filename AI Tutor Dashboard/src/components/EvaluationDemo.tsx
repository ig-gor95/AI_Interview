import { CandidateEvaluation } from './CandidateEvaluation';
import { Session } from '../types';

interface Props {
  onBack: () => void;
}

export function EvaluationDemo({ onBack }: Props) {
  // Mock session data
  const mockSession: Session = {
    id: 'demo-eval-1',
    title: 'Интервью для официанта',
    description: 'Оценка готовности к работе с гостями',
    organizerId: '1',
    createdAt: new Date('2026-01-15'),
    isActive: true,
    questionsText: '',
    scenarioDescription: ''
  };

  return (
    <CandidateEvaluation
      session={mockSession}
      user={null}
      onComplete={onBack}
      onBack={onBack}
    />
  );
}
