import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Copy, Check, ExternalLink, Calendar, User, CheckCircle, Circle, Trash2, Download } from 'lucide-react';
import { Session, InterviewLink } from '@/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { interviewsAPI } from '@/lib/api';

interface Props {
  session: Session;
  onBack: () => void;
}

export function InterviewLinksManager({ session, onBack }: Props) {
  const [links, setLinks] = useState<InterviewLink[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingCount, setGeneratingCount] = useState(1);

  useEffect(() => {
    loadLinks();
  }, [session.id]);

  const loadLinks = async () => {
    try {
      console.log('Loading links for interview ID:', session.id);
      console.log('Session object:', session);
      
      // Validate that ID is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(session.id)) {
        const errorMsg = `Invalid interview ID format: ${session.id}. Expected UUID format. Please create a new interview or refresh the page.`;
        console.error(errorMsg);
        alert(errorMsg);
        return; // Don't proceed with invalid ID
      }
      
      const fetchedLinks = await interviewsAPI.getLinks(session.id);
      // Transform API response to match InterviewLink type
      setLinks(fetchedLinks.map(link => ({
        id: link.id,
        interviewId: link.interviewId,
        token: link.token,
        url: link.url,
        isUsed: link.isUsed,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt || undefined,
        sessionId: link.sessionId || undefined,
        usedAt: undefined, // API doesn't return usedAt, we can check isUsed
        candidateName: undefined, // TODO: get from session if needed
        candidateEmail: undefined, // TODO: get from session if needed
        notes: undefined
      })));
    } catch (error) {
      console.error('Ошибка при загрузке ссылок:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при загрузке ссылок');
    }
  };

  const handleGenerateLinks = async () => {
    const count = Math.min(Math.max(1, generatingCount), 100);
    
    try {
      // Create links one by one (API creates one link at a time)
      for (let i = 0; i < count; i++) {
        await interviewsAPI.createLink(session.id);
      }
      
      await loadLinks();
      setGeneratingCount(1);
    } catch (error) {
      console.error('Ошибка при создании ссылок:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при создании ссылок');
    }
  };

  const handleCopyLink = (link: InterviewLink) => {
    const fullUrl = `${window.location.origin}${link.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteLink = async (linkId: string) => {
    if (confirm('Удалить эту ссылку?')) {
      try {
        await interviewsAPI.deleteLink(session.id, linkId);
        await loadLinks();
      } catch (error) {
        console.error('Ошибка при удалении ссылки:', error);
        alert(error instanceof Error ? error.message : 'Ошибка при удалении ссылки');
      }
    }
  };

  const handleExportLinks = () => {
    const csv = [
      ['URL', 'Создана', 'Использована', 'Кандидат', 'Email', 'Заметки'].join(','),
      ...links.map(link => [
        `${window.location.origin}${link.url}`,
        new Date(link.createdAt).toLocaleDateString('ru'),
        link.usedAt ? new Date(link.usedAt).toLocaleDateString('ru') : '-',
        link.candidateName || '-',
        link.candidateEmail || '-',
        link.notes || '-'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const linkEl = document.createElement('a');
    linkEl.href = url;
    linkEl.download = `interview-${session.id}-links.csv`;
    linkEl.click();
    URL.revokeObjectURL(url);
  };

  const usedLinks = links.filter(l => l.isUsed);
  const unusedLinks = links.filter(l => !l.isUsed);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="mt-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {session.params.position || session.params.topic}
              </h2>
              {session.params.company && (
                <p className="text-sm text-gray-600 mt-1">{session.params.company}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">Управление ссылками для кандидатов</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">Всего ссылок</p>
                  <p className="text-2xl font-bold text-blue-900">{links.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">Использовано</p>
                  <p className="text-2xl font-bold text-green-900">{usedLinks.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                  <Circle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">Доступно</p>
                  <p className="text-2xl font-bold text-gray-900">{unusedLinks.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Генерация ссылок</h3>
            <p className="text-sm text-gray-600 mb-4">
              Каждая ссылка уникальна и может быть использована только один раз. Создайте столько ссылок, сколько кандидатов вы планируете пригласить.
            </p>
            <div className="flex gap-3">
              <Input
                type="number"
                min="1"
                max="100"
                value={generatingCount}
                onChange={(e) => setGeneratingCount(parseInt(e.target.value) || 1)}
                className="w-32"
                placeholder="Кол-во"
              />
              <Button
                onClick={handleGenerateLinks}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Сгенерировать {generatingCount > 1 ? `(${generatingCount})` : ''}
              </Button>
              {links.length > 0 && (
                <Button
                  onClick={handleExportLinks}
                  variant="outline"
                  className="ml-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт CSV
                </Button>
              )}
            </div>
          </div>

          {/* Links List */}
          {links.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет ссылок</h3>
              <p className="text-gray-600 mb-6">
                Сгенерируйте уникальные ссылки для отправки кандидатам
              </p>
              <Button
                onClick={() => {
                  setGeneratingCount(5);
                  handleGenerateLinks();
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать 5 ссылок
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ссылка
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Создана
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Использована
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Кандидат
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {links.map((link) => (
                      <tr key={link.id} className={link.isUsed ? 'bg-gray-50' : 'bg-white hover:bg-blue-50/30'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {link.isUsed ? (
                            <span className="flex items-center gap-2 text-green-700">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs font-medium">Использована</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-gray-500">
                              <Circle className="w-4 h-4" />
                              <span className="text-xs font-medium">Доступна</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 font-mono">
                              ...{link.url.substring(link.url.length - 12)}
                            </code>
                            <Button
                              onClick={() => handleCopyLink(link)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                            >
                              {copiedId === link.id ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(link.createdAt).toLocaleDateString('ru')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {link.usedAt ? (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(link.usedAt).toLocaleDateString('ru')}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {link.candidateName ? (
                            <div className="flex items-center gap-1.5 text-sm text-gray-900">
                              <User className="w-3.5 h-3.5" />
                              {link.candidateName}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {!link.isUsed && (
                            <Button
                              onClick={() => handleDeleteLink(link.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
