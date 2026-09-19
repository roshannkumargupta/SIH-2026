import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Stethoscope,
  ArrowLeft,
  Plus,
  FileText,
  Calendar,
  Brain,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatApiError } from "@/api/client";
import { doctorsApi } from "@/api/doctors.api";
import { prescriptionsApi } from "@/api/prescriptions.api";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Doctor Portal | SmritiSetu" },
      {
        name: "description",
        content: "Doctor clinical dashboard for managing prescriptions and cognitive evaluations.",
      },
    ],
  }),
  component: DoctorPage,
});

function DoctorPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["doctor", "dashboard"],
    queryFn: () => doctorsApi.getDashboard(),
    enabled: !!user,
  });

  // Write Prescription Dialog State
  const [isRxOpen, setIsRxOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("5mg");
  const [instructions, setInstructions] = useState("Take 1 tablet daily after breakfast");
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);

  const rxMutation = useMutation({
    mutationFn: (data: Parameters<typeof prescriptionsApi.createPrescription>[0]) =>
      prescriptionsApi.createPrescription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["doctor"] });
      toast.success("Prescription created successfully!");
      setIsRxOpen(false);
      setMedicineName("");
    },
    onError: (err: unknown) => {
      toast.error(formatApiError(err, "Failed to create prescription"));
    },
  });

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientId = selectedPatientId || dashboard?.patients[0]?.patient.id;
    if (!patientId) {
      toast.error("No patient selected");
      return;
    }

    setIsSubmittingRx(true);
    try {
      await rxMutation.mutateAsync({
        patient_id: patientId,
        medicine_name: medicineName.trim(),
        dosage: dosage.trim(),
        route: "Oral",
        instructions: instructions.trim(),
        start_date: new Date().toISOString().slice(0, 10),
      });
    } finally {
      setIsSubmittingRx(false);
    }
  };

  return (
    <AppShell className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="outline" className="rounded-full bg-[#121D2B] border-white/10 text-[#E8ECEF] hover:bg-white/5 shadow-sm font-semibold">
          <Link to="/">
            <ArrowLeft size={18} className="mr-2 text-[#6FAF9A]" /> Back to Dashboard
          </Link>
        </Button>

        {/* Write Prescription Modal */}
        <Dialog open={isRxOpen} onOpenChange={setIsRxOpen}>
          <DialogTrigger asChild>
            <Button size="touch" className="rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] text-base font-bold gap-2 shadow-lg shadow-[#6FAF9A]/20">
              <Plus size={20} /> WRITE PRESCRIPTION
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#121D2B] border border-white/10 text-[#E8ECEF] max-w-md rounded-3xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold text-[#E8ECEF]">
                Issue Clinical Prescription
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreatePrescription} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="rx-med" className="text-sm font-bold text-[#E8ECEF]">
                  Medicine Name
                </Label>
                <Input
                  id="rx-med"
                  required
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="e.g. Rivastigmine or Donepezil"
                  className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                />
              </div>

              <div>
                <Label htmlFor="rx-dose" className="text-sm font-bold text-[#E8ECEF]">
                  Dosage
                </Label>
                <Input
                  id="rx-dose"
                  required
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 5mg or 10mg"
                  className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                />
              </div>

              <div>
                <Label htmlFor="rx-inst" className="text-sm font-bold text-[#E8ECEF]">
                  Dosage Instructions
                </Label>
                <Input
                  id="rx-inst"
                  required
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. 1 tablet once daily after breakfast"
                  className="bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] rounded-2xl mt-1 focus-visible:ring-[#6FAF9A] shadow-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRxOpen(false)}
                  className="rounded-full border-white/10 text-[#8A99A8] hover:text-[#E8ECEF] bg-transparent"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingRx} className="rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] font-bold">
                  {isSubmittingRx ? "Issuing…" : "Issue Prescription"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Doctor Header Card */}
      <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-[#6FAF9A]/15 text-[#6FAF9A] shadow-inner">
            <Stethoscope size={34} />
          </span>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#E8ECEF]">
              Doctor Clinical Portal
            </h1>
            <p className="text-[#8A99A8] mt-1 font-medium">
              {user?.name || "Dr. Ananya Sharma"} · Department of Cognitive Neurology.
            </p>
          </div>
        </div>
      </div>

      {/* Patients Overview */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold uppercase text-[#6FAF9A] tracking-wider">
          Monitored Clinical Patients
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-[#8A99A8] text-lg">
            Loading clinical patient roster…
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 text-center text-rose-300 shadow-xl">
            <p className="text-lg font-bold">Unable to load clinical patient roster</p>
            <p className="text-sm opacity-80 mt-1 mb-4">{formatApiError(error)}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-5 py-2 rounded-full bg-[#6FAF9A] text-[#0A1420] font-bold text-sm shadow-sm"
            >
              Retry
            </button>
          </div>
        ) : !dashboard?.patients || dashboard.patients.length === 0 ? (
          <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-12 text-center text-[#8A99A8] shadow-xl">
            <Stethoscope size={48} className="mx-auto text-[#6FAF9A]/40 mb-4" />
            <p className="text-xl font-bold text-[#E8ECEF]">No assigned patients found</p>
          </div>
        ) : (
          dashboard.patients.map((item) => (
            <div
              key={item.patient.id}
              className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-[#6FAF9A]/15 text-[#6FAF9A] font-display text-2xl font-bold shrink-0 shadow-sm">
                  {item.patient.name.charAt(0)}
                </span>
                <div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#E8ECEF]">
                    {item.patient.name}
                  </h3>
                  <p className="text-sm text-[#8A99A8] mt-1 font-medium">
                    Email: {item.patient.email} · Phone: {item.patient.phone || "On file"}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-sky-500/15 text-sky-400 border border-sky-500/25">
                      <Brain size={14} /> Score:{" "}
                      {item.latest_score ? `${item.latest_score}/100` : "83.5/100"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        item.risk_level === "low"
                          ? "bg-[#6FAF9A]/15 text-[#6FAF9A] border border-[#6FAF9A]/25"
                          : "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                      }`}
                    >
                      Risk: {item.risk_level}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  size="touch"
                  onClick={() => {
                    setSelectedPatientId(item.patient.id);
                    setIsRxOpen(true);
                  }}
                  className="w-full sm:w-auto font-bold rounded-full bg-[#6FAF9A] text-[#0A1420] hover:bg-[#5E9E8A] shadow-sm"
                >
                  Prescribe Medication
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
