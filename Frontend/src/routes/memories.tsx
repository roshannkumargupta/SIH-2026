import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Heart, ArrowLeft, Plus, Volume2, Image as ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NavigationHeader } from "@/components/navigation-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMemories } from "@/hooks/use-memories";
import { useLanguage } from "@/context/LanguageContext";
import { formatApiError } from "@/api/client";
import defaultMemoryPhoto from "@/assets/memory-triptych.jpg";

export const Route = createFileRoute("/memories")({
  head: () => ({
    meta: [
      { title: "My Memories | SmritiSetu" },
      {
        name: "description",
        content: "Familiar people, places, and personal life stories on SmritiSetu.",
      },
    ],
  }),
  component: MemoriesPage,
});

function MemoriesPage() {
  const { memories, isLoading, createMemory, deleteMemory, isCreating } = useMemories();
  const { t } = useLanguage();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"Family" | "Places" | "Celebrations">("Family");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryLabels: Record<string, string> = {
    Family: t("memories:family"),
    Places: t("memories:places"),
    Celebrations: t("memories:celebrations"),
  };

  const handleSpeak = (promptText: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(promptText);
      utterance.rate = 0.88;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      toast.info(t("memories:playingRecollection"));
    } else {
      toast.info(promptText);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setImageBase64(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      await createMemory({
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || undefined,
        tags: [category],
        image_url: imageBase64 || undefined,
      });

      toast.success(t("memories:savedSuccess"));
      setIsAddOpen(false);
      setTitle("");
      setDescription("");
      setLocation("");
      setImageBase64("");
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to save memory"));
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteMemory(id);
      toast.success(t("common:done"));
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to delete memory"));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavigationHeader />

      <main className="flex-1 mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12 w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Button asChild variant="cream" size="touch">
            <Link to="/">
              <ArrowLeft size={20} className="mr-2" /> {t("common:backHome")}
            </Link>
          </Button>

          {/* Add Memory Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="cream" size="touch" className="text-base font-extrabold">
                <Plus size={20} className="mr-2" /> {t("memories:addMemory")}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-clay text-cream max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-bold text-cream">
                  {t("memories:addMemoryDialogTitle")}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddMemory} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="mem-title" className="text-sm font-bold text-cream">
                    {t("memories:memoryTitle")}
                  </Label>
                  <Input
                    id="mem-title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Diwalis with Family in Jaipur"
                    className="bg-ink border-clay text-cream mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-bold text-cream mb-1 block">
                    {t("memories:category")}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Family", "Places", "Celebrations"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-2 rounded-lg text-xs font-bold transition ${
                          category === cat
                            ? "bg-sun text-ink shadow-sm"
                            : "bg-ink border border-clay text-cream hover:bg-clay"
                        }`}
                      >
                        {categoryLabels[cat] || cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="mem-loc" className="text-sm font-bold text-cream">
                    {t("memories:location")}
                  </Label>
                  <Input
                    id="mem-loc"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Shimla / Home Veranda"
                    className="bg-ink border-clay text-cream mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="mem-desc" className="text-sm font-bold text-cream">
                    {t("memories:description")}
                  </Label>
                  <Textarea
                    id="mem-desc"
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe who was there, how it felt, or familiar sights…"
                    className="bg-ink border-clay text-cream mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-bold text-cream mb-1 block">
                    {t("memories:uploadPhoto")}
                  </Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-clay text-cream hover:bg-clay"
                    >
                      <ImageIcon size={18} className="mr-2" /> {t("memories:uploadPhoto")}
                    </Button>
                    {imageBase64 && (
                      <span className="text-xs text-tea-confirm font-bold">Photo attached</span>
                    )}
                  </div>
                  {imageBase64 && (
                    <div className="mt-2 relative rounded-lg overflow-hidden border border-clay max-h-40">
                      <img src={imageBase64} alt="Preview" className="w-full h-36 object-cover" />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddOpen(false)}
                    className="border border-clay text-cream"
                  >
                    {t("common:cancel")}
                  </Button>
                  <Button type="submit" variant="cream" disabled={isCreating}>
                    {isCreating ? t("common:loading") : t("memories:saveMemory")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Title Card */}
        <div className="rounded-2xl border border-clay bg-surface p-6 sm:p-8 shadow-card mb-8">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-sun text-ink shadow-sm">
              <Heart size={36} />
            </span>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream">
                {t("memories:pageTitle")}
              </h1>
              <p className="text-cream/80 mt-1">{t("memories:pageSubtitle")}</p>
            </div>
          </div>
        </div>

        {/* Memory Grid / Empty State */}
        {isLoading ? (
          <div className="py-20 text-center text-cream/70 text-xl font-medium">
            {t("common:loading")}
          </div>
        ) : memories.length === 0 ? (
          <div className="rounded-2xl border border-clay bg-surface/50 p-12 text-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-clay/50 text-cream/70 mx-auto mb-4">
              <Heart size={40} />
            </span>
            <h2 className="text-2xl font-bold text-cream">{t("memories:emptyMemories")}</h2>
            <p className="mt-2 text-lg text-cream/70 max-w-md mx-auto">
              {t("dashboard:memoriesEmptyDesc")}
            </p>
            <Button
              variant="cream"
              size="touch"
              onClick={() => setIsAddOpen(true)}
              className="mt-6 text-base font-extrabold"
            >
              <Plus size={20} className="mr-2" /> {t("dashboard:createFirstMemory")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {memories.map((m) => {
              const tag = m.tags && m.tags.length > 0 ? m.tags[0] : "Memory";
              const localizedTag = categoryLabels[tag] || tag;
              const voiceText = `${m.title}. ${m.description}`;
              return (
                <article
                  key={m.id}
                  className="rounded-2xl border border-clay bg-surface overflow-hidden shadow-card hover:shadow-card-active transition duration-300 flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={m.image_url || defaultMemoryPhoto}
                      alt={m.title}
                      className="h-48 w-full object-cover border-b border-clay/60"
                    />
                    <div className="p-6">
                      <div className="flex items-center justify-between text-xs font-bold text-sun mb-2">
                        <span className="uppercase tracking-wider">{localizedTag}</span>
                        {m.location && <span className="text-cream/60">{m.location}</span>}
                      </div>
                      <h2 className="font-display text-2xl font-bold text-cream mb-2 leading-tight">
                        {m.title}
                      </h2>
                      <p className="text-cream/80 text-base leading-relaxed">{m.description}</p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-clay/40 mt-4 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="cream"
                      size="touch"
                      onClick={() => handleSpeak(voiceText)}
                      className="flex-1 text-base font-extrabold gap-2 mt-4"
                    >
                      <Volume2 size={20} /> {t("memories:listenRecollection")}
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMemory(m.id)}
                      className="mt-4 p-3 rounded-xl border border-clay text-cream/60 hover:text-fire hover:border-fire transition"
                      title={t("common:delete")}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
