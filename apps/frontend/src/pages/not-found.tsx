import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@template/ui";
import { useTranslation } from "@/lib/i18n";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-muted-foreground/20">404</h1>
        <h2 className="mt-6 text-xl font-bold text-foreground">
          {t("pageNotFound")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-[240px] mx-auto">
          {t("pageNotFoundDesc")}
        </p>
        <Link to="/" className="mt-8 inline-block">
          <Button variant="default" className="gap-2 rounded-2xl px-6 h-12">
            <Home className="h-4 w-4" />
            {t("goHome")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
