import { Tabs, TabsList, TabsTrigger } from '@template/ui';

interface ReadingModeToggleProps {
  mode: string;
  onModeChange: (mode: string) => void;
}

export function ReadingModeToggle({ mode, onModeChange }: ReadingModeToggleProps) {
  return (
    <Tabs value={mode} onValueChange={onModeChange}>
      <TabsList className="w-full bg-secondary/60 p-1 h-auto">
        <TabsTrigger value="translation" className="flex-1 text-xs py-2">
          Translation
        </TabsTrigger>
        <TabsTrigger value="word-by-word" className="flex-1 text-xs py-2">
          Word by Word
        </TabsTrigger>
        <TabsTrigger value="mushaf" className="flex-1 text-xs py-2">
          Mushaf
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
