import React, { useState, useEffect } from 'react';
import { Lock, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LessonCountdownProps {
  releaseDate: Date;
  lockMessage: string;
  lessonTitle: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function LessonCountdown({ releaseDate, lockMessage, lessonTitle }: LessonCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isReleased, setIsReleased] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const release = releaseDate.getTime();
      const difference = release - now;

      if (difference <= 0) {
        setIsReleased(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [releaseDate]);

  if (isReleased) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Lesson Available!</h3>
            <p className="text-muted-foreground mb-4">
              "{lessonTitle}" is now available to watch.
            </p>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Released
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
          <Lock className="h-8 w-8 text-orange-600" />
        </div>
        <CardTitle className="text-xl">Lesson Locked</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        <p className="text-muted-foreground">
          {lockMessage}
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Available on {releaseDate.toLocaleDateString()}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Available in {timeRemaining.days > 0 ? `${timeRemaining.days} day${timeRemaining.days === 1 ? '' : 's'}` : timeRemaining.hours > 0 ? `${timeRemaining.hours} hour${timeRemaining.hours === 1 ? '' : 's'}` : timeRemaining.minutes > 0 ? `${timeRemaining.minutes} minute${timeRemaining.minutes === 1 ? '' : 's'}` : `${timeRemaining.seconds} second${timeRemaining.seconds === 1 ? '' : 's'}`}
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl font-bold text-foreground">
                {timeRemaining.days}
              </div>
              <div className="text-xs text-muted-foreground uppercase">
                Days
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl font-bold text-foreground">
                {timeRemaining.hours}
              </div>
              <div className="text-xs text-muted-foreground uppercase">
                Hours
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl font-bold text-foreground">
                {timeRemaining.minutes}
              </div>
              <div className="text-xs text-muted-foreground uppercase">
                Minutes
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl font-bold text-foreground">
                {timeRemaining.seconds}
              </div>
              <div className="text-xs text-muted-foreground uppercase">
                Seconds
              </div>
            </div>
          </div>
        </div>

        <Badge variant="outline" className="border-orange-200 text-orange-800">
          <Clock className="w-3 h-3 mr-1" />
          Countdown Active
        </Badge>
      </CardContent>
    </Card>
  );
}