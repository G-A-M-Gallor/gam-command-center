"use client";

import { useState, useEffect } from "react";
import { getTranslations } from "@/lib/i18n";
import { useSettings } from "@/contexts/SettingsContext";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Play,
  FileText,
  ExternalLink,
  Search,
  Plus,
  Filter,
  Clock,
  CheckCircle,
  Pause,
  Calendar,
  Tag
} from "lucide-react";

// Progress component inline
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`bg-slate-700 rounded-full overflow-hidden ${className}`}>
    <div
      className="bg-purple-500 h-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

// Types
interface Course {
  id: string;
  name: string;
  emoji: string;
  platform: string;
  language: string;
  status: 'active' | 'completed' | 'paused' | 'planned';
  drive_folder_id?: string;
  drive_folder_url?: string;
  total_lessons: number;
  completed_lessons: number;
  total_duration_minutes: number;
  source_url?: string;
  description?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  lesson_number: number;
  duration_minutes: number;
  status: 'pending' | 'downloaded' | 'transcribed' | 'summarized' | 'reviewed';
  drive_file_id?: string;
  drive_file_url?: string;
  file_format?: string;
  file_size_mb?: number;
  source_url?: string;
}

const CoursesScreen = () => {
  const { theme, language, direction } = useSettings();
  const t = getTranslations(language);
  const courseTranslations = t.courses;
  const isRtl = direction === 'rtl';

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  // Fetch courses
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lessons for selected course
  const fetchLessons = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons`);
      if (response.ok) {
        const data = await response.json();
        setLessons(data);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  // Handle course selection
  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    fetchLessons(course.id);
  };

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || course.platform === platformFilter;

    return matchesSearch && matchesStatus && matchesPlatform;
  });

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-500', icon: Play, label: courseTranslations.status.active };
      case 'completed':
        return { color: 'bg-blue-500', icon: CheckCircle, label: courseTranslations.status.completed };
      case 'paused':
        return { color: 'bg-yellow-500', icon: Pause, label: courseTranslations.status.paused };
      case 'planned':
        return { color: 'bg-gray-500', icon: Calendar, label: courseTranslations.status.planned };
      default:
        return { color: 'bg-gray-500', icon: BookOpen, label: status };
    }
  };

  // Get platform badge color
  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'udemy': return 'bg-purple-500';
      case 'youtube': return 'bg-red-500';
      case 'coursera': return 'bg-blue-500';
      case 'vimeo': return 'bg-cyan-500';
      case 'local': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `${mins}m`;
  };

  // Calculate progress percentage
  const getProgress = (course: Course) => {
    return course.total_lessons > 0 ? (course.completed_lessons / course.total_lessons) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            {courseTranslations.title}
          </h1>
          <p className="text-slate-400 mt-1">{courseTranslations.subtitle}</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 me-2" />
          {courseTranslations.actions.addCourse}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={courseTranslations.filters.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10 bg-slate-800 border-slate-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100"
        >
          <option value="all">{courseTranslations.filters.allStatuses}</option>
          <option value="active">{courseTranslations.status.active}</option>
          <option value="completed">{courseTranslations.status.completed}</option>
          <option value="paused">{courseTranslations.status.paused}</option>
          <option value="planned">{courseTranslations.status.planned}</option>
        </select>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-100"
        >
          <option value="all">{courseTranslations.filters.allPlatforms}</option>
          <option value="udemy">Udemy</option>
          <option value="youtube">YouTube</option>
          <option value="coursera">Coursera</option>
          <option value="vimeo">Vimeo</option>
          <option value="local">{courseTranslations.platforms.local}</option>
        </select>
      </div>

      {selectedCourse ? (
        /* Lesson View */
        <div className="space-y-6">
          {/* Back Button & Course Info */}
          <div className="flex items-center gap-4">
            <Button
              intent="outline"
              onClick={() => setSelectedCourse(null)}
              className="border-slate-700"
            >
              ← {courseTranslations.actions.backToCourses}
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedCourse.emoji}</span>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">{selectedCourse.name}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>{selectedCourse.completed_lessons}/{selectedCourse.total_lessons} שיעורים</span>
                  <span>•</span>
                  <span>{formatDuration(selectedCourse.total_duration_minutes)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">{courseTranslations.progress.completed}</span>
              <span className="text-slate-400">{Math.round(getProgress(selectedCourse))}%</span>
            </div>
            <Progress value={getProgress(selectedCourse)} className="h-2" />
          </div>

          {/* Lessons List */}
          <div className="grid gap-3">
            {lessons.map((lesson) => {
              const statusInfo = getStatusInfo(lesson.status);
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={lesson.id} className="bg-slate-800 border-slate-700">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-sm font-medium">
                          {lesson.lesson_number}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-100">{lesson.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(lesson.duration_minutes)}</span>
                            {lesson.file_format && (
                              <>
                                <span>•</span>
                                <span className="uppercase">{lesson.file_format}</span>
                              </>
                            )}
                            {lesson.file_size_mb && (
                              <>
                                <span>•</span>
                                <span>{lesson.file_size_mb.toFixed(1)} MB</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                        <Badge intent="secondary" className="text-xs">
                          {statusInfo.label}
                        </Badge>
                        {lesson.drive_file_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(lesson.drive_file_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        /* Courses Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const statusInfo = getStatusInfo(course.status);
            const StatusIcon = statusInfo.icon;
            const progress = getProgress(course);

            return (
              <Card
                key={course.id}
                className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-colors cursor-pointer"
                onClick={() => handleCourseSelect(course)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{course.emoji}</span>
                      <div className="flex-1">
                        <CardTitle className="text-slate-100 text-lg line-clamp-2">
                          {course.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className={`${getPlatformColor(course.platform)} text-white text-xs`}
                          >
                            {course.platform}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                            <span className="text-xs text-slate-400">{statusInfo.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <div className="pt-0">
                  {course.description && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  {/* Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">
                        {course.completed_lessons}/{course.total_lessons} שיעורים
                      </span>
                      <span className="text-slate-400">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(course.total_duration_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>{course.total_lessons}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {course.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} intent="outline" className="text-xs border-slate-600">
                          <Tag className="h-2 w-2 me-1" />
                          {tag}
                        </Badge>
                      ))}
                      {course.tags.length > 3 && (
                        <Badge intent="outline" className="text-xs border-slate-600">
                          +{course.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCourseSelect(course);
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Play className="h-3 w-3 me-1" />
                      {courseTranslations.actions.openCourse}
                    </Button>
                    {course.drive_folder_url && (
                      <Button
                        size="sm"
                        intent="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(course.drive_folder_url, '_blank');
                        }}
                        className="border-slate-600"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {filteredCourses.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            {courseTranslations.messages.noCourses}
          </h3>
          <p className="text-slate-500 mb-4">
            {searchQuery ? courseTranslations.messages.noResults : courseTranslations.messages.addFirstCourse}
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 me-2" />
            {courseTranslations.actions.addCourse}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CoursesScreen;