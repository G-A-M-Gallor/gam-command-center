'use client';

import { useState } from 'react';
import { Search, Loader2, BookOpen, _Star } from 'lucide-react';

interface SearchResult {
  id: string;
  course_id: string;
  content: string;
  similarity: number;
  course: {
    name: string;
    description: string;
    platform: string;
    language: string;
    status: string;
    tags: string[] | null;
  } | null;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

export default function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/semantic/search', {
        method: 'POST',
        _headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          max_results: 8,
          threshold: 0.2
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      setSearchTime(Date.now() - startTime);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return 'text-emerald-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-amber-600';
    return 'text-gray-500';
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 0.8) return 'מעולה';
    if (score >= 0.6) return 'טוב';
    if (score >= 0.4) return 'רלוונטי';
    return 'נמוך';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Search Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-200 mb-2">
          🔍 חיפוש סמנטי בקורסים
        </h1>
        <p className="text-slate-400">
          חפש בתוכן כל הקורסים באמצעות AI - שאלות, מושגים, נושאים
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="לדוגמה: איך לבנות אפליקציה מובילה..."
            className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'חפש'}
          </button>
        </div>
      </form>

      {/* Search Stats */}
      {searchTime && results.length > 0 && (
        <div className="text-sm text-slate-400 mb-6">
          נמצאו {results.length} תוצאות תוך {searchTime}ms
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={result.id}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-purple-500 transition-colors"
          >
            {/* Course Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-semibold text-slate-200">
                    {result.course?.name || 'קורס ללא שם'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{result.course?.platform}</span>
                    <span>•</span>
                    <span>{result.course?.language}</span>
                  </div>
                </div>
              </div>

              {/* Similarity Score */}
              <div className="flex items-center gap-2">
                <_Star className={`w-4 h-4 ${getSimilarityColor(result.similarity)}`} />
                <span className={`text-sm font-medium ${getSimilarityColor(result.similarity)}`}>
                  {getSimilarityLabel(result.similarity)} ({(result.similarity * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Content Preview */}
            <div className="bg-slate-900 p-4 rounded-lg mb-4">
              <p className="text-slate-300 leading-relaxed">
                {result.content.length > 300
                  ? result.content.substring(0, 300) + '...'
                  : result.content
                }
              </p>
            </div>

            {/* Tags */}
            {result.course?.tags && result.course.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.course.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded-md text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-2">🔍</div>
          <p className="text-slate-400">לא נמצאו תוצאות עבור "{query}"</p>
          <p className="text-sm text-slate-500 mt-1">נסה לנסח אחרת או השתמש במילות מפתח כלליות יותר</p>
        </div>
      )}

      {/* Suggestions */}
      {!query && !loading && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="font-medium text-slate-200 mb-3">💡 הצעות לחיפוש:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'איך ליצור אפליקציה',
              'עקרונות עיצוב UI',
              'בסיסי תכנות',
              'ניהול פרויקטים',
              'שיווק דיגיטלי',
              'בינה מלאכותית'
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setQuery(suggestion)}
                className="text-left px-3 py-2 bg-slate-900 rounded-lg hover:bg-slate-700 text-slate-300 text-sm transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}