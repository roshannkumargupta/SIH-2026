import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTasks } from "@/hooks/use-tasks";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import type { TaskPriority } from "@/types/api";
import { formatApiError } from "@/api/client";

export const Route = createFileRoute("/routine")({
  head: () => ({
    meta: [
      { title: "Daily Routine & Activities | SmritiSetu" },
      {
        name: "description",
        content: "Track and organize gentle daily routines and healthy habits on SmritiSetu.",
      },
    ],
  }),
  component: RoutinePage,
});

function RoutinePage() {
  const { todayTasks, toggleTask, deleteTask, createTask, isLoading } = useTasks();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTasks = todayTasks.filter((task) => {
    if (filter === "pending") return task.status !== "completed";
    if (filter === "completed") return task.status === "completed";
    return true;
  });

  const handleToggle = async (taskId: string) => {
    try {
      await toggleTask(taskId);
      toast.success(t("routine:taskUpdated"));
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to update activity"));
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast.success(t("routine:taskDeleted"));
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to delete task"));
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!user) {
      toast.error("Please sign in to add a routine activity.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask({
        patient_id: user.id,
        title: title.trim(),
        scheduled_time: scheduledTime.length === 5 ? `${scheduledTime}:00` : scheduledTime,
        description: description.trim() || undefined,
        priority,
        recurrence: "daily",
        start_date: new Date().toISOString().split("T")[0],
      });

      toast.success(t("routine:taskCreated"));
      setIsAddOpen(false);
      setTitle("");
      setDescription("");
      setScheduledTime("10:00");
      setPriority("normal");
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to create activity"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filterLabels = {
    all: t("routine:all"),
    pending: t("routine:pending"),
    completed: t("routine:completed"),
  };

  const priorityLabels = {
    low: t("routine:low"),
    normal: t("routine:normal"),
    high: t("routine:high"),
  };

  return (
    <AppShell>
      <div className="px-4 sm:px-8 py-6 max-w-[1550px] w-full mx-auto space-y-7">
        {/* Navigation Breadcrumb & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button asChild variant="outline" size="default" className="rounded-full bg-[#121D2B] border-white/8 text-[#E8ECEF] hover:bg-[#152335] shadow-sm font-semibold">
            <Link to="/">
              <ArrowLeft size={16} className="mr-1.5 text-[#6FAF9A]" /> {t("common:backHome")}
            </Link>
          </Button>

          {/* Add Activity Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="default" className="rounded-full text-sm font-bold shadow-md bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A]">
                <Plus size={16} className="mr-1.5" /> {t("routine:addTask")}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#121D2B] border border-white/10 text-[#E8ECEF] max-w-md rounded-3xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl font-bold text-[#E8ECEF]">
                  {t("routine:addTaskDialogTitle")}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateTask} className="space-y-4 mt-3">
                <div>
                  <Label htmlFor="task-title" className="text-xs font-bold text-[#E8ECEF]">
                    {t("routine:taskTitle")}
                  </Label>
                  <Input
                    id="task-title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Afternoon Tea with Family"
                    className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] mt-1 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="task-time" className="text-xs font-bold text-[#E8ECEF]">
                    {t("routine:scheduledTime")}
                  </Label>
                  <Input
                    id="task-time"
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-[#0A1420] border-white/10 text-[#E8ECEF] mt-1 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="task-desc" className="text-xs font-bold text-[#E8ECEF]">
                    {t("routine:description")}
                  </Label>
                  <Input
                    id="task-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Sit in the balcony garden"
                    className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] mt-1 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-[#E8ECEF] mb-1 block">
                    {t("routine:priority")}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["low", "normal", "high"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${
                          priority === p
                            ? "bg-[#6FAF9A] text-[#0A1420] shadow-sm"
                            : "bg-[#0A1420] border border-white/10 text-[#8A99A8] hover:text-[#E8ECEF]"
                        }`}
                      >
                        {priorityLabels[p] || p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddOpen(false)}
                    className="rounded-full text-[#8A99A8] hover:text-[#E8ECEF]"
                  >
                    {t("common:cancel")}
                  </Button>
                  <Button type="submit" variant="default" disabled={isSubmitting} className="rounded-full bg-[#6FAF9A] text-[#0A1420] font-bold hover:bg-[#5E9E8A]">
                    {isSubmitting ? t("common:loading") : t("routine:saveTask")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Page Title Glass Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-[#13283E] via-[#0F2032] to-[#0A1420] p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-[#6FAF9A]/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-[#6FAF9A] text-[#0A1420] shadow-md shrink-0">
                <CalendarDays size={30} />
              </span>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#E8ECEF]">
                  {t("routine:pageTitle")}
                </h1>
                <p className="text-[#8A99A8] text-sm font-medium mt-0.5">{t("routine:pageSubtitle")}</p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-[#121D2B] p-1.5 rounded-full border border-white/8 shadow-sm">
              {(["all", "pending", "completed"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    filter === f ? "bg-[#6FAF9A] text-[#0A1420] shadow-md" : "text-[#8A99A8] hover:text-[#E8ECEF]"
                  }`}
                >
                  {filterLabels[f] || f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3.5">
          {isLoading ? (
            <div className="py-12 text-center text-[#8A99A8] text-base">{t("common:loading")}</div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-3xl border border-white/8 bg-[#121D2B]/85 p-12 text-center text-[#8A99A8] shadow-md backdrop-blur-md">
              <CalendarDays size={40} className="mx-auto text-[#6FAF9A]/40 mb-3" />
              <h2 className="font-display text-xl font-bold text-[#E8ECEF]">
                {t("dashboard:noRoutineScheduled")}
              </h2>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isDone = task.status === "completed";
              return (
                <article
                  key={task.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition shadow-md backdrop-blur-md flex items-center justify-between gap-4 ${
                    isDone
                      ? "border-[#6FAF9A]/30 bg-[#121D2B]/90 text-[#E8ECEF]"
                      : "border-white/8 bg-[#121D2B]/85 text-[#E8ECEF] hover:border-white/15"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(task.id)}
                    className="flex items-center gap-3.5 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full border transition ${
                        isDone
                          ? "border-[#6FAF9A] bg-[#6FAF9A] text-[#0A1420] shadow-sm"
                          : "border-white/20 text-transparent bg-[#0A1420] shadow-sm"
                      }`}
                    >
                      {isDone && <Check size={16} strokeWidth={3} />}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`font-display text-lg sm:text-xl font-bold truncate ${
                            isDone ? "line-through opacity-70" : ""
                          }`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            task.priority === "high"
                              ? "bg-[#E85D6B]/15 text-[#E85D6B] border border-[#E85D6B]/30"
                              : task.priority === "low"
                                ? "bg-white/5 text-[#8A99A8] border border-white/10"
                                : "bg-[#E0A23B]/15 text-[#E0A23B] border border-[#E0A23B]/30"
                          }`}
                        >
                          {priorityLabels[task.priority] || task.priority}
                        </span>
                      </div>

                      <p className="text-[#6FAF9A] font-bold mt-0.5 text-xs sm:text-sm">
                        {task.scheduled_time.slice(0, 5)}
                      </p>

                      {task.description && (
                        <p className="text-[#8A99A8] text-xs mt-0.5 truncate">{task.description}</p>
                      )}
                    </div>
                  </button>

                  {/* Caregiver/Doctor Delete Button */}
                  {(user?.role === "caretaker" || user?.role === "doctor") && (
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      className="size-9 flex items-center justify-center rounded-full text-[#8A99A8] hover:text-[#E85D6B] hover:bg-white/5 transition cursor-pointer"
                      title={t("common:delete")}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
