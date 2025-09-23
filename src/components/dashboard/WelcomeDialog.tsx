import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { parseVideoUrl, buildEmbedUrl } from '@/components/page-builder/utils/videoUtils';

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  const videoUrl = 'https://youtu.be/o8yhgN2LKWs';
  const videoInfo = parseVideoUrl(videoUrl);
  const embedUrl = videoInfo.embedUrl ? buildEmbedUrl(videoInfo.embedUrl, videoInfo.type) : '';

  useEffect(() => {
    if (open) {
      // Trigger confetti when dialog opens
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to Your Dashboard! 🎉
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {embedUrl && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Welcome Video"
              />
            </div>
          )}
          
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Get ready to build amazing websites and funnels! This quick video will show you how to get started.
            </p>
            
            <Button 
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Let's Get Started!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}