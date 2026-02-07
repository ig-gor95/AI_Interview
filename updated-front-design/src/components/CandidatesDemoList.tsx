import { ArrowLeft, User, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { useAtom } from 'jotai';
import { languageAtom, useTranslation } from '@/lib/i18n';

interface Props {
  onSelectCandidate: (candidateId: string) => void;
  onBack: () => void;
}

export function CandidatesDemoList({ onSelectCandidate, onBack }: Props) {
  const [language] = useAtom(languageAtom);
  const t = useTranslation(language);

  const demoCandidates = [
    {
      id: 'ready-1',
      name: t.candidatesDemoList.candidate1Name,
      position: t.candidatesDemoList.candidate1Position,
      interviewDate: t.candidatesDemoList.candidate1Date,
      status: 'ready',
      summary: t.candidatesDemoList.candidate1Summary,
      strengths: [
        t.candidatesDemoList.candidate1Strength1,
        t.candidatesDemoList.candidate1Strength2,
        t.candidatesDemoList.candidate1Strength3
      ],
      photo: '👩‍🦰'
    },
    {
      id: 'not-ready-1',
      name: t.candidatesDemoList.candidate2Name,
      position: t.candidatesDemoList.candidate2Position,
      interviewDate: t.candidatesDemoList.candidate2Date,
      status: 'not-ready',
      summary: t.candidatesDemoList.candidate2Summary,
      concerns: [
        t.candidatesDemoList.candidate2Concern1,
        t.candidatesDemoList.candidate2Concern2,
        t.candidatesDemoList.candidate2Concern3
      ],
      photo: '👨'
    },
    {
      id: 'not-ready-2',
      name: t.candidatesDemoList.candidate3Name,
      position: t.candidatesDemoList.candidate3Position,
      interviewDate: t.candidatesDemoList.candidate3Date,
      status: 'not-ready',
      summary: t.candidatesDemoList.candidate3Summary,
      concerns: [
        t.candidatesDemoList.candidate3Concern1,
        t.candidatesDemoList.candidate3Concern2,
        t.candidatesDemoList.candidate3Concern3
      ],
      photo: '👩'
    },
    {
      id: 'not-ready-3',
      name: t.candidatesDemoList.candidate4Name,
      position: t.candidatesDemoList.candidate4Position,
      interviewDate: t.candidatesDemoList.candidate4Date,
      status: 'not-ready',
      summary: t.candidatesDemoList.candidate4Summary,
      concerns: [
        t.candidatesDemoList.candidate4Concern1,
        t.candidatesDemoList.candidate4Concern2,
        t.candidatesDemoList.candidate4Concern3
      ],
      photo: '👨‍💼'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t.candidatesDemoList.backButton}</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.candidatesDemoList.title}</h1>
            <p className="text-gray-600">
              {t.candidatesDemoList.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6">
          {demoCandidates.map((candidate) => (
            <button
              key={candidate.id}
              onClick={() => onSelectCandidate(candidate.id)}
              className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 p-6 text-left group"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
                  {candidate.photo}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-3">
                        {candidate.name}
                        {candidate.status === 'ready' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
                            <CheckCircle className="w-4 h-4" />
                            {t.candidatesDemoList.readyStatus}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 text-sm font-medium rounded-full border border-orange-200">
                            <XCircle className="w-4 h-4" />
                            {t.candidatesDemoList.notReadyStatus}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{candidate.position}</span>
                        <span>•</span>
                        <span>{candidate.interviewDate}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>

                  <p className="text-gray-600 mb-4">{candidate.summary}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {candidate.status === 'ready' && candidate.strengths && (
                      candidate.strengths.map((strength, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200"
                        >
                          ✓ {strength}
                        </span>
                      ))
                    )}
                    {candidate.status === 'not-ready' && candidate.concerns && (
                      candidate.concerns.map((concern, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full border border-orange-200"
                        >
                          ! {concern}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Info Block */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.candidatesDemoList.infoTitle}</h3>
          <p className="text-gray-700">
            {t.candidatesDemoList.infoDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
