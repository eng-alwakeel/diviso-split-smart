import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Link2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const JoinByLink: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [link, setLink] = useState("");

  const extractCode = (input: string): string | null => {
    const trimmed = input.trim();
    // Match /i/CODE pattern in URL
    const urlMatch = trimmed.match(/\/i\/([A-Za-z0-9_-]+)/);
    if (urlMatch) return urlMatch[1];
    // If it's just a plain code (no slashes, no spaces)
    if (/^[A-Za-z0-9_-]+$/.test(trimmed) && trimmed.length >= 4) return trimmed;
    return null;
  };

  const handleJoin = () => {
    const code = extractCode(link);
    if (!code) {
      toast({
        title: t("join_by_link_page.invalid_link"),
        variant: "destructive",
      });
      return;
    }
    navigate(`/i/${code}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Link2 className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">
            {t("join_by_link_page.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("join_by_link_page.description")}
          </p>
        </div>
        <div className="space-y-3">
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder={t("join_by_link_page.placeholder")}
            className="text-center"
            dir="ltr"
          />
          <Button onClick={handleJoin} className="w-full gap-2" disabled={!link.trim()}>
            {t("join_by_link_page.join")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JoinByLink;
