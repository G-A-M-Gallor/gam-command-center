"use client";

import { useState, useEffect } from "react";
import { _getTranslations } from "@/lib/i18n";
import { useSettings } from "@/contexts/SettingsContext";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { GoogleDriveConnection } from "./GoogleDriveConnection";
import {
  BookOpen,
  Play,
  FileText,
  _ExternalLink,
  Search,
  _Plus,
  Filter,
  _Clock,
  CheckCircle,
  Pause,
  Calendar,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle
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
  const { language } = useSettings();
  const _t = getTranslations(language);
  const courseTranslations = t.courses;
  const isRtl = language === 'he'; // Hebrew is RTL

  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  // Add Course Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    emoji: '📚',
    platform: 'udemy',
    language: 'he',
    status: 'planned',
    description: '',
    source_url: '',
    tags: ''
  });

  // Edit Course State
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Course State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Google Drive State
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);

  // Constants
  const POPUP_FEATURES = 'width=500,height=600,scrollbars=yes,resizable=yes';

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

  // Handle form submission
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

      const response = await fetch('/api/courses', {
        method: 'POST',
        _headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray
        }),
      });

      if (response.ok) {
        const newCourse = await response.json();
        setCourses(prev => [newCourse, ...prev]);
        setShowAddForm(false);
        setFormData({
          name: '',
          emoji: '📚',
          platform: 'udemy',
          language: 'he',
          status: 'planned',
          description: '',
          source_url: '',
          tags: ''
        });
        console.log('Course created successfully!');
      } else {
        const error = await response.json();
        console.error('Error creating course:', error);
        alert(`Error creating course: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error creating course');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle form field changes
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle edit course
  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      emoji: course.emoji,
      platform: course.platform,
      language: course.language,
      status: course.status,
      description: course.description || '',
      source_url: course.source_url || '',
      tags: course.tags.join(', ')
    });
    setShowEditForm(true);
  };

  // Handle update course
  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setIsUpdating(true);

    try {
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

      const response = await fetch(`/api/courses/${editingCourse.id}`, {
        method: 'PUT',
        _headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray
        }),
      });

      if (response.ok) {
        const updatedCourse = await response.json();
        setCourses(prev => prev.map(c => c.id === editingCourse.id ? updatedCourse : c));
        setShowEditForm(false);
        setEditingCourse(null);
        console.log('Course updated successfully!');
      } else {
        const error = await response.json();
        console.error('Error updating course:', error);
        alert(`Error updating course: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Error updating course');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete course
  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/courses/${deletingCourse.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCourses(prev => prev.filter(c => c.id !== deletingCourse.id));
        setShowDeleteConfirm(false);
        setDeletingCourse(null);
        console.log('Course deleted successfully!');
      } else {
        const error = await response.json();
        console.error('Error deleting course:', error);
        alert(`Error deleting course: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error deleting course');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle quick status change
  const handleQuickStatusChange = async (course: Course, newStatus: string) => {
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        _headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: course.name,
          emoji: course.emoji,
          platform: course.platform,
          language: course.language,
          status: newStatus,
          description: course.description,
          source_url: course.source_url,
          tags: course.tags
        }),
      });

      if (response.ok) {
        const updatedCourse = await response.json();
        setCourses(prev => prev.map(c => c.id === course.id ? updatedCourse : c));
        console.log('Status updated successfully!');
      } else {
        console.error('Error updating status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Handle Google Drive connection
  const handleConnectDrive = async () => {
    setIsConnectingDrive(true);
    try {
      const response = await fetch('/api/google/auth');
      const data = await response.json();

      if (data.authUrl) {
        // Open Google OAuth in popup
        const popup = window.open(
          data.authUrl,
          'google-auth',
          POPUP_FEATURES
        );

        // More efficient popup monitoring - check every 100ms initially, then slow down
        let pollCount = 0;
        const checkClosed = () => {
          if (popup?.closed) {
            setIsConnectingDrive(false);
            setDriveConnected(true);
            console.log('Google Drive connected!');
          } else {
            pollCount++;
            // Start with 100ms, then increase to 500ms after 50 checks (5 seconds)
            const interval = pollCount > 50 ? 500 : 100;
            setTimeout(checkClosed, interval);
          }
        };
        checkClosed();
      }
    } catch (error) {
      console.error('Error connecting to Google Drive:', error);
      setIsConnectingDrive(false);
    }
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
        <Button
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => setShowAddForm(true)}
        >
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
              variant="secondary"
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
                            <_Clock className="h-3 w-3" />
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
                className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-colors"
              >
                {/* Clickable area (excludes action buttons) */}
                <div
                  onClick={() => handleCourseSelect(course)}
                  className="cursor-pointer"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
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

                      {/* Course Menu */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex gap-1 items-start"
                      >
                        {/* Quick Status Toggle */}
                        <select
                          value={course.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleQuickStatusChange(course, e.target.value);
                          }}
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 cursor-pointer"
                        >
                          <option value="planned">מתוכנן</option>
                          <option value="active">פעיל</option>
                          <option value="paused">מושהה</option>
                          <option value="completed">הושלם</option>
                        </select>

                        {/* Edit Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCourse(course);
                          }}
                          className="text-slate-400 hover:text-slate-100 h-8 w-8 p-0"
                          title="ערוך קורס"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingCourse(course);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                          title="מחק קורס"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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
                </div>

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
                        variant="secondary"
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
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 me-2" />
            {courseTranslations.actions.addCourse}
          </Button>
        </div>
      )}

      {/* Add Course Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-100">הוסף קורס חדש</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-100"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4">
                {/* Course Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    שם הקורס *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    placeholder="למשל: React מתקדם"
                  />
                </div>

                {/* Emoji */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    אייקון
                  </label>
                  <Input
                    type="text"
                    value={formData.emoji}
                    onChange={(e) => handleFormChange('emoji', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    placeholder="📚"
                    maxLength={2}
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    פלטפורמה *
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => handleFormChange('platform', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100"
                    required
                  >
                    <option value="udemy">Udemy</option>
                    <option value="youtube">YouTube</option>
                    <option value="coursera">Coursera</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="local">Local</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    שפה
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => handleFormChange('language', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100"
                  >
                    <option value="he">עברית</option>
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    סטטוס
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100"
                  >
                    <option value="planned">מתוכנן</option>
                    <option value="active">פעיל</option>
                    <option value="paused">מושהה</option>
                    <option value="completed">הושלם</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    תיאור
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100 min-h-[80px]"
                    placeholder="תיאור קצר של הקורס..."
                    rows={3}
                  />
                </div>

                {/* Source URL */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    קישור לקורס
                  </label>
                  <Input
                    type="url"
                    value={formData.source_url}
                    onChange={(e) => handleFormChange('source_url', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    placeholder="https://..."
                  />
                </div>

                <GoogleDriveConnection
                  isConnecting={isConnectingDrive}
                  isConnected={driveConnected}
                  onConnect={handleConnectDrive}
                  onDisconnect={() => setDriveConnected(false)}
                />

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    תגיות (מופרדות בפסיקים)
                  </label>
                  <Input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleFormChange('tags', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    placeholder="react, javascript, frontend"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                    disabled={isCreating}
                  >
                    ביטול
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={isCreating || !formData.name}
                  >
                    {isCreating ? 'יוצר...' : 'צור קורס'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Form Modal */}
      {showEditForm && editingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-100">ערוך קורס</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditForm(false)}
                  className="text-slate-400 hover:text-slate-100"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleUpdateCourse} className="space-y-4">
                {/* Course Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    שם הקורס *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    placeholder="למשל: React מתקדם"
                  />
                </div>

                {/* Emoji */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    אייקון
                  </label>
                  <Input
                    type="text"
                    value={formData.emoji}
                    onChange={(e) => handleFormChange('emoji', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    placeholder="📚"
                    maxLength={2}
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    פלטפורמה *
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => handleFormChange('platform', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100"
                    required
                  >
                    <option value="udemy">Udemy</option>
                    <option value="youtube">YouTube</option>
                    <option value="coursera">Coursera</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="local">Local</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    שפה
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => handleFormChange('language', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100"
                  >
                    <option value="he">עברית</option>
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    סטטוס
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100"
                  >
                    <option value="planned">מתוכנן</option>
                    <option value="active">פעיל</option>
                    <option value="paused">מושהה</option>
                    <option value="completed">הושלם</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    תיאור
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-100 min-h-[80px]"
                    placeholder="תיאור קצר של הקורס..."
                    rows={3}
                  />
                </div>

                {/* Source URL */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    קישור לקורס
                  </label>
                  <Input
                    type="url"
                    value={formData.source_url}
                    onChange={(e) => handleFormChange('source_url', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    placeholder="https://..."
                  />
                </div>

                <GoogleDriveConnection
                  isConnecting={isConnectingDrive}
                  isConnected={driveConnected}
                  onConnect={handleConnectDrive}
                  onDisconnect={() => setDriveConnected(false)}
                />

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    תגיות (מופרדות בפסיקים)
                  </label>
                  <Input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleFormChange('tags', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    placeholder="react, javascript, frontend"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowEditForm(false)}
                    className="flex-1"
                    disabled={isUpdating}
                  >
                    ביטול
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={isUpdating || !formData.name}
                  >
                    {isUpdating ? 'מעדכן...' : 'עדכן קורס'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">מחיקת קורס</h2>
                  <p className="text-sm text-slate-400">פעולה זו לא ניתנת לביטול</p>
                </div>
              </div>

              <p className="text-slate-300 mb-6">
                האם אתה בטוח שברצונך למחוק את הקורס{' '}
                <span className="font-semibold text-slate-100">"{deletingCourse.name}"</span>?
                <br />
                <span className="text-sm text-slate-400">כל השיעורים וההתקדמות יימחקו.</span>
              </p>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingCourse(null);
                  }}
                  className="flex-1"
                  disabled={isDeleting}
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleDeleteCourse}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'מוחק...' : 'מחק קורס'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesScreen;