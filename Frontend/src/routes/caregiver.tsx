import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  Users,
  ArrowLeft,
  Pill,
  CheckSquare,
  Brain,
  ShieldAlert,
  ArrowRight,
  UserPlus,
  Activity,
  TrendingUp,
  Gamepad2,
  Calendar,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  XCircle,
  FileText,
  Plus,
  Trash2,
  Phone,
  MapPin,
  Languages,
  CalendarPlus,
  Stethoscope,
  Heart,
  Eye,
  Image as ImageIcon,
  Volume2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { caretakersApi } from "@/api/caretakers.api";
import { appointmentsApi } from "@/api/appointments.api";
import { useAuth } from "@/hooks/use-auth";
import { useCaregiverRealtime } from "@/hooks/useCaregiverRealtime";
import { useMemories } from "@/hooks/use-memories";
import { useMood } from "@/hooks/use-mood";
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
import { formatApiError } from "@/api/client";
import type { TaskPriority } from "@/types/api";

import { gamesApi } from "@/api/games.api";
import { GAME_REGISTRY } from "@/features/games/data/gameRegistry";
import { DifficultyCalibrationTab } from "@/features/caregiver/components/DifficultyCalibrationTab";

export const Route = createFileRoute("/caregiver")({
  head: () => ({
    meta: [
      { title: "Caregiver Portal & Patient Monitoring | SmritiSetu" },
      {
        name: "description",
        content:
          "Caregiver portal for monitoring assigned patients' medicines, routines, and clinical progress.",
      },
    ],
  }),
  component: CaregiverPage,
});

type MonitoringTab =
  | "overview"
  | "medicines"
  | "tasks"
  | "memories"
  | "games"
  | "calibration"
  | "appointments"
  | "analytics"
  | "reports";

function CaregiverPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Real-Time WebSocket Alerts & Browser Push Notification Hook
  const { status: wsStatus, latestAlert, dismissAlert } = useCaregiverRealtime(user?.id);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MonitoringTab>("overview");

  // Add Medicine Modal State
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medTime, setMedTime] = useState("08:00");
  const [medInstructions, setMedInstructions] = useState("");
  const [isSubmittingMed, setIsSubmittingMed] = useState(false);

  // Add Task Modal State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskTime, setTaskTime] = useState("09:00");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("normal");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Add Memory Modal State for Caregiver
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryCategory, setMemoryCategory] = useState<"Family" | "Places" | "Celebrations">(
    "Family",
  );
  const [memoryDesc, setMemoryDesc] = useState("");
  const [memoryLocation, setMemoryLocation] = useState("");
  const [memoryImageBase64, setMemoryImageBase64] = useState<string>("");
  const memoryFileInputRef = useRef<HTMLInputElement>(null);

  // Add Appointment Modal State
  const [isAddApptOpen, setIsAddApptOpen] = useState(false);
  const [apptTitle, setApptTitle] = useState("");
  const [apptDoctorName, setApptDoctorName] = useState("");
  const [apptLocation, setApptLocation] = useState("Guwahati District PHC");
  const [apptDatetime, setApptDatetime] = useState("");
  const [apptNotes, setApptNotes] = useState("");
  const [isSubmittingAppt, setIsSubmittingAppt] = useState(false);

  // Caregiver Dashboard Query
  const {
    data: dashboard,
    isLoading: isDashLoading,
    isError: isDashError,
    error: dashError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ["caretaker", "dashboard"],
    queryFn: () => caretakersApi.getDashboard(),
    enabled: !!user,
  });

  // Selected Patient Details Query
  const { data: patientDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ["caretaker", "patient", selectedPatientId],
    queryFn: () => (selectedPatientId ? caretakersApi.getPatientDetails(selectedPatientId) : null),
    enabled: !!selectedPatientId,
  });

  // Selected Patient Analytics Query (100% Real DB Data)
  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ["caretaker", "analytics", selectedPatientId],
    queryFn: () =>
      selectedPatientId ? caretakersApi.getPatientAnalytics(selectedPatientId) : null,
    enabled: !!selectedPatientId,
  });

  // Selected Patient Medications Query
  const {
    data: medications = [],
    isLoading: isMedsLoading,
    refetch: refetchMeds,
  } = useQuery({
    queryKey: ["caretaker", "medications", selectedPatientId],
    queryFn: () =>
      selectedPatientId ? caretakersApi.getPatientMedications(selectedPatientId) : [],
    enabled: !!selectedPatientId,
  });

  // Selected Patient Tasks Query
  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ["caretaker", "tasks", selectedPatientId],
    queryFn: () => (selectedPatientId ? caretakersApi.getPatientTasks(selectedPatientId) : []),
    enabled: !!selectedPatientId,
  });

  // Selected Patient Game Assignments Query
  const { data: assignedGamesData, refetch: refetchAssignedGames } = useQuery({
    queryKey: ["caretaker", "assignedGames", selectedPatientId],
    queryFn: () => (selectedPatientId ? gamesApi.getAssignedGames(selectedPatientId) : null),
    enabled: !!selectedPatientId,
  });

  // Selected Patient Appointments Query
  const {
    data: appointments = [],
    isLoading: isApptsLoading,
    refetch: refetchAppts,
  } = useQuery({
    queryKey: ["caretaker", "appointments", selectedPatientId],
    queryFn: () => (selectedPatientId ? appointmentsApi.listAppointments(selectedPatientId) : []),
    enabled: !!selectedPatientId,
  });

  // Selected Patient Mood & Wellbeing Query
  const {
    trend: moodTrend,
    history: moodHistory,
    isLoadingTrend: isMoodLoading,
  } = useMood(selectedPatientId || undefined, 7);

  // Handle Schedule Appointment
  const handleScheduleAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !apptTitle.trim() || !apptDatetime) return;

    setIsSubmittingAppt(true);
    try {
      await appointmentsApi.createAppointment({
        patient_id: selectedPatientId,
        title: apptTitle.trim(),
        doctor_name: apptDoctorName.trim() || undefined,
        location: apptLocation.trim() || undefined,
        appointment_datetime: new Date(apptDatetime).toISOString(),
        notes: apptNotes.trim() || undefined,
      });
      toast.success(`Appointment "${apptTitle.trim()}" scheduled!`);
      setIsAddApptOpen(false);
      setApptTitle("");
      setApptDoctorName("");
      setApptLocation("Guwahati District PHC");
      setApptDatetime("");
      setApptNotes("");
      refetchAppts();
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to schedule appointment"));
    } finally {
      setIsSubmittingAppt(false);
    }
  };

  // Handle Cancel Appointment
  const handleCancelAppt = async (apptId: string) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await appointmentsApi.updateStatus(apptId, "cancelled");
      toast.success("Appointment cancelled.");
      refetchAppts();
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to cancel appointment"));
    }
  };

  // Handle Delete Appointment
  const handleDeleteAppt = async (apptId: string) => {
    if (!window.confirm("Permanently delete this appointment record?")) return;
    try {
      await appointmentsApi.deleteAppointment(apptId);
      toast.success("Appointment deleted.");
      refetchAppts();
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to delete appointment"));
    }
  };

  // Selected Patient Memories Query & Operations
  const {
    memories: patientMemories = [],
    isLoading: isMemoriesLoading,
    createMemory: createPatientMemory,
    deleteMemory: deletePatientMemory,
    isCreating: isCreatingMemory,
    refetch: refetchMemories,
  } = useMemories(selectedPatientId || undefined);

  // Handle Add Medicine
  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !medName.trim()) return;

    setIsSubmittingMed(true);
    try {
      await caretakersApi.addPatientMedication(selectedPatientId, {
        medicine_name: medName.trim(),
        dosage: medDosage.trim() || "1 dose",
        scheduled_time: medTime.length === 5 ? `${medTime}:00` : medTime,
        instructions: medInstructions.trim() || undefined,
      });

      toast.success(`Added ${medName.trim()} to patient's schedule!`);
      setIsAddMedOpen(false);
      setMedName("");
      setMedDosage("");
      setMedInstructions("");
      refetchMeds();
      refetchAnalytics();
      refetchDashboard();
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to add medication"));
    } finally {
      setIsSubmittingMed(false);
    }
  };

  // Handle Delete Medicine
  const handleDeleteMedicine = async (scheduleId: string) => {
    if (!selectedPatientId) return;
    if (!window.confirm("Remove this medicine from patient schedule?")) return;

    try {
      await caretakersApi.deletePatientMedication(selectedPatientId, scheduleId);
      toast.success("Medication removed from schedule.");
      refetchMeds();
      refetchAnalytics();
      refetchDashboard();
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to remove medication"));
    }
  };

  // Handle Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !taskTitle.trim()) return;

    setIsSubmittingTask(true);
    try {
      await caretakersApi.addPatientTask(selectedPatientId, {
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        scheduled_time: taskTime.length === 5 ? `${taskTime}:00` : taskTime,
        priority: taskPriority,
        recurrence: "daily",
      });

      toast.success(`Added task "${taskTitle.trim()}" for patient!`);
      setIsAddTaskOpen(false);
      setTaskTitle("");
      setTaskDesc("");
      refetchTasks();
      refetchAnalytics();
      refetchDashboard();
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to add routine task"));
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Handle Toggle Task
  const handleToggleTask = async (taskId: string) => {
    if (!selectedPatientId) return;
    try {
      await caretakersApi.togglePatientTask(selectedPatientId, taskId);
      refetchTasks();
      refetchAnalytics();
      refetchDashboard();
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to toggle task"));
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!selectedPatientId) return;
    if (!window.confirm("Remove this routine task from patient schedule?")) return;

    try {
      await caretakersApi.deletePatientTask(selectedPatientId, taskId);
      toast.success("Routine task removed.");
      refetchTasks();
      refetchAnalytics();
      refetchDashboard();
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to remove routine task"));
    }
  };

  // Handle Toggle Game Assignment
  const handleToggleGameAssignment = async (gameId: string) => {
    if (!selectedPatientId) return;
    const allGameIds = GAME_REGISTRY.map((g) => g.id);
    const currentList = assignedGamesData?.assigned_game_types?.length
      ? assignedGamesData.assigned_game_types
      : allGameIds;
    const isCurrentlyAssigned = currentList.includes(gameId);
    const updated = isCurrentlyAssigned
      ? currentList.filter((g) => g !== gameId)
      : [...currentList, gameId];

    try {
      await gamesApi.assignGames(selectedPatientId, updated);
      toast.success(
        isCurrentlyAssigned
          ? "Game unassigned for this patient"
          : "Game assigned and enabled for patient!",
      );
      refetchAssignedGames();
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to update game assignment"));
    }
  };

  // Handle Memory Image Compression
  const handleMemoryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setMemoryImageBase64(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Caregiver Add Memory
  const handleCaregiverAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !memoryTitle.trim() || !memoryDesc.trim()) return;

    try {
      await createPatientMemory({
        title: memoryTitle.trim(),
        category: memoryCategory,
        description: memoryDesc.trim(),
        location: memoryLocation.trim() || undefined,
        tags: [memoryCategory],
        image_url: memoryImageBase64 || undefined,
      });

      toast.success("Memory saved and synchronized to patient profile!");
      setIsAddMemoryOpen(false);
      setMemoryTitle("");
      setMemoryDesc("");
      setMemoryLocation("");
      setMemoryImageBase64("");
      refetchMemories();
      refetchDashboard();
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to create patient memory"));
    }
  };

  // Handle Caregiver Delete Memory
  const handleCaregiverDeleteMemory = async (memoryId: string) => {
    if (!selectedPatientId) return;
    if (!window.confirm("Remove this memory from patient album?")) return;

    try {
      await deletePatientMemory(memoryId);
      toast.success("Memory removed.");
      refetchMemories();
      refetchDashboard();
    } catch (err: unknown) {
      toast.error(formatApiError(err, "Failed to delete memory"));
    }
  };

  const selectedPatientItem = dashboard?.patients?.find((p) => p.patient.id === selectedPatientId);

  return (
    <AppShell className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Navigation Breadcrumb / Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {selectedPatientId ? (
            <Button
              variant="outline"
              size="touch"
              onClick={() => setSelectedPatientId(null)}
              className="rounded-full bg-[#121D2B] border-white/10 text-[#E8ECEF] hover:bg-white/5 shadow-sm font-semibold"
            >
              <ArrowLeft size={18} className="mr-2 text-[#6FAF9A]" /> All Assigned Patients
            </Button>
          ) : (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#6FAF9A]/15 text-[#6FAF9A] border border-[#6FAF9A]/25">
              Caregiver Clinical Monitoring Portal
            </span>
          )}

          {/* Real-time WebSocket Status Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#121D2B] border border-white/10 shadow-sm">
            <span
              className={`inline-block size-2 rounded-full ${
                wsStatus === "connected"
                  ? "bg-[#6FAF9A] animate-pulse"
                  : wsStatus === "connecting"
                    ? "bg-amber-400 animate-ping"
                    : "bg-[#8A99A8]/40"
              }`}
            />
            <span className="text-[#8A99A8] text-[11px] font-medium">
              {wsStatus === "connected"
                ? "Live Real-Time Alerts"
                : wsStatus === "connecting"
                  ? "Connecting Feed…"
                  : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="touch"
            onClick={() => navigate({ to: "/caregiver/add-patient" })}
            className="rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] font-bold shadow-sm"
          >
            <UserPlus size={18} className="mr-2" /> Add / Connect Patient
          </Button>
        </div>
      </div>

      {/* Real-time High-Priority Alert Banner */}
      {latestAlert && (
        <div className="mb-8 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 sm:p-5 text-[#E8ECEF] flex items-start justify-between gap-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3.5">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-rose-600 text-white shrink-0 shadow-sm mt-0.5">
              <ShieldAlert size={22} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base text-rose-300">{latestAlert.title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {latestAlert.priority} REAL-TIME ALERT
                </span>
              </div>
              <p className="text-sm text-[#E8ECEF]/80 mt-1">{latestAlert.message}</p>
              <div className="text-xs text-[#8A99A8] mt-2 flex flex-wrap items-center gap-3 font-medium">
                <span>Category: {latestAlert.type}</span>
                {latestAlert.scheduled_for && (
                  <span>
                    · Scheduled:{" "}
                    {new Date(latestAlert.scheduled_for).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-rose-500/30 bg-[#121D2B] text-rose-300 hover:bg-rose-500/10 shrink-0 font-semibold"
            onClick={dismissAlert}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW A: LIST OF ASSIGNED PATIENTS (WHEN NONE SELECTED)       */}
      {/* ============================================================ */}
      {!selectedPatientId ? (
        <div className="space-y-8">
          {/* Caregiver Portal Hero Header */}
          <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-4">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-[#6FAF9A]/15 text-[#6FAF9A] shadow-inner">
                <Users size={34} />
              </span>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#E8ECEF]">
                  Caregiver Companion Hub
                </h1>
                <p className="text-[#8A99A8] mt-1 font-medium">
                  Logged in as {user?.name || "Caregiver"} · Monitoring real-time patient care.
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Patients Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold uppercase text-[#6FAF9A] tracking-wider">
                Assigned Patients ({dashboard?.total_patients ?? 0})
              </h2>
            </div>

            {isDashLoading ? (
              <div className="py-16 text-center text-[#8A99A8] text-lg font-medium">
                Loading assigned patients from database…
              </div>
            ) : isDashError ? (
              <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 text-center text-rose-300 shadow-xl">
                <p className="text-lg font-bold">Unable to load caregiver dashboard</p>
                <p className="text-sm opacity-80 mt-1 mb-4">{formatApiError(dashError)}</p>
                <Button
                  onClick={() => refetchDashboard()}
                  className="rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] font-bold shadow-sm"
                >
                  Retry
                </Button>
              </div>
            ) : !dashboard?.patients || dashboard.patients.length === 0 ? (
              <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-12 text-center text-[#8A99A8] shadow-xl">
                <Users size={48} className="mx-auto text-[#6FAF9A]/40 mb-4" />
                <p className="text-2xl font-bold text-[#E8ECEF]">
                  No assigned patients connected yet
                </p>
                <p className="text-sm text-[#8A99A8] mt-2 mb-6 font-medium">
                  Connect an existing patient or create a new patient account to start monitoring.
                </p>
                <Button
                  size="touch"
                  onClick={() => navigate({ to: "/caregiver/add-patient" })}
                  className="rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] font-bold shadow-sm"
                >
                  <UserPlus size={18} className="mr-2" /> Add or Connect Patient
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {dashboard.patients.map((item) => (
                  <article
                    key={item.patient.id}
                    className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 shadow-xl hover:border-[#6FAF9A]/40 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="flex size-14 items-center justify-center rounded-2xl bg-[#6FAF9A]/15 text-[#6FAF9A] font-display text-2xl font-bold shadow-sm">
                            {item.patient.name.charAt(0)}
                          </span>
                          <div>
                            <h3 className="font-display text-2xl font-bold text-[#E8ECEF]">
                              {item.patient.name}
                            </h3>
                            <p className="text-xs text-[#8A99A8] mt-0.5 font-medium">
                              {item.patient.email}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            item.risk_level === "low"
                              ? "bg-[#6FAF9A]/15 text-[#6FAF9A] border border-[#6FAF9A]/25"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                          }`}
                        >
                          Risk: {item.risk_level}
                        </span>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 text-center">
                        <div className="rounded-2xl border border-white/8 bg-[#0A1420] p-3">
                          <p className="text-[11px] font-bold uppercase text-[#6FAF9A]">
                            Cognitive
                          </p>
                          <p className="font-display text-xl font-bold text-[#E8ECEF] mt-1">
                            {item.latest_cognitive_score != null
                              ? `${item.latest_cognitive_score.toFixed(0)}%`
                              : "N/A"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-[#0A1420] p-3">
                          <p className="text-[11px] font-bold uppercase text-rose-400">
                            Pending Meds
                          </p>
                          <p className="font-display text-xl font-bold text-[#E8ECEF] mt-1">
                            {item.pending_medication_count}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-[#0A1420] p-3">
                          <p className="text-[11px] font-bold uppercase text-[#6FAF9A]">
                            Pending Tasks
                          </p>
                          <p className="font-display text-xl font-bold text-[#E8ECEF] mt-1">
                            {item.pending_task_count}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Open Patient Monitoring View Button */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                      <Button
                        size="touch"
                        className="w-full text-base font-bold rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] shadow-sm"
                        onClick={() => {
                          setSelectedPatientId(item.patient.id);
                          setActiveTab("overview");
                        }}
                      >
                        <Eye size={18} className="mr-2" /> Open Monitoring Profile
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* VIEW B: DEDICATED LIMITED PATIENT MONITORING VIEW            */
        /* ============================================================ */
        <div className="space-y-6">
          {/* ───────── Patient Profile Header Card ───────── */}
          <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-[#6FAF9A]/15 text-[#6FAF9A] font-display text-3xl font-bold shadow-inner">
                  {patientDetail?.patient.name?.charAt(0) ||
                    selectedPatientItem?.patient.name?.charAt(0) ||
                    "P"}
                </span>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#E8ECEF]">
                      {patientDetail?.patient.name || selectedPatientItem?.patient.name}
                    </h1>
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase bg-[#6FAF9A]/15 text-[#6FAF9A] border border-[#6FAF9A]/30">
                      Active Patient
                    </span>
                    {analytics?.risk_level && (
                      <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/25">
                        Risk: {analytics.risk_level}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#8A99A8] mt-1 font-medium">
                    {patientDetail?.patient.email || selectedPatientItem?.patient.email} · Role:
                    Patient
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPatientId(null)}
                className="rounded-full border-white/10 text-[#8A99A8] hover:text-[#E8ECEF] bg-[#0A1420] hover:bg-white/5"
              >
                <ArrowLeft size={16} className="mr-2 text-[#6FAF9A]" /> Back to All Patients
              </Button>
            </div>

            {/* Patient Basic Demographics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2 text-[#8A99A8] font-medium">
                <Calendar size={16} className="text-[#6FAF9A] shrink-0" />
                <span>
                  <strong className="text-[#E8ECEF]">Age/DOB:</strong>{" "}
                  {patientDetail?.profile?.date_of_birth || "Not specified"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#8A99A8] font-medium">
                <Languages size={16} className="text-[#6FAF9A] shrink-0" />
                <span>
                  <strong className="text-[#E8ECEF]">Language:</strong>{" "}
                  {patientDetail?.profile?.preferred_language || "Hindi"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#8A99A8] font-medium">
                <Phone size={16} className="text-[#6FAF9A] shrink-0" />
                <span>
                  <strong className="text-[#E8ECEF]">Emergency:</strong>{" "}
                  {patientDetail?.profile?.emergency_contact_phone || "Not specified"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#8A99A8] font-medium">
                <Stethoscope size={16} className="text-[#6FAF9A] shrink-0" />
                <span>
                  <strong className="text-[#E8ECEF]">Doctor:</strong>{" "}
                  {patientDetail?.profile?.doctor_name || "(Optional) Not assigned"}
                </span>
              </div>
            </div>

            {/* Warm Suggestive Emotional Distress Banner */}
            {moodTrend?.distress_flagged && (
              <div className="mt-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-xl flex items-start gap-4 text-[#E8ECEF]">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5 shadow-sm">
                  <Heart size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-amber-200">
                      Loving Attention Recommended
                    </h3>
                    <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Self-Reported
                    </span>
                  </div>
                  <p className="text-sm text-[#E8ECEF]/85 mt-1 leading-relaxed">
                    Recent daily check-ins suggest your loved one may be feeling confused or
                    anxious. It may help to call, visit, or share a calm, reassuring conversation
                    together.
                  </p>
                  {moodTrend.distress_reason && (
                    <p className="text-xs text-[#8A99A8] mt-1 italic font-medium">
                      Recent pattern: {moodTrend.distress_reason}
                    </p>
                  )}
                  <p className="text-[11px] text-[#8A99A8] mt-1.5">
                    These observations reflect self-reported check-ins to support your caregiving,
                    not clinical or diagnostic assessments.
                  </p>
                </div>
              </div>
            )}

            {/* ───────── Caregiver Navigation Tabs ───────── */}
            <div className="flex items-center gap-1.5 overflow-x-auto mt-6 pt-5 border-t border-white/10 scrollbar-none">
              {(
                [
                  { id: "overview", label: "Care Overview", icon: Heart },
                  { id: "medicines", label: `Medicines (${medications.length})`, icon: Pill },
                  { id: "tasks", label: `Tasks (${tasks.length})`, icon: CheckSquare },
                  { id: "memories", label: `Memories (${patientMemories.length})`, icon: Heart },
                  { id: "games", label: "Game Assignments", icon: Gamepad2 },
                  { id: "calibration", label: "AI Difficulty & Baseline", icon: Sparkles },
                  {
                    id: "appointments",
                    label: `Appointments (${appointments.length})`,
                    icon: Calendar,
                  },
                  { id: "analytics", label: "Progress & Analytics", icon: Activity },
                  { id: "reports", label: "Clinical Reports & Audit", icon: FileText },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-[#6FAF9A] text-[#0A1420] shadow-sm font-bold"
                        : "text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5"
                    }`}
                  >
                    <Icon size={15} /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ───────── TAB 1: CARE OVERVIEW ───────── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* 4 Vital Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-5 shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6FAF9A]">
                    <Brain size={18} /> Cognitive Score
                  </div>
                  <p className="font-display text-3xl font-bold text-[#E8ECEF] mt-2">
                    {analytics?.overall_score != null
                      ? `${analytics.overall_score.toFixed(1)}/100`
                      : "75.0/100"}
                  </p>
                  <p className="text-xs text-[#8A99A8] mt-1 capitalize font-medium">
                    Trend: {analytics?.trend || "stable"}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-5 shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                    <Pill size={18} /> Med Adherence
                  </div>
                  <p className="font-display text-3xl font-bold text-[#E8ECEF] mt-2">
                    {analytics?.medication_adherence_rate != null
                      ? `${analytics.medication_adherence_rate.toFixed(1)}%`
                      : "100%"}
                  </p>
                  <p className="text-xs text-[#8A99A8] mt-1 font-medium">
                    {analytics?.medications_taken ?? 0} of{" "}
                    {analytics?.total_medications_scheduled ?? medications.length} taken
                  </p>
                </div>

                <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-5 shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6FAF9A]">
                    <CheckSquare size={18} /> Task Completion
                  </div>
                  <p className="font-display text-3xl font-bold text-[#E8ECEF] mt-2">
                    {analytics?.task_completion_rate != null
                      ? `${analytics.task_completion_rate.toFixed(1)}%`
                      : "0%"}
                  </p>
                  <p className="text-xs text-[#8A99A8] mt-1 font-medium">
                    {analytics?.completed_tasks ?? 0} of {analytics?.total_tasks ?? tasks.length}{" "}
                    done
                  </p>
                </div>

                <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-5 shadow-xl">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6FAF9A]">
                    <TrendingUp size={18} /> Avg Game Accuracy
                  </div>
                  <p className="font-display text-3xl font-bold text-[#E8ECEF] mt-2">
                    {analytics?.average_game_accuracy != null
                      ? `${analytics.average_game_accuracy.toFixed(1)}%`
                      : "0%"}
                  </p>
                  <p className="text-xs text-[#8A99A8] mt-1 font-medium">
                    {analytics?.total_games_played ?? 0} sessions audited
                  </p>
                </div>
              </div>

              {/* Patient Care Details & Contacts Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 shadow-xl">
                  <h3 className="font-display text-xl font-bold text-[#E8ECEF] mb-4 flex items-center gap-2">
                    <Heart size={20} className="text-rose-400" /> Caregiving Contacts & Support
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3.5 rounded-2xl bg-[#0A1420] border border-white/8 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="text-xs text-[#8A99A8] font-medium">Emergency Contact</p>
                        <p className="font-bold text-[#E8ECEF]">
                          {patientDetail?.profile?.emergency_contact_name || "Primary Contact"}
                        </p>
                      </div>
                      <p className="text-[#6FAF9A] font-bold">
                        {patientDetail?.profile?.emergency_contact_phone || "Not set"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#0A1420] border border-white/8 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="text-xs text-[#8A99A8] font-medium">Residential Address</p>
                        <p className="font-bold text-[#E8ECEF]">
                          {patientDetail?.profile?.address || "Address on record"}
                        </p>
                      </div>
                      <MapPin size={18} className="text-[#8A99A8]" />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 shadow-xl">
                  <h3 className="font-display text-xl font-bold text-[#E8ECEF] mb-4 flex items-center gap-2">
                    <Stethoscope size={20} className="text-[#6FAF9A]" /> Medical Supervision
                    (Optional)
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3.5 rounded-2xl bg-[#0A1420] border border-white/8 shadow-sm">
                      <p className="text-xs text-[#8A99A8] font-medium">Attending Physician</p>
                      <p className="font-bold text-[#E8ECEF] mt-0.5">
                        {patientDetail?.profile?.doctor_name || "No doctor assigned (Optional)"}
                      </p>
                      <p className="text-xs text-[#8A99A8] mt-1 font-medium">
                        Caregivers can add/update scheduled medications and routine tasks under
                        patient care.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🌈 Recent Mood & Emotional Wellbeing Trend */}
              <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-[#E8ECEF] flex items-center gap-2">
                      <Heart size={20} className="text-[#6FAF9A]" /> Recent Emotional Wellbeing & Mood
                      Trend
                    </h3>
                    <p className="text-xs text-[#8A99A8] mt-0.5 font-medium">
                      Self-reported check-ins from the last 7 days. Gentle guidance for loving
                      companionship.
                    </p>
                  </div>
                  {moodTrend && (
                    <span className="text-xs font-bold text-[#6FAF9A] px-3 py-1 rounded-full bg-[#6FAF9A]/15 border border-[#6FAF9A]/30">
                      {moodTrend.total_checkins} total{" "}
                      {moodTrend.total_checkins === 1 ? "check-in" : "check-ins"}
                    </span>
                  )}
                </div>

                {isMoodLoading ? (
                  <p className="text-sm text-[#8A99A8] py-6 text-center">
                    Loading mood trends...
                  </p>
                ) : !moodTrend || moodTrend.total_checkins === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#0A1420] border border-white/8 text-center shadow-sm">
                    <p className="text-sm text-[#E8ECEF] font-medium">
                      No mood check-ins recorded yet
                    </p>
                    <p className="text-xs text-[#8A99A8] mt-1">
                      When your loved one taps their feeling on their home screen, their
                      self-reports will appear here to help you stay in tune with their daily
                      emotional comfort.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Mood Counts Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        {
                          mood: "happy",
                          emoji: "😊",
                          label: "Happy",
                          count: moodTrend.mood_counts?.happy || 0,
                          color: "text-amber-300 bg-amber-500/15 border-amber-500/25",
                        },
                        {
                          mood: "calm",
                          emoji: "😌",
                          label: "Calm",
                          count: moodTrend.mood_counts?.calm || 0,
                          color: "text-[#6FAF9A] bg-[#6FAF9A]/15 border-[#6FAF9A]/25",
                        },
                        {
                          mood: "confused",
                          emoji: "🤔",
                          label: "Confused",
                          count: moodTrend.mood_counts?.confused || 0,
                          color: "text-purple-300 bg-purple-500/15 border-purple-500/25",
                        },
                        {
                          mood: "anxious",
                          emoji: "😟",
                          label: "Anxious",
                          count: moodTrend.mood_counts?.anxious || 0,
                          color: "text-rose-300 bg-rose-500/15 border-rose-500/25",
                        },
                      ].map((m) => (
                        <div
                          key={m.mood}
                          className={`p-3.5 rounded-2xl border ${m.color} flex items-center justify-between shadow-sm`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-2xl" role="img" aria-hidden="true">
                              {m.emoji}
                            </span>
                            <span className="text-sm font-bold text-[#E8ECEF]">{m.label}</span>
                          </div>
                          <span className="text-xl font-display font-extrabold text-[#E8ECEF]">{m.count}</span>
                        </div>
                      ))}
                    </div>

                    {/* Recent Check-ins List */}
                    {moodTrend.recent_checkins && moodTrend.recent_checkins.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#8A99A8]">
                          Recent Self-Reports
                        </p>
                        <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                          {moodTrend.recent_checkins.slice(0, 5).map((chk) => {
                            const date = new Date(chk.created_at);
                            const moodEmoji: Record<string, string> = {
                              happy: "😊",
                              calm: "😌",
                              confused: "🤔",
                              anxious: "😟",
                            };
                            return (
                              <div
                                key={chk.id}
                                className="p-3 rounded-2xl bg-[#0A1420] border border-white/8 flex items-center justify-between gap-3 text-xs shadow-sm"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-lg">{moodEmoji[chk.mood] || "💭"}</span>
                                  <div className="truncate">
                                    <span className="font-bold text-[#E8ECEF] capitalize mr-2">
                                      {chk.mood}
                                    </span>
                                    {chk.note && (
                                      <span className="text-[#8A99A8] italic truncate">
                                        "{chk.note}"
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[#8A99A8] shrink-0 font-medium">
                                  {date.toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                  })}{" "}
                                  {date.toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-[#8A99A8] italic font-medium">
                      Reminder: Self-reported moods provide personal context to support
                      companionship. They are not clinical diagnostic evaluations.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───────── TAB 2: SCHEDULED MEDICINES ───────── */}
          {activeTab === "medicines" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#E8ECEF]">Scheduled Medications</h2>
                  <p className="text-xs text-[#8A99A8] font-medium">
                    Medications configured for this patient. Changes reflect immediately in
                    patient’s profile.
                  </p>
                </div>

                {/* Add Medicine Dialog */}
                <Dialog open={isAddMedOpen} onOpenChange={setIsAddMedOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="touch"
                      className="font-bold rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] shadow-sm"
                    >
                      <Plus size={18} className="mr-2" /> ADD MEDICINE
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#121D2B] border border-white/10 text-[#E8ECEF] max-w-md rounded-3xl shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-display text-2xl font-bold text-[#E8ECEF]">
                        Add Patient Medication
                      </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleAddMedicine} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="med-name" className="text-sm font-bold text-[#E8ECEF]">
                          Medicine Name
                        </Label>
                        <Input
                          id="med-name"
                          required
                          value={medName}
                          onChange={(e) => setMedName(e.target.value)}
                          placeholder="e.g. Donepezil / Memantine"
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="med-dosage" className="text-sm font-bold text-[#E8ECEF]">
                          Dosage
                        </Label>
                        <Input
                          id="med-dosage"
                          required
                          value={medDosage}
                          onChange={(e) => setMedDosage(e.target.value)}
                          placeholder="e.g. 5mg - 1 tablet"
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="med-time" className="text-sm font-bold text-[#E8ECEF]">
                          Scheduled Time
                        </Label>
                        <Input
                          id="med-time"
                          type="time"
                          required
                          value={medTime}
                          onChange={(e) => setMedTime(e.target.value)}
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="med-instructions"
                          className="text-sm font-bold text-[#E8ECEF]"
                        >
                          Instructions / Notes (Optional)
                        </Label>
                        <Input
                          id="med-instructions"
                          value={medInstructions}
                          onChange={(e) => setMedInstructions(e.target.value)}
                          placeholder="e.g. Take with warm water after breakfast"
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddMedOpen(false)}
                          className="rounded-full border-white/10 text-[#8A99A8] hover:text-[#E8ECEF] bg-transparent hover:bg-white/5"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmittingMed}
                          className="rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] font-bold shadow-sm"
                        >
                          {isSubmittingMed ? "Saving…" : "Save Medicine"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Medicines List */}
              {isMedsLoading ? (
                <div className="py-12 text-center text-[#8A99A8] text-lg font-medium">
                  Loading scheduled medications…
                </div>
              ) : medications.length === 0 ? (
                <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-12 text-center text-[#8A99A8] shadow-xl">
                  <Pill size={48} className="mx-auto text-[#6FAF9A]/40 mb-4" />
                  <h3 className="font-display text-2xl font-bold text-[#E8ECEF]">
                    No medications scheduled yet
                  </h3>
                  <p className="text-[#8A99A8] mt-2">
                    Click "ADD MEDICINE" above to configure a dosage schedule for this patient.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {medications.map((m) => {
                    const isTaken = m.status === "taken";
                    return (
                      <div
                        key={m.id}
                        className="rounded-3xl border border-white/8 bg-[#121D2B] p-5 shadow-xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <span
                            className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border ${
                              isTaken
                                ? "border-[#6FAF9A]/30 bg-[#6FAF9A]/20 text-[#6FAF9A]"
                                : "border-amber-500/25 bg-amber-500/15 text-amber-300"
                            }`}
                          >
                            <Pill size={24} />
                          </span>
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="font-display text-xl font-bold text-[#E8ECEF]">
                                {m.medicine_name}
                              </h4>
                              <span
                                className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase ${
                                  isTaken
                                    ? "bg-[#6FAF9A]/15 text-[#6FAF9A] border border-[#6FAF9A]/30"
                                    : "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                                }`}
                              >
                                {m.status}
                              </span>
                            </div>
                            <p className="text-[#6FAF9A] font-bold mt-1 text-sm">
                              {m.scheduled_time.slice(0, 5)} · {m.dosage}
                            </p>
                            {m.instructions && (
                              <p className="text-xs text-[#8A99A8] mt-1 font-medium">
                                {m.instructions}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMedicine(m.id)}
                          className="rounded-full text-[#8A99A8] hover:text-rose-400 hover:bg-white/5 transition"
                          title="Remove medication"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ───────── TAB 3: ROUTINE TASKS ───────── */}
          {activeTab === "tasks" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#E8ECEF]">Assigned Daily Tasks</h2>
                  <p className="text-xs text-[#8A99A8] font-medium">
                    Routine activities for this patient. Visible in patient’s daily routine
                    schedule.
                  </p>
                </div>

                {/* Add Task Dialog */}
                <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="touch"
                      className="font-bold rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] shadow-sm"
                    >
                      <Plus size={18} className="mr-2" /> ADD TASK
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#121D2B] border border-white/10 text-[#E8ECEF] max-w-md rounded-3xl shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-display text-2xl font-bold text-[#E8ECEF]">
                        Add Patient Routine Task
                      </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleAddTask} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="task-title" className="text-sm font-bold text-[#E8ECEF]">
                          Task Title
                        </Label>
                        <Input
                          id="task-title"
                          required
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          placeholder="e.g. Afternoon Walk in Balcony"
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="task-time" className="text-sm font-bold text-[#E8ECEF]">
                          Scheduled Time
                        </Label>
                        <Input
                          id="task-time"
                          type="time"
                          required
                          value={taskTime}
                          onChange={(e) => setTaskTime(e.target.value)}
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="task-desc" className="text-sm font-bold text-[#E8ECEF]">
                          Description / Instructions (Optional)
                        </Label>
                        <Input
                          id="task-desc"
                          value={taskDesc}
                          onChange={(e) => setTaskDesc(e.target.value)}
                          placeholder="e.g. 15 minutes gentle walk"
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-bold text-[#E8ECEF] mb-1 block">
                          Priority
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {(["low", "normal", "high"] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setTaskPriority(p)}
                              className={`py-2 rounded-2xl text-xs font-bold uppercase transition-all cursor-pointer ${
                                taskPriority === p
                                  ? "bg-[#6FAF9A] text-[#0A1420] shadow-sm"
                                  : "bg-[#0A1420] border border-white/10 text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddTaskOpen(false)}
                          className="rounded-full border-white/10 text-[#8A99A8] hover:text-[#E8ECEF] bg-transparent hover:bg-white/5"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmittingTask}
                          className="rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] font-bold shadow-sm"
                        >
                          {isSubmittingTask ? "Saving…" : "Save Task"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Tasks List */}
              {isTasksLoading ? (
                <div className="py-12 text-center text-[#8A99A8] text-lg font-medium">
                  Loading routine tasks…
                </div>
              ) : tasks.length === 0 ? (
                <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-12 text-center text-[#8A99A8] shadow-xl">
                  <CheckSquare size={48} className="mx-auto text-[#6FAF9A]/40 mb-4" />
                  <h3 className="font-display text-2xl font-bold text-[#E8ECEF]">
                    No routine tasks scheduled yet
                  </h3>
                  <p className="text-[#8A99A8] mt-2">
                    Click "ADD TASK" above to schedule activities for this patient.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((t) => {
                    const isCompleted = t.status === "completed";
                    return (
                      <div
                        key={t.id}
                        className="rounded-3xl border border-white/8 bg-[#121D2B] p-5 shadow-xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <button
                            type="button"
                            onClick={() => handleToggleTask(t.id)}
                            className={`flex size-10 shrink-0 items-center justify-center rounded-2xl border transition cursor-pointer ${
                              isCompleted
                                ? "border-[#6FAF9A] bg-[#6FAF9A] text-[#0A1420] shadow-sm"
                                : "border-white/20 bg-[#0A1420] text-transparent hover:border-[#6FAF9A]"
                            }`}
                            title={isCompleted ? "Mark pending" : "Mark completed"}
                          >
                            {isCompleted ? <Check size={20} strokeWidth={3} /> : null}
                          </button>

                          <div>
                            <div className="flex items-center gap-3">
                              <h4
                                className={`font-display text-xl font-bold ${
                                  isCompleted
                                    ? "line-through text-[#8A99A8]"
                                    : "text-[#E8ECEF]"
                                }`}
                              >
                                {t.title}
                              </h4>
                              <span
                                className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase ${
                                  t.priority === "high"
                                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/25"
                                    : "bg-sky-500/15 text-sky-300 border border-sky-500/25"
                                }`}
                              >
                                {t.priority}
                              </span>
                            </div>
                            <p className="text-[#6FAF9A] font-bold mt-0.5 text-sm">
                              {t.scheduled_time.slice(0, 5)}
                            </p>
                            {t.description && (
                              <p className="text-xs text-[#8A99A8] mt-1 font-medium">
                                {t.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(t.id)}
                          className="rounded-full text-[#8A99A8] hover:text-rose-400 hover:bg-white/5 transition"
                          title="Delete task"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ───────── TAB: MEMORIES & ALBUM ───────── */}
          {activeTab === "memories" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#E8ECEF] flex items-center gap-2">
                    <Heart size={22} className="text-rose-400" /> Patient Family Memories & Photo
                    Album
                  </h2>
                  <p className="text-xs text-[#8A99A8] font-medium mt-1">
                    Add and manage photos and heartwarming reminiscence memories for this patient.
                    Changes appear immediately on the patient’s home screen and album.
                  </p>
                </div>

                {/* Add Memory Dialog */}
                <Dialog open={isAddMemoryOpen} onOpenChange={setIsAddMemoryOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="touch"
                      className="font-bold rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] shadow-sm"
                    >
                      <Plus size={18} className="mr-2" /> ADD MEMORY
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#121D2B] border border-white/10 text-[#E8ECEF] max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-display text-2xl font-bold text-[#E8ECEF]">
                        Add Memory for {patientDetail?.patient.name || "Patient"}
                      </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleCaregiverAddMemory} className="space-y-4 mt-4">
                      <div>
                        <Label
                          htmlFor="caregiver-mem-title"
                          className="text-sm font-bold text-[#E8ECEF]"
                        >
                          Memory Title
                        </Label>
                        <Input
                          id="caregiver-mem-title"
                          required
                          value={memoryTitle}
                          onChange={(e) => setMemoryTitle(e.target.value)}
                          placeholder="e.g. Diwalis with Family in Jaipur"
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-bold text-[#E8ECEF] mb-1 block">
                          Category
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {(["Family", "Places", "Celebrations"] as const).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setMemoryCategory(cat)}
                              className={`py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                memoryCategory === cat
                                  ? "bg-[#6FAF9A] text-[#0A1420] shadow-sm"
                                  : "bg-[#0A1420] border border-white/10 text-[#8A99A8] hover:text-[#E8ECEF] hover:bg-white/5"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="caregiver-mem-loc"
                          className="text-sm font-bold text-[#E8ECEF]"
                        >
                          Location (Optional)
                        </Label>
                        <Input
                          id="caregiver-mem-loc"
                          value={memoryLocation}
                          onChange={(e) => setMemoryLocation(e.target.value)}
                          placeholder="e.g. Shimla / Home Veranda"
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="caregiver-mem-desc"
                          className="text-sm font-bold text-[#E8ECEF]"
                        >
                          Description & Heartwarming Details
                        </Label>
                        <Textarea
                          id="caregiver-mem-desc"
                          required
                          rows={3}
                          value={memoryDesc}
                          onChange={(e) => setMemoryDesc(e.target.value)}
                          placeholder="Describe who was there, how it felt, or familiar sights…"
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-bold text-[#E8ECEF] mb-1 block">
                          Memory Photo
                        </Label>
                        <input
                          type="file"
                          ref={memoryFileInputRef}
                          accept="image/*"
                          onChange={handleMemoryImageChange}
                          className="hidden"
                        />
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => memoryFileInputRef.current?.click()}
                            className="rounded-full border-white/10 text-[#E8ECEF] bg-[#0A1420] hover:bg-white/5"
                          >
                            <ImageIcon size={18} className="mr-2 text-[#6FAF9A]" /> Select Photo
                          </Button>
                          {memoryImageBase64 && (
                            <span className="text-xs text-[#6FAF9A] font-bold">Photo attached</span>
                          )}
                        </div>
                        {memoryImageBase64 && (
                          <div className="mt-2 relative rounded-2xl overflow-hidden border border-white/10 max-h-40">
                            <img
                              src={memoryImageBase64}
                              alt="Preview"
                              className="w-full h-36 object-cover"
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddMemoryOpen(false)}
                          className="rounded-full border-white/10 text-[#8A99A8] hover:text-[#E8ECEF] bg-transparent hover:bg-white/5"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isCreatingMemory}
                          className="rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] font-bold shadow-sm"
                        >
                          {isCreatingMemory ? "Saving…" : "Save to Patient Album"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Memories List */}
              {isMemoriesLoading ? (
                <div className="py-12 text-center text-[#8A99A8] text-lg font-medium">
                  Loading patient memories…
                </div>
              ) : patientMemories.length === 0 ? (
                <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-12 text-center text-[#8A99A8] shadow-xl">
                  <Heart size={48} className="mx-auto text-rose-400/40 mb-4" />
                  <h3 className="font-display text-2xl font-bold text-[#E8ECEF]">
                    No memories added for this patient yet
                  </h3>
                  <p className="text-[#8A99A8] mt-2">
                    Click "ADD MEMORY" above to upload photos and create heartwarming recollections
                    for this patient.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {patientMemories.map((m) => {
                    const tag = m.tags && m.tags.length > 0 ? m.tags[0] : "Family";
                    return (
                      <div
                        key={m.id}
                        className="rounded-3xl border border-white/8 bg-[#121D2B] overflow-hidden shadow-xl flex flex-col justify-between hover:border-white/15 transition duration-300"
                      >
                        <div>
                          {m.image_url ? (
                            <img
                              src={m.image_url}
                              alt={m.title}
                              className="h-44 w-full object-cover border-b border-white/5"
                            />
                          ) : (
                            <div className="h-28 w-full bg-[#0A1420] border-b border-white/5 flex items-center justify-center text-rose-400">
                              <Heart size={32} />
                            </div>
                          )}

                          <div className="p-5">
                            <div className="flex items-center justify-between text-xs font-bold text-[#6FAF9A] mb-1">
                              <span className="uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#6FAF9A]/15 text-[#6FAF9A] border border-[#6FAF9A]/30">
                                {tag}
                              </span>
                              {m.location && (
                                <span className="text-[#8A99A8] font-medium">
                                  {m.location}
                                </span>
                              )}
                            </div>
                            <h4 className="font-display text-xl font-bold text-[#E8ECEF] mb-1">
                              {m.title}
                            </h4>
                            <p className="text-[#8A99A8] text-sm leading-relaxed line-clamp-3">
                              {m.description}
                            </p>
                          </div>
                        </div>

                        <div className="p-5 pt-0 border-t border-white/5 mt-3 flex justify-between items-center">
                          <span className="text-[11px] text-[#8A99A8] font-semibold">
                            Linked to patient album
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCaregiverDeleteMemory(m.id)}
                            className="rounded-full text-[#8A99A8] hover:text-rose-400 hover:bg-white/5 transition"
                            title="Delete memory"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ───────── TAB 4: GAME ASSIGNMENTS ───────── */}
          {activeTab === "games" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#E8ECEF] flex items-center gap-2">
                  <Gamepad2 size={22} className="text-[#6FAF9A]" /> Cognitive Game Assignments
                </h2>
                <p className="text-xs text-[#8A99A8] font-medium mt-1">
                  Select which cognitive exercises are active for this patient. Enabled games will
                  appear in the patient's daily challenge list.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {GAME_REGISTRY.map((game) => {
                  const assignedList = assignedGamesData?.assigned_game_types || [];
                  const isAssigned = assignedList.length === 0 || assignedList.includes(game.id);

                  return (
                    <div
                      key={game.id}
                      className={`rounded-3xl border p-5 transition flex flex-col justify-between backdrop-blur-md ${
                        isAssigned
                          ? "border-[#6FAF9A]/30 bg-[#121D2B] shadow-xl"
                          : "border-white/8 bg-[#121D2B]/50 opacity-70"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#6FAF9A]">
                            {game.category}
                          </span>
                          <span
                            className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              isAssigned
                                ? "bg-[#6FAF9A]/15 text-[#6FAF9A] border border-[#6FAF9A]/30"
                                : "bg-white/5 text-[#8A99A8] border border-white/10"
                            }`}
                          >
                            {isAssigned ? "Enabled" : "Disabled"}
                          </span>
                        </div>

                        <h3 className="font-display text-xl font-bold text-[#E8ECEF]">
                          {game.name}
                        </h3>
                        <p className="text-xs text-[#8A99A8] mt-1 leading-relaxed font-medium">
                          {game.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between">
                        <span className="text-xs text-[#8A99A8] font-semibold">
                          Patient Access
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleGameAssignment(game.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                            isAssigned
                              ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30"
                              : "bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A]"
                          }`}
                        >
                          {isAssigned ? (
                            <>
                              <XCircle size={14} /> Disable
                            </>
                          ) : (
                            <>
                              <Check size={14} /> Assign Game
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ───────── TAB 5: PROGRESS & ANALYTICS ───────── */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#E8ECEF] flex items-center gap-2">
                  <Activity size={20} className="text-[#6FAF9A]" /> Live Patient Analytics (100% Real
                  DB Data)
                </h2>
                {isAnalyticsLoading && (
                  <span className="text-xs text-[#8A99A8] font-medium">
                    Recalculating live DB metrics…
                  </span>
                )}
              </div>

              {analytics && (
                <div className="space-y-6">
                  {/* Compliance Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-4 shadow-xl">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#8A99A8]">
                        Task Completion
                      </p>
                      <p className="font-display text-3xl font-bold text-[#6FAF9A] mt-1">
                        {analytics.task_completion_rate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-[#8A99A8] mt-1 font-medium">
                        {analytics.completed_tasks} completed / {analytics.total_tasks} total
                      </p>
                    </div>

                    <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-4 shadow-xl">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#8A99A8]">
                        Med Adherence
                      </p>
                      <p className="font-display text-3xl font-bold text-rose-400 mt-1">
                        {analytics.medication_adherence_rate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-[#8A99A8] mt-1 font-medium">
                        {analytics.medications_taken} taken /{" "}
                        {analytics.total_medications_scheduled} scheduled
                      </p>
                    </div>

                    <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-4 shadow-xl">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#8A99A8]">
                        Avg Game Score
                      </p>
                      <p className="font-display text-3xl font-bold text-[#6FAF9A] mt-1">
                        {analytics.average_game_score.toFixed(1)}
                      </p>
                      <p className="text-xs text-[#8A99A8] mt-1 font-medium">
                        {analytics.total_games_played} sessions audited
                      </p>
                    </div>

                    <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-4 shadow-xl">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#8A99A8]">
                        Cognitive Risk
                      </p>
                      <p className="font-display text-3xl font-bold text-[#E8ECEF] mt-1 uppercase">
                        {analytics.risk_level}
                      </p>
                      <p className="text-xs text-[#8A99A8] mt-1 capitalize font-medium">
                        Trend: {analytics.trend}
                      </p>
                    </div>
                  </div>

                  {/* Cognitive Sub-Scores Breakdown */}
                  {analytics.cognitive_scores && (
                    <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 shadow-xl">
                      <h3 className="font-display text-xl font-bold text-[#E8ECEF] mb-4">
                        Cognitive Domain Breakdown (AI Evaluated)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(analytics.cognitive_scores).map(([domain, score]) => (
                          <div
                            key={domain}
                            className="p-4 rounded-2xl bg-[#0A1420] border border-white/8 shadow-sm"
                          >
                            <p className="text-xs font-bold uppercase tracking-wider text-[#6FAF9A]">
                              {domain}
                            </p>
                            <p className="font-display text-2xl font-bold text-[#E8ECEF] mt-1">
                              {score.toFixed(1)}/100
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ───────── TAB: MEDICAL APPOINTMENTS ───────── */}
          {activeTab === "appointments" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#E8ECEF] flex items-center gap-2">
                  <Calendar size={20} className="text-[#6FAF9A]" /> Medical Appointments
                </h2>

                {/* Schedule Appointment Dialog */}
                <Dialog open={isAddApptOpen} onOpenChange={setIsAddApptOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="touch"
                      className="text-sm font-bold rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] shadow-sm"
                    >
                      <CalendarPlus size={18} className="mr-2" /> Schedule Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#121D2B] border border-white/10 text-[#E8ECEF] max-w-md rounded-3xl shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-display text-2xl font-bold text-[#E8ECEF]">
                        Schedule Medical Appointment
                      </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleScheduleAppt} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="appt-title" className="text-sm font-bold text-[#E8ECEF]">
                          Appointment Title *
                        </Label>
                        <Input
                          id="appt-title"
                          required
                          value={apptTitle}
                          onChange={(e) => setApptTitle(e.target.value)}
                          placeholder="e.g. General Checkup"
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="appt-doctor" className="text-sm font-bold text-[#E8ECEF]">
                          Doctor Name
                        </Label>
                        <Input
                          id="appt-doctor"
                          value={apptDoctorName}
                          onChange={(e) => setApptDoctorName(e.target.value)}
                          placeholder="e.g. Dr. Sharma"
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="appt-location"
                          className="text-sm font-bold text-[#E8ECEF]"
                        >
                          Location
                        </Label>
                        <Input
                          id="appt-location"
                          value={apptLocation}
                          onChange={(e) => setApptLocation(e.target.value)}
                          placeholder="e.g. Guwahati District PHC"
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="appt-datetime"
                          className="text-sm font-bold text-[#E8ECEF]"
                        >
                          Date & Time *
                        </Label>
                        <Input
                          id="appt-datetime"
                          type="datetime-local"
                          required
                          value={apptDatetime}
                          onChange={(e) => setApptDatetime(e.target.value)}
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="appt-notes" className="text-sm font-bold text-[#E8ECEF]">
                          Notes
                        </Label>
                        <Textarea
                          id="appt-notes"
                          value={apptNotes}
                          onChange={(e) => setApptNotes(e.target.value)}
                          placeholder="Any additional notes..."
                          className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                          rows={3}
                        />
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddApptOpen(false)}
                          className="rounded-full border-white/10 text-[#8A99A8] hover:text-[#E8ECEF] bg-[#0A1420] hover:bg-white/5"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmittingAppt}
                          className="rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] font-bold shadow-sm"
                        >
                          {isSubmittingAppt ? "Scheduling..." : "Schedule Appointment"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Appointments List */}
              {isApptsLoading ? (
                <p className="text-sm text-[#8A99A8] py-8 text-center font-medium">
                  Loading appointments...
                </p>
              ) : appointments.length === 0 ? (
                <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-10 text-center shadow-xl">
                  <span className="flex size-16 items-center justify-center rounded-2xl bg-[#6FAF9A]/20 text-[#6FAF9A] mx-auto mb-4 shadow-inner">
                    <Calendar size={32} />
                  </span>
                  <h3 className="text-xl font-bold text-[#E8ECEF]">No Appointments Scheduled</h3>
                  <p className="text-sm text-[#8A99A8] mt-2 max-w-sm mx-auto">
                    Schedule a medical appointment for this patient at a local health centre.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appt) => {
                    const apptDate = new Date(appt.appointment_datetime);
                    const isPast = apptDate < new Date();
                    const statusColors: Record<string, string> = {
                      scheduled: "bg-sky-500/15 text-sky-300 border-sky-500/30",
                      completed: "bg-[#6FAF9A]/15 text-[#6FAF9A] border-[#6FAF9A]/30",
                      cancelled: "bg-white/5 text-[#8A99A8] border-white/10",
                      missed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
                    };
                    return (
                      <article
                        key={appt.id}
                        className={`rounded-3xl border p-5 shadow-xl transition ${
                          appt.status === "cancelled"
                            ? "border-white/5 bg-[#121D2B]/50 opacity-60"
                            : "border-white/8 bg-[#121D2B]"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-bold text-[#E8ECEF] truncate">
                                {appt.title}
                              </h3>
                              <span
                                className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase border ${
                                  statusColors[appt.status] || statusColors["scheduled"]
                                }`}
                              >
                                {appt.status}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#8A99A8] mt-2 font-medium">
                              <span className="flex items-center gap-1.5">
                                <Clock size={14} className="text-[#6FAF9A] shrink-0" />
                                {apptDate.toLocaleDateString("en-IN", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}{" "}
                                at{" "}
                                {apptDate.toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {appt.doctor_name && (
                                <span className="flex items-center gap-1.5">
                                  <Stethoscope size={14} className="text-[#6FAF9A] shrink-0" />
                                  {appt.doctor_name}
                                </span>
                              )}
                              {appt.location && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin size={14} className="text-[#6FAF9A] shrink-0" />
                                  {appt.location}
                                </span>
                              )}
                            </div>

                            {appt.notes && (
                              <p className="text-xs text-[#8A99A8] mt-2 line-clamp-2">
                                {appt.notes}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {appt.status === "scheduled" && (
                              <button
                                type="button"
                                onClick={() => handleCancelAppt(appt.id)}
                                className="px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition"
                              >
                                Cancel
                              </button>
                            )}
                            {(appt.status === "cancelled" || isPast) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAppt(appt.id)}
                                className="size-8 flex items-center justify-center rounded-full text-[#8A99A8] hover:text-[#E85D6B] hover:bg-white/5 transition"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#E8ECEF] flex items-center gap-2">
                <FileText size={20} className="text-[#6FAF9A]" /> Clinical Care Reports & Audit Logs
              </h2>

              {/* AI Clinical Insights */}
              <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl">
                <h3 className="font-display text-xl font-bold text-[#E8ECEF] mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-[#6FAF9A]" /> AI Clinical Assessment Insights
                </h3>
                {analytics?.insights && analytics.insights.length > 0 ? (
                  <ul className="space-y-2 text-sm text-[#E8ECEF]/90 list-disc list-inside font-medium">
                    {analytics.insights.map((insight, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {insight}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#8A99A8] font-medium">
                    Cognitive performance is consistent with baseline memory profile. Maintain
                    active daily routines.
                  </p>
                )}
              </div>

              {/* AI Recommendations */}
              <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl">
                <h3 className="font-display text-xl font-bold text-[#E8ECEF] mb-3 flex items-center gap-2">
                  <CheckSquare size={18} className="text-[#6FAF9A]" /> Caregiver Recommendations
                </h3>
                {analytics?.recommendations && analytics.recommendations.length > 0 ? (
                  <ul className="space-y-2 text-sm text-[#E8ECEF]/90 list-disc list-inside font-medium">
                    {analytics.recommendations.map((rec, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {rec}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#8A99A8] font-medium">
                    Encourage gentle recall exercises, ensure on-time dosage, and keep daily sleep
                    routine consistent.
                  </p>
                )}
              </div>

              {/* Patient Game Activity Audit Log (Read-Only Caregiver Audit, NOT Playable Games) */}
              <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl">
                <h3 className="font-display text-xl font-bold text-[#E8ECEF] mb-3 flex items-center gap-2">
                  <Gamepad2 size={18} className="text-[#6FAF9A]" /> Patient Game Activity Audit Log
                </h3>
                <p className="text-xs text-[#8A99A8] font-medium mb-4">
                  Audit log of cognitive game sessions completed by the patient. (Monitoring only)
                </p>

                {!analytics?.recent_game_sessions || analytics.recent_game_sessions.length === 0 ? (
                  <p className="text-sm text-[#8A99A8] py-4 text-center font-medium">
                    No game sessions recorded yet by patient.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {analytics.recent_game_sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-2xl bg-[#0A1420] px-4 py-3 border border-white/8 text-sm shadow-sm"
                      >
                        <div>
                          <span className="font-bold text-[#E8ECEF]">{session.game_name}</span>
                          <span className="text-xs text-[#8A99A8] ml-2 font-medium">
                            Level {session.level_achieved}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[#6FAF9A] font-bold">{session.score} pts</span>
                          <span className="text-[#2DD4BF] font-bold">
                            {session.accuracy.toFixed(0)}% acc
                          </span>
                          <span className="text-xs text-[#8A99A8] font-medium">
                            {session.duration_seconds}s
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───────── TAB: DIFFICULTY CALIBRATION & AI DIFFICULTY ───────── */}
          {activeTab === "calibration" && selectedPatientId && (
            <DifficultyCalibrationTab
              patientId={selectedPatientId}
              patientName={
                patientDetail?.patient.name || selectedPatientItem?.patient.name || "Patient"
              }
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
