import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Play, FileText, Download, ExternalLink, Clock, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TrainingLesson {
  id: string;
  title: string;
  content_type: 'video' | 'text' | 'pdf' | 'embed' | 'link';
  video_url: string | null;
  embed_code: string | null;
  text_content: string | null;
  pdf_url: string | null;
  link_url: string | null;
  duration_minutes: number | null;
  is_free_preview: boolean;
  sort_order: number;
}

interface TrainingModule {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: TrainingLesson[];
}

interface TrainingCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  tags: string[];
  estimated_duration_minutes: number | null;
  thumbnail_url: string | null;
  modules: TrainingModule[];
}

export default function TrainingCourse() {
  const { courseSlug } = useParams();
  const [selectedLesson, setSelectedLesson] = useState<TrainingLesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const navigate = useNavigate();

  const { data: course, isLoading } = useQuery({
    queryKey: ["training-course", courseSlug],
    queryFn: async () => {
      const { data: courseData, error: courseError } = await supabase
        .from("training_courses")
        .select("*")
        .eq("slug", courseSlug)
        .eq("is_published", true)
        .eq("is_active", true)
        .single();
      
      if (courseError) throw courseError;

      const { data: modulesData, error: modulesError } = await supabase
        .from("training_modules")
        .select(`
          *,
          lessons:training_lessons(*)
        `)
        .eq("course_id", courseData.id)
        .order("sort_order");
      
      if (modulesError) throw modulesError;

      const modules = modulesData.map(module => ({
        ...module,
        lessons: (module.lessons as TrainingLesson[]).sort((a, b) => a.sort_order - b.sort_order)
      }));

      return {
        ...courseData,
        modules
      } as TrainingCourse;
    },
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getFirstLesson = (): TrainingLesson | null => {
    if (!course || course.modules.length === 0) return null;
    
    const sortedModules = [...course.modules].sort((a, b) => a.sort_order - b.sort_order);
    const firstModule = sortedModules[0];
    
    if (!firstModule || firstModule.lessons.length === 0) return null;
    
    const sortedLessons = [...firstModule.lessons].sort((a, b) => a.sort_order - b.sort_order);
    return sortedLessons[0];
  };

  const renderLessonContent = (lesson: TrainingLesson) => {
    const contentBlocks: JSX.Element[] = [];

    // Render primary content first based on content_type
    if (lesson.content_type === 'video') {
      if (lesson.video_url || lesson.embed_code) {
        contentBlocks.push(renderVideoContent(lesson));
      }
    } else if (lesson.content_type === 'text') {
      if (lesson.text_content) {
        contentBlocks.push(renderTextContent(lesson));
      }
    } else if (lesson.content_type === 'pdf') {
      if (lesson.pdf_url) {
        contentBlocks.push(renderPdfContent(lesson));
      }
    } else if (lesson.content_type === 'embed') {
      if (lesson.embed_code) {
        contentBlocks.push(renderEmbedContent(lesson));
      }
    } else if (lesson.content_type === 'link') {
      if (lesson.link_url) {
        contentBlocks.push(renderLinkContent(lesson));
      }
    }

    // Render additional content types that aren't the primary type
    if (lesson.content_type !== 'video' && (lesson.video_url || lesson.embed_code)) {
      contentBlocks.push(renderVideoContent(lesson));
    }
    if (lesson.content_type !== 'text' && lesson.text_content) {
      contentBlocks.push(renderTextContent(lesson));
    }
    if (lesson.content_type !== 'pdf' && lesson.pdf_url) {
      contentBlocks.push(renderPdfContent(lesson));
    }
    if (lesson.content_type !== 'embed' && lesson.embed_code && lesson.content_type !== 'video') {
      contentBlocks.push(renderEmbedContent(lesson));
    }
    if (lesson.content_type !== 'link' && lesson.link_url) {
      contentBlocks.push(renderLinkContent(lesson));
    }

    if (contentBlocks.length === 0) {
      return <div className="text-muted-foreground">No content available for this lesson.</div>;
    }

    return (
      <div className="space-y-6">
        {contentBlocks.map((block, index) => (
          <div key={index}>{block}</div>
        ))}
      </div>
    );
  };

  const renderVideoContent = (lesson: TrainingLesson) => {
    const videoUrl = lesson.video_url || '';
    const isYoutube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    
    if (lesson.embed_code) {
      return (
        <div className="w-full">
          <AspectRatio ratio={16 / 9}>
            <div dangerouslySetInnerHTML={{ __html: lesson.embed_code }} />
          </AspectRatio>
        </div>
      );
    }
    
    if (isYoutube && videoUrl) {
      let embedUrl = videoUrl;
      if (videoUrl.includes('youtube.com/watch?v=')) {
        embedUrl = videoUrl.replace('youtube.com/watch?v=', 'youtube.com/embed/');
      } else if (videoUrl.includes('youtu.be/')) {
        embedUrl = videoUrl.replace('youtu.be/', 'youtube.com/embed/');
      }
      
      return (
        <div className="w-full">
          <AspectRatio ratio={16 / 9}>
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-lg"
              allowFullScreen
              title={lesson.title}
            />
          </AspectRatio>
        </div>
      );
    }
    
    if (videoUrl) {
      return (
        <div className="w-full">
          <AspectRatio ratio={16 / 9}>
            <video
              src={videoUrl}
              controls
              className="w-full h-full rounded-lg"
              title={lesson.title}
            />
          </AspectRatio>
        </div>
      );
    }

    return null;
  };

  const renderTextContent = (lesson: TrainingLesson) => {
    if (!lesson.text_content) return null;
    
    return (
      <div className="prose prose-sm max-w-none">
        <div dangerouslySetInnerHTML={{ __html: lesson.text_content }} />
      </div>
    );
  };

  const renderPdfContent = (lesson: TrainingLesson) => {
    if (!lesson.pdf_url) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <Download className="h-5 w-5" />
          <span className="font-medium">PDF Document</span>
        </div>
        <iframe
          src={lesson.pdf_url}
          className="w-full h-96 rounded-lg border"
          title={lesson.title}
        />
      </div>
    );
  };

  const renderEmbedContent = (lesson: TrainingLesson) => {
    if (!lesson.embed_code) return null;
    
    return (
      <div className="w-full">
        <AspectRatio ratio={16 / 9}>
          <div dangerouslySetInnerHTML={{ __html: lesson.embed_code }} />
        </AspectRatio>
      </div>
    );
  };

  const renderLinkContent = (lesson: TrainingLesson) => {
    if (!lesson.link_url) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <ExternalLink className="h-5 w-5" />
          <span className="font-medium">External Resource</span>
        </div>
        <a
          href={lesson.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Open Resource →
        </a>
      </div>
    );
  };

  const getLessonIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'pdf':
        return <Download className="h-4 w-4" />;
      case 'embed':
        return <Play className="h-4 w-4" />;
      case 'link':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="h-96 bg-muted rounded"></div>
            <div className="lg:col-span-3 h-96 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Course not found</h2>
          <p className="text-muted-foreground">The course you're looking for doesn't exist or isn't published.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={course.title} description="">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Course Navigation */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Content</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{course.modules.length} modules</span>
                {course.estimated_duration_minutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{course.estimated_duration_minutes} min</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {course.modules.map((module) => (
                <Collapsible
                  key={module.id}
                  open={expandedModules.includes(module.id)}
                  onOpenChange={() => toggleModule(module.id)}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg text-left">
                    {expandedModules.includes(module.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{module.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {module.lessons.length} lessons
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-6 space-y-1">
                    {module.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={cn(
                          "flex items-center gap-2 w-full p-2 rounded text-left text-sm hover:bg-muted",
                          selectedLesson?.id === lesson.id && "bg-primary/10"
                        )}
                      >
                        {getLessonIcon(lesson.content_type)}
                        <span className="flex-1">{lesson.title}</span>
                        {lesson.duration_minutes && (
                          <span className="text-xs text-muted-foreground">
                            {lesson.duration_minutes}min
                          </span>
                        )}
                      </button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedLesson ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedLesson.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedLesson.content_type}</Badge>
                  {selectedLesson.duration_minutes && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {selectedLesson.duration_minutes} min
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {renderLessonContent(selectedLesson)}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Welcome to {course.title}</CardTitle>
                    {course.category && (
                      <Badge className="w-fit mt-2">{course.category}</Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard/training')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Course Library
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.description && (
                  <div className="prose prose-sm max-w-none">
                    <p>{course.description}</p>
                  </div>
                )}
                
                {course.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />
                
                <div className="text-center py-8">
                  {getFirstLesson() ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground mb-4">
                        Ready to start learning?
                      </p>
                      <Button
                        size="lg"
                        onClick={() => setSelectedLesson(getFirstLesson()!)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Get Started
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No lessons available in this course.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}