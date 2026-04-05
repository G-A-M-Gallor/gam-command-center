'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TeamMember {
  id: string;
  name: string;
  display_name: string;
  position: string;
  jersey_number: number;
  team_level: number;
  department: string;
  primary_skills: string[];
  secondary_skills: string[];
  personality_traits: any;
  work_preferences: any;
  football_position: string;
  status: string;
  current_projects: string[];
  workload_percentage: number;
  team_rating: number;
  reports_to?: string;
}

export default function TechTeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null);

  useEffect(() => {
    checkDeploymentAndLoadTeam();
  }, []);

  const checkDeploymentAndLoadTeam = async () => {
    try {
      // Check deployment status first
      const response = await fetch('/api/check-tech-team-deployment');
      const status = await response.json();
      setDeploymentStatus(status);

      if (status.deployment_status?.tables_exist) {
        // Load team members if tables exist
        const { data, error } = await supabase
          .from('vb_tech_team')
          .select('*')
          .order('team_level')
          .order('jersey_number');

        if (error) throw error;
        setTeamMembers(data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">טוען את הצוות הטכני...</p>
      </div>
    );
  }

  if (error || !deploymentStatus?.deployment_status?.tables_exist) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                הצוות הווירטואלי טרם נפרס
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>טבלאות הצוות הטכני טרם נוצרו במסד הנתונים.</p>
                <p className="mt-1">
                  להפעלה: העלה את המיגרציה מהקובץ:{' '}
                  <code className="bg-yellow-100 px-1 rounded">
                    supabase/migrations/20260403212659_virtual_tech_team_deployment.sql
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">הצוות הווירטואלי - ברצלונה Style</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>🎯 CTO:</strong> Scott (קפטן הקבוצה)</p>
            <p><strong>⚛️ Frontend Lead:</strong> Messi + Pedri, Gavi, Piqué</p>
            <p><strong>🔧 Backend Lead:</strong> Xavi + Iniesta, Busquets, Neymar</p>
            <p><strong>🥅 DevOps Lead:</strong> Ter Stegen (שוער מוכשר)</p>
            <p><strong>🧠 AI/ML Lead:</strong> Puyol (מגן אמיתי)</p>
          </div>
        </div>
      </div>
    );
  }

  const groupedTeam = teamMembers.reduce((groups, member) => {
    const level = member.team_level;
    if (!groups[level]) groups[level] = [];
    groups[level].push(member);
    return groups;
  }, {} as Record<number, TeamMember[]>);

  const getPositionEmoji = (position: string) => {
    if (position.includes('cto')) return '👑';
    if (position.includes('frontend')) return '⚛️';
    if (position.includes('backend')) return '🔧';
    if (position.includes('devops')) return '🥅';
    if (position.includes('ai_ml')) return '🧠';
    return '👤';
  };

  const getFootballEmoji = (position: string) => {
    switch (position) {
      case 'goalkeeper': return '🥅';
      case 'defender': return '🛡️';
      case 'midfielder': return '⚡';
      case 'forward': return '⚽';
      default: return '👤';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏟️ הצוות הטכני הווירטואלי
        </h1>
        <p className="text-gray-600">
          צוות הפיתוח שלנו בסגנון FC Barcelona - כל חבר צוות עם כישורים ואישיות ייחודיים
        </p>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">{teamMembers.length}</div>
          <div className="text-sm text-blue-700">חברי צוות</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">
            {teamMembers.filter(m => m.status === 'active').length}
          </div>
          <div className="text-sm text-green-700">פעילים</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900">
            {Math.round(teamMembers.reduce((sum, m) => sum + (m.team_rating || 0), 0) / teamMembers.length * 10) / 10}
          </div>
          <div className="text-sm text-purple-700">דירוג ממוצע</div>
        </div>
      </div>

      {/* Team Hierarchy */}
      {Object.entries(groupedTeam)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([level, members]) => (
          <div key={level} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {level === '0' && '👑 הנהלה עליונה'}
              {level === '1' && '🎯 ראשי צוותים'}
              {level === '2' && '💻 מפתחים'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">
                        {getPositionEmoji(member.position)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{member.display_name}</h3>
                        <p className="text-sm text-gray-500">#{member.jersey_number}</p>
                      </div>
                    </div>
                    <div className="text-2xl">
                      {getFootballEmoji(member.football_position)}
                    </div>
                  </div>

                  {/* Status & Workload */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : member.status === 'busy'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status === 'active' ? 'פעיל' : member.status === 'busy' ? 'עסוק' : 'לא זמין'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {member.workload_percentage}% עומס
                    </span>
                  </div>

                  {/* Skills */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">כישורים עיקריים:</h4>
                    <div className="flex flex-wrap gap-1">
                      {member.primary_skills?.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {member.primary_skills?.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{member.primary_skills.length - 3} נוספים
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">דירוג:</span>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {member.team_rating?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-yellow-400 ml-1">⭐</span>
                    </div>
                  </div>

                  {/* Projects */}
                  {member.current_projects?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">פרויקטים נוכחיים:</h4>
                      <p className="text-xs text-gray-600">
                        {member.current_projects.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      {/* Integration Note */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">🤖 אינטגרציה עם Virtual Office</h3>
        <p className="text-gray-600 mb-4">
          הצוות הטכני מתחבר למערכת Virtual Office - כל חבר צוות יכול לקבל משימות ולדווח על התקדמות דרך הממשק הווירטואלי.
        </p>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• <strong>Scout</strong> - מנתב בקשות לחברי הצוות הרלוונטיים</p>
          <p>• <strong>ניהול משימות</strong> - הקצאת טסקים דרך vb_tech_assignments</p>
          <p>• <strong>מעקב ביצועים</strong> - דירוג ומטריקות לכל חבר צוות</p>
          <p>• <strong>היררכיה חכמה</strong> - ניתוב בקשות לפי תחום מומחיות</p>
        </div>
      </div>
    </div>
  );
}