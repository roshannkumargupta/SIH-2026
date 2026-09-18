import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  UserPlus,
  Key,
  Mail,
  User,
  Phone,
  MapPin,
  Heart,
  Stethoscope,
  Globe,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { caretakersApi } from "@/api/caretakers.api";
import { formatApiError } from "@/api/client";
import { savePatient, type PatientData } from "@/utils/patientStore";

export const Route = createFileRoute("/caregiver_/add-patient")({
  head: () => ({
    meta: [
      { title: "Add or Connect Patient | SmritiSetu Caregiver" },
      {
        name: "description",
        content:
          "Streamlined caregiver patient onboarding — personal info, credentials, and medical care details.",
      },
    ],
  }),
  component: AddPatientPage,
});

/* ─── Language Options ─── */
const LANGUAGES = [
  { code: "hi", name: "Hindi", label: "हिन्दी (Hindi)" },
  { code: "en", name: "English", label: "English" },
  { code: "te", name: "Telugu", label: "తెలుగు (Telugu)" },
  { code: "ta", name: "Tamil", label: "தமிழ் (Tamil)" },
  { code: "mr", name: "Marathi", label: "मराठी (Marathi)" },
  { code: "gu", name: "Gujarati", label: "ગુજરાતી (Gujarati)" },
  { code: "bn", name: "Bengali", label: "বাংলা (Bengali)" },
  { code: "as", name: "Assamese", label: "অসমীয়া (Assamese)" },
  { code: "ne", name: "Nepali", label: "नेपाली (Nepali)" },
  { code: "mni", name: "Manipuri", label: "মৈতৈলোন্ (Manipuri)" },
  { code: "brx", name: "Bodo", label: "बड़ो (Bodo)" },
] as const;

function AddPatientPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Female");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("hi");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter the patient's Email / Gmail address.");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter the patient's full name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await caretakersApi.addOrConnectPatient({
        email: email.trim().toLowerCase(),
        password: password.trim() || undefined,
        name: name.trim(),
        age: age.trim() || undefined,
        gender,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        emergency_contact_name: emergencyName.trim() || undefined,
        emergency_contact_phone: emergencyPhone.trim() || undefined,
        doctor_name: doctorName.trim() || undefined,
        preferred_language: preferredLanguage,
        relationship_type: "caregiver",
      });

      // Also persist to local cache for instant client-side offline sync
      const cachedPatient: PatientData = {
        id: res.patient.id,
        name: res.patient.name,
        email: res.patient.email,
        password: password.trim(),
        age: age.trim(),
        gender,
        phone: phone.trim(),
        address: address.trim(),
        emergencyContactName: emergencyName.trim(),
        emergencyContact: emergencyPhone.trim(),
        doctorName: doctorName.trim(),
        preferredLanguage,
        prescriptions: [],
        medications: [],
        tasks: [],
        memories: [],
        joinedAt: new Date().toISOString().slice(0, 10),
        status: "active",
        progress: {
          overallScore: 0,
          medicationAdherence: 0,
          taskCompletion: 0,
          gamePerformance: 0,
          trend: "stable",
          confidence: 0,
        },
        dailyScores: [],
      };
      savePatient(cachedPatient);

      toast.success(res.message || "Patient connected successfully!");
      navigate({ to: "/caregiver" });
    } catch (err: unknown) {
      toast.error(
        formatApiError(err, "Failed to connect patient. Please verify the entered details."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    "bg-[#0A1420] border-white/10 text-[#E8ECEF] placeholder:text-[#8A99A8] mt-1 h-12 rounded-2xl px-4 text-base focus-visible:ring-[#22C55E] shadow-sm";

  return (
    <AppShell className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Back navigation */}
      <div>
        <Button asChild variant="outline" className="rounded-full bg-[#121D2B] border-white/10 text-[#E8ECEF] hover:bg-white/5 shadow-sm font-semibold">
          <Link to="/caregiver">
            <ArrowLeft size={18} className="mr-2 text-[#22C55E]" /> Back to Caregiver Hub
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-[#22C55E]/15 text-[#22C55E] shadow-inner flex-shrink-0">
            <UserPlus size={30} />
          </span>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#E8ECEF]">
              Add / Connect Patient
            </h1>
            <p className="text-[#8A99A8] text-sm mt-1 font-medium">
              Enter the patient's account credentials, demographic details, and medical contact
              information. Medications, tasks, and memory photos can be managed immediately after
              connecting.
            </p>
          </div>
        </div>
      </div>

      {/* Streamlined Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Account & Credentials */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-[#22C55E] font-bold text-lg border-b border-white/10 pb-3">
            <Key size={20} /> Account & Login Credentials
          </div>
          <p className="text-xs text-[#8A99A8] font-medium">
            Enter the patient's Gmail / email identifier. If the patient already has an account,
            entering their email will connect them to your dashboard. If registering a new
            patient, provide an initial password for their login.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-bold text-[#E8ECEF] flex items-center gap-1.5">
                <Mail size={15} className="text-[#22C55E]" /> Patient Email / Gmail *
              </Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., patient@gmail.com"
                className={fieldClass}
              />
            </div>

            <div>
              <Label className="text-sm font-bold text-[#E8ECEF] flex items-center gap-1.5">
                <Key size={15} className="text-[#22C55E]" /> Initial Password (for new patient)
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g., •••••••• (min 4 chars)"
                className={fieldClass}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Personal Demographics */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-[#22C55E] font-bold text-lg border-b border-white/10 pb-3">
            <User size={20} /> Patient Demographics
          </div>

          <div>
            <Label className="text-sm font-bold text-[#E8ECEF]">Full Name *</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Savitri Devi"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-bold text-[#E8ECEF] flex items-center gap-1.5">
                <Calendar size={15} className="text-[#22C55E]" /> Age / DOB
              </Label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 72"
                className={fieldClass}
              />
            </div>

            <div>
              <Label className="text-sm font-bold text-[#E8ECEF]">Gender</Label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex w-full h-12 rounded-2xl border border-white/10 bg-[#0A1420] text-[#E8ECEF] px-4 text-base mt-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22C55E]"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <Label className="text-sm font-bold text-[#E8ECEF] flex items-center gap-1.5">
                <Phone size={15} className="text-[#22C55E]" /> Phone Number
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-bold text-[#E8ECEF] flex items-center gap-1.5">
              <MapPin size={15} className="text-[#22C55E]" /> Residential Address
            </Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., 14 MG Road, Guwahati, Assam"
              className={fieldClass}
            />
          </div>
        </div>

        {/* Section 3: Emergency Contact & Doctor */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-[#22C55E] font-bold text-lg border-b border-white/10 pb-3">
            <Heart size={20} /> Emergency Contacts & Care
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-bold text-[#E8ECEF]">Emergency Contact Name</Label>
              <Input
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="e.g., Priya Sharma (Daughter)"
                className={fieldClass}
              />
            </div>

            <div>
              <Label className="text-sm font-bold text-[#E8ECEF]">Emergency Phone Number</Label>
              <Input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+91 98765 43211"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-bold text-[#E8ECEF] flex items-center gap-1.5">
              <Stethoscope size={15} className="text-[#22C55E]" /> Assigned Doctor Name (Optional)
            </Label>
            <Input
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="e.g., Dr. Anil Baruah"
              className={fieldClass}
            />
          </div>
        </div>

        {/* Section 4: Preferred Language */}
        <div className="rounded-3xl border border-white/8 bg-[#121D2B] p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-[#22C55E] font-bold text-lg border-b border-white/10 pb-3">
            <Globe size={20} /> Preferred Language
          </div>
          <p className="text-xs text-[#8A99A8] font-medium">
            The Voice Assistant, dashboard interface, and reminders will automatically adapt to
            this language.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LANGUAGES.map((lang) => {
              const selected = preferredLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setPreferredLanguage(lang.code)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                    selected
                      ? "border-[#22C55E] bg-[#22C55E]/15 shadow-sm"
                      : "border-white/8 bg-[#0A1420]/60 hover:bg-[#0A1420] hover:border-white/15"
                  }`}
                >
                  <p className={`text-sm font-bold ${selected ? "text-[#22C55E]" : "text-[#E8ECEF]"}`}>
                    {lang.label}
                  </p>
                  {selected && (
                    <span className="text-[11px] font-bold text-[#22C55E] flex items-center gap-1 mt-1">
                      <CheckCircle2 size={12} /> Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            size="touch"
            className="flex-1 rounded-full border-white/10 text-[#8A99A8] hover:text-[#E8ECEF] bg-[#121D2B]"
            onClick={() => navigate({ to: "/caregiver" })}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="touch"
            className="flex-1 font-bold rounded-full bg-[#22C55E] text-[#0A1420] hover:bg-[#1ea850] shadow-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Connecting Patient..." : "✓ Save & Connect Patient"}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
