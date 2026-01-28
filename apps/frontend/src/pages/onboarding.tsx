import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Bell, Moon, Sun, Target, Check } from 'lucide-react';
import { Button, Slider } from '@template/ui';
import { Logo } from '@/components/brand/logo';
import { useOfflineSettings } from '@/lib/hooks';
import { cn } from '@/lib/utils';

type Step = 'welcome' | 'location' | 'notifications' | 'theme' | 'goal' | 'complete';

const steps: Step[] = ['welcome', 'location', 'notifications', 'theme', 'goal', 'complete'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useOfflineSettings();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  const currentIndex = steps.indexOf(currentStep);

  const nextStep = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const skipToComplete = () => {
    setCurrentStep('complete');
  };

  const requestLocationPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      if (result.state === 'granted') {
        setLocationGranted(true);
        nextStep();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationGranted(true);
          nextStep();
        },
        () => {
          // Permission denied, still move to next step
          nextStep();
        }
      );
    } catch {
      nextStep();
    }
  };

  const requestNotificationPermission = async () => {
    try {
      if (!('Notification' in window)) {
        nextStep();
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationsGranted(permission === 'granted');
      nextStep();
    } catch {
      nextStep();
    }
  };

  const finishOnboarding = () => {
    // Mark onboarding as completed
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-8">
        <div className="flex gap-1">
          {steps.map((step, index) => (
            <div
              key={step}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                index <= currentIndex ? 'bg-primary' : 'bg-border'
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <div className="text-center animate-fade-in">
            <Logo size="xl" className="mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-3">Welcome to Noor</h1>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
              Your companion for Quran reading, memorization, and daily prayers.
            </p>
            <Button size="lg" className="w-full max-w-xs" onClick={nextStep}>
              Get Started
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Location Step */}
        {currentStep === 'location' && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Location Access</h1>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
              Allow location access to show accurate prayer times and Qibla direction for your area.
            </p>
            <div className="space-y-3 max-w-xs mx-auto">
              <Button size="lg" className="w-full" onClick={requestLocationPermission}>
                Enable Location
              </Button>
              <Button size="lg" variant="ghost" className="w-full" onClick={nextStep}>
                Skip for now
              </Button>
            </div>
          </div>
        )}

        {/* Notifications Step */}
        {currentStep === 'notifications' && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Stay Connected</h1>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
              Get gentle reminders for prayer times and to maintain your reading streak.
            </p>
            <div className="space-y-3 max-w-xs mx-auto">
              <Button size="lg" className="w-full" onClick={requestNotificationPermission}>
                Enable Notifications
              </Button>
              <Button size="lg" variant="ghost" className="w-full" onClick={nextStep}>
                Skip for now
              </Button>
            </div>
          </div>
        )}

        {/* Theme Step */}
        {currentStep === 'theme' && (
          <div className="text-center animate-fade-in">
            <h1 className="text-2xl font-bold mb-3">Choose Your Theme</h1>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
              Select the appearance that's easiest on your eyes.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
              <button
                onClick={() => updateSettings({ theme: 'light' })}
                className={cn(
                  'p-6 rounded-2xl border-2 transition-all',
                  settings.theme === 'light'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <Sun className="w-6 h-6 text-amber-600" />
                </div>
                <p className="font-medium">Light</p>
                <p className="text-xs text-muted-foreground">Warm cream tones</p>
              </button>
              <button
                onClick={() => updateSettings({ theme: 'dark' })}
                className={cn(
                  'p-6 rounded-2xl border-2 transition-all',
                  settings.theme === 'dark'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <Moon className="w-6 h-6 text-slate-200" />
                </div>
                <p className="font-medium">Dark</p>
                <p className="text-xs text-muted-foreground">Easy on the eyes</p>
              </button>
            </div>
            <Button size="lg" className="w-full max-w-xs" onClick={nextStep}>
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Goal Step */}
        {currentStep === 'goal' && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Set Your Daily Goal</h1>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
              How many ayahs would you like to read each day?
            </p>
            <div className="max-w-xs mx-auto mb-8">
              <div className="text-center mb-6">
                <span className="text-5xl font-bold text-primary">{settings.dailyAyahGoal}</span>
                <span className="text-lg text-muted-foreground ml-2">ayahs/day</span>
              </div>
              <Slider
                value={[settings.dailyAyahGoal]}
                onValueChange={(v: number[]) => updateSettings({ dailyAyahGoal: v[0] })}
                min={5}
                max={50}
                step={5}
                className="mb-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 min</span>
                <span>15 min</span>
                <span>30 min</span>
              </div>
            </div>
            <Button size="lg" className="w-full max-w-xs" onClick={nextStep}>
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold mb-3">You're All Set!</h1>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
              Begin your journey with the Quran. May Allah bless your path.
            </p>

            {/* Summary */}
            <div className="max-w-xs mx-auto mb-8 p-4 rounded-xl bg-secondary/50 text-left">
              <p className="text-sm font-medium mb-3">Your preferences:</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Theme</span>
                  <span className="font-medium capitalize">{settings.theme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily goal</span>
                  <span className="font-medium">{settings.dailyAyahGoal} ayahs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{locationGranted ? 'Enabled' : 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notifications</span>
                  <span className="font-medium">{notificationsGranted ? 'Enabled' : 'Not set'}</span>
                </div>
              </div>
            </div>

            <Button size="lg" className="w-full max-w-xs" onClick={finishOnboarding}>
              Start Reading
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>

      {/* Skip Button */}
      {currentStep !== 'welcome' && currentStep !== 'complete' && (
        <div className="px-6 pb-8 text-center">
          <Button variant="ghost" size="sm" onClick={skipToComplete}>
            Skip setup
          </Button>
        </div>
      )}
    </div>
  );
}
