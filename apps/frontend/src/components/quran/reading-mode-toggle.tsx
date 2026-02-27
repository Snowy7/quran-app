import { Tabs, TabsList, TabsTrigger } from '@template/ui';

interface ReadingModeToggleProps {
  mode: string;
  onModeChange: (mode: string) => void;
}

export function ReadingModeToggle({ mode, onModeChange }: ReadingModeToggleProps) {
  return (
    <Tabs value={mode} onValueChange={onModeChange}>
      <TabsList className="w-full">
        <TabsTrigger value="translation" className="flex-1 text-xs">
          Translation
        </TabsTrigger>
        <TabsTrigger value="mushaf" className="flex-1 text-xs" disabled>
          Mushaf
        </TabsTrigger>
        <TabsTrigger value="word-by-word" className="flex-1 text-xs" disabled>
          Word by Word
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
