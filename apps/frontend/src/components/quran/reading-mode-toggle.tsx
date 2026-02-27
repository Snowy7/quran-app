import { Tabs, TabsList, TabsTrigger } from "@template/ui";
import { useTranslation } from "@/lib/i18n";

interface ReadingModeToggleProps {
  mode: string;
  onModeChange: (mode: string) => void;
}

export function ReadingModeToggle({
  mode,
  onModeChange,
}: ReadingModeToggleProps) {
  const { t } = useTranslation();

  return (
    <Tabs value={mode} onValueChange={onModeChange}>
      <TabsList className="w-full bg-secondary/50 p-1 h-auto rounded-xl">
        <TabsTrigger
          value="translation"
          className="flex-1 text-[11px] py-1.5 rounded-lg font-medium data-[state=active]:shadow-sm"
        >
          {t("translation")}
        </TabsTrigger>
        <TabsTrigger
          value="word-by-word"
          className="flex-1 text-[11px] py-1.5 rounded-lg font-medium data-[state=active]:shadow-sm"
        >
          {t("wordByWord")}
        </TabsTrigger>
        <TabsTrigger
          value="mushaf"
          className="flex-1 text-[11px] py-1.5 rounded-lg font-medium data-[state=active]:shadow-sm"
        >
          {t("mushaf")}
        </TabsTrigger>
        <TabsTrigger
          value="tafsir"
          className="flex-1 text-[11px] py-1.5 rounded-lg font-medium data-[state=active]:shadow-sm"
        >
          {t("tafseer")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
