import { Link } from 'react-router-dom';
import { BookOpen, Brain, Clock } from 'lucide-react';
import { Card, CardContent } from '@template/ui';
import { AppHeader } from '@/components/layout/app-header';

export default function HomePage() {
  return (
    <div>
      <AppHeader title="Noor" showSettings />

      <div className="px-5 py-4 space-y-4">
        {/* Continue Reading Card */}
        <Link to="/quran">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Continue Reading</h3>
                  <p className="text-xs text-muted-foreground">Start reading the Quran</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Hifz Review Card */}
        <Link to="/hifz">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Brain className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Memorization</h3>
                  <p className="text-xs text-muted-foreground">Track and review your hifz</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Prayer Times Card */}
        <Link to="/prayer-times">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Prayer Times</h3>
                  <p className="text-xs text-muted-foreground">View today's prayer schedule</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
