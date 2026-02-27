import { useState } from "react";
import { Search } from "lucide-react";
import { Input, Tabs, TabsContent, TabsList, TabsTrigger } from "@template/ui";
import { AppHeader } from "@/components/layout/app-header";
import { SurahList } from "@/components/quran/surah-list";
import { JuzList } from "@/components/quran/juz-list";
import { useChapters } from "@/lib/api/chapters";
import { Link } from "react-router-dom";
import { useTranslation } from "@/lib/i18n";

function PageGrid() {
  return (
    <div className="grid grid-cols-6 gap-2.5 px-6 py-4">
      {Array.from({ length: 604 }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          to={`/quran/page/${page}`}
          className="flex items-center justify-center h-11 rounded-xl bg-secondary/60 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 active:scale-95"
        >
          {page}
        </Link>
      ))}
    </div>
  );
}

export default function QuranIndexPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: chapters, isLoading } = useChapters();

  return (
    <div className="animate-fade-in">
      <AppHeader title={t("quran")} />

      {/* Search bar */}
      <div className="px-6 pt-2 pb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchSurahs")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 bg-secondary/50 border-0 rounded-2xl text-sm placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Browse tabs */}
      <Tabs defaultValue="surah" className="w-full">
        <div className="px-6 pb-2">
          <TabsList className="w-full bg-secondary/50 p-1 h-auto rounded-2xl">
            <TabsTrigger
              value="surah"
              className="flex-1 rounded-xl py-2.5 text-sm font-medium data-[state=active]:shadow-sm"
            >
              {t("surah")}
            </TabsTrigger>
            <TabsTrigger
              value="juz"
              className="flex-1 rounded-xl py-2.5 text-sm font-medium data-[state=active]:shadow-sm"
            >
              {t("juz")}
            </TabsTrigger>
            <TabsTrigger
              value="page"
              className="flex-1 rounded-xl py-2.5 text-sm font-medium data-[state=active]:shadow-sm"
            >
              {t("page")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="surah" className="mt-0">
          <SurahList
            chapters={chapters}
            isLoading={isLoading}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="juz" className="mt-0">
          <JuzList />
        </TabsContent>

        <TabsContent value="page" className="mt-0">
          <PageGrid />
        </TabsContent>
      </Tabs>
    </div>
  );
}
