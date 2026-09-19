import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Heart, ArrowLeft, Plus, Image as ImageIcon, Volume2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
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
      { title: "Memory Lane | SmritiSetu" },
      {
        name: "description",
        content: "Cherished photos, family stories, and familiar voices on SmritiSetu.",
      },
    ],
  }),
  component: MemoriesPage,
});

function MemoriesPage() {
  const { memories, createMemory, deleteMemory, isLoading } = useMemories();
  const { t } = useLanguage();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"Family" | "Places" | "Celebrations">("Family");
  const [location, setLocation] = useState("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryLabels = {
    Family: t("memories:family"),
    Places: t("memories:places"),
    Celebrations: t("memories:celebrations"),
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
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setImageBase64(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsCreating(true);
    try {
      await createMemory({
        title: title.trim(),
        description: description.trim(),
        tags: [category],
        location: location.trim() || undefined,
        image_url: imageBase64 || undefined,
      });

      toast.success(t("memories:memorySaved"));
      setIsAddOpen(false);
      setTitle("");
      setDescription("");
      setLocation("");
      setImageBase64("");
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to create memory"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
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
    <AppShell>
      <div className="px-4 sm:px-8 py-6 max-w-[1550px] w-full mx-auto space-y-7">
        {/* Navigation Breadcrumb & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            asChild
            variant="outline"
            className="rounded-full bg-[#121D2B] border-white/8 text-[#E8ECEF] hover:bg-[#152335] shadow-sm font-semibold"
          >
            <Link to="/">
              <ArrowLeft size={18} className="mr-2 text-[#6FAF9A]" /> {t("common:backHome")}
            </Link>
          </Button>

          {/* Add Memory Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                size="touch"
                className="rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] text-base font-bold shadow-md"
              >
                <Plus size={20} className="mr-2" /> {t("memories:addMemory")}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#121D2B] border border-white/10 text-[#E8ECEF] max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl font-bold text-[#E8ECEF]">
                  {t("memories:addMemoryDialogTitle")}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddMemory} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="mem-title" className="text-sm font-bold text-[#E8ECEF]">
                    {t("memories:memoryTitle")}
                  </Label>
                  <Input
                    id="mem-title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Diwalis with Family in Jaipur"
                    className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-xl mt-1 focus:border-[#6FAF9A]"
                  />
                </div>

                <div>
                  <Label className="text-sm font-bold text-[#E8ECEF] mb-1 block">
                    {t("memories:category")}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Family", "Places", "Celebrations"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          category === cat
                            ? "bg-[#6FAF9A] text-[#0A1420] shadow-sm"
                            : "bg-[#0A1420] border border-white/10 text-[#8A99A8] hover:text-[#E8ECEF]"
                        }`}
                      >
                        {categoryLabels[cat] || cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="mem-loc" className="text-sm font-bold text-[#E8ECEF]">
                    {t("memories:location")}
                  </Label>
                  <Input
                    id="mem-loc"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Shimla / Home Veranda"
                    className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-xl mt-1 focus:border-[#6FAF9A]"
                  />
                </div>

                <div>
                  <Label htmlFor="mem-desc" className="text-sm font-bold text-[#E8ECEF]">
                    {t("memories:description")}
                  </Label>
                  <Textarea
                    id="mem-desc"
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe who was there, how it felt, or familiar sights…"
                    className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-xl mt-1 focus:border-[#6FAF9A]"
                  />
                </div>

                <div>
                  <Label className="text-sm font-bold text-[#E8ECEF] mb-1 block">
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
                      className="rounded-full border-white/10 text-[#E8ECEF] bg-[#0A1420] hover:bg-white/5"
                    >
                      <ImageIcon size={18} className="mr-2 text-[#6FAF9A]" />{" "}
                      {t("memories:uploadPhoto")}
                    </Button>
                    {imageBase64 && (
                      <span className="text-xs text-[#6FAF9A] font-bold">Photo attached</span>
                    )}
                  </div>
                  {imageBase64 && (
                    <div className="mt-2 relative rounded-2xl overflow-hidden border border-white/10 max-h-40">
                      <img src={imageBase64} alt="Preview" className="w-full h-36 object-cover" />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                    className="rounded-full border-white/10 text-[#8A99A8] hover:text-[#E8ECEF] bg-[#0A1420]"
                  >
                    {t("common:cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] font-bold"
                  >
                    {isCreating ? t("common:loading") : t("memories:saveMemory")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Title Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-[#13283E] via-[#0F2032] to-[#0A1420] p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-[#6FAF9A]/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-[#6FAF9A] text-[#0A1420] shadow-md shrink-0">
              <Heart size={34} />
            </span>
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#E8ECEF]">
                {t("memories:pageTitle")}
              </h1>
              <p className="text-[#8A99A8] mt-1 font-medium text-sm sm:text-base">
                {t("memories:pageSubtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Memory Grid / Empty State */}
        {isLoading ? (
          <div className="py-20 text-center text-[#8A99A8] text-xl font-medium">
            {t("common:loading")}
          </div>
        ) : memories.length === 0 ? (
          <div className="rounded-3xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md p-12 text-center shadow-md">
            <span className="flex size-20 items-center justify-center rounded-full bg-rose-500/15 text-rose-400 mx-auto mb-4 border border-rose-500/30">
              <Heart size={40} />
            </span>
            <h2 className="text-2xl font-bold text-[#E8ECEF]">{t("memories:emptyMemories")}</h2>
            <p className="mt-2 text-lg text-[#8A99A8] max-w-md mx-auto">
              {t("dashboard:memoriesEmptyDesc")}
            </p>
            <Button
              size="touch"
              onClick={() => setIsAddOpen(true)}
              className="mt-6 text-base font-bold rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] shadow-md"
            >
              <Plus size={20} className="mr-2" /> {t("dashboard:createFirstMemory")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {memories.map((m) => {
              const tag = m.tags && m.tags.length > 0 ? m.tags[0] : "Memory";
              const localizedTag = categoryLabels[tag as keyof typeof categoryLabels] || tag;
              const voiceText = `${m.title}. ${m.description}`;
              return (
                <article
                  key={m.id}
                  className="rounded-2xl border border-white/8 bg-[#121D2B]/85 backdrop-blur-md overflow-hidden shadow-md hover:border-white/15 transition duration-300 flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={m.image_url || defaultMemoryPhoto}
                      alt={m.title}
                      className="h-48 w-full object-cover border-b border-white/5"
                    />
                    <div className="p-6">
                      <div className="flex items-center justify-between text-xs font-bold text-[#6FAF9A] mb-2">
                        <span className="uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#6FAF9A]/15 text-[#6FAF9A] border border-[#6FAF9A]/30">
                          {localizedTag}
                        </span>
                        {m.location && (
                          <span className="text-[#8A99A8] font-medium">{m.location}</span>
                        )}
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-[#E8ECEF] mb-2 leading-tight">
                        {m.title}
                      </h2>
                      <p className="text-[#8A99A8] text-sm leading-relaxed">{m.description}</p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-white/5 mt-4 flex items-center gap-2">
                    <Button
                      type="button"
                      size="touch"
                      onClick={() => handleSpeak(voiceText)}
                      className="flex-1 text-sm sm:text-base font-bold gap-2 mt-4 rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] shadow-md"
                    >
                      <Volume2 size={18} /> {t("memories:listenRecollection")}
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMemory(m.id)}
                      className="mt-4 p-3 rounded-full border border-white/10 bg-[#0A1420] text-[#8A99A8] hover:text-[#E85D6B] hover:border-[#E85D6B]/40 transition shadow-sm cursor-pointer"
                      title={t("common:delete")}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
