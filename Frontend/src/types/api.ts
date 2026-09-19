export type UserRole = "patient" | "doctor" | "caretaker" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatar_url?: string | null | undefined;
  preferred_language?: string | undefined;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  token: TokenResponse;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  preferred_language: string;
  gender?: string | null | undefined;
  address?: string | null | undefined;
  doctor_name?: string | null | undefined;
  timezone: string;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export interface PatientProfileUpdate {
  date_of_birth?: string | undefined;
  emergency_contact_name?: string | undefined;
  emergency_contact_phone?: string | undefined;
  preferred_language?: string | undefined;
  gender?: string | undefined;
  address?: string | undefined;
  doctor_name?: string | undefined;
  timezone?: string | undefined;
}

export type PrescriptionStatus = "active" | "completed" | "cancelled";

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  medicine_name: string;
  dosage: string;
  route: string | null;
  instructions: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  status: PrescriptionStatus;
  created_at?: string | undefined;
  updated_at?: string | undefined;
}

export interface PrescriptionCreate {
  patient_id: string;
  medicine_name: string;
  dosage: string;
  route?: string | undefined;
  instructions?: string | undefined;
  start_date: string;
  end_date?: string | undefined;
  notes?: string | undefined;
}

export type MedicationFrequency = "daily" | "weekly" | "custom";
export type MedicationLogStatus = "scheduled" | "taken" | "missed" | "skipped";

export interface MedicationSchedule {
  id: string;
  prescription_id: string;
  patient_id: string;
  medicine_name: string;
  dosage: string;
  scheduled_time: string;
  frequency: MedicationFrequency;
  days_of_week: string | null;
  start_date: string;
  end_date: string | null;
  active: boolean;
  reminder_enabled: boolean;
  instructions?: string | null | undefined;
  created_at: string;
  updated_at: string;
}

export interface MedicationScheduleCreate {
  prescription_id: string;
  patient_id?: string | undefined;
  medicine_name: string;
  dosage: string;
  scheduled_time: string;
  frequency?: MedicationFrequency | undefined;
  days_of_week?: string | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
  reminder_enabled?: boolean | undefined;
}

export interface MedicationLog {
  id: string;
  schedule_id: string;
  patient_id: string;
  scheduled_at: string;
  taken_at: string | null;
  status: MedicationLogStatus;
  notes: string | null;
  created_at: string;
}

export type TaskPriority = "low" | "normal" | "high";
export type TaskRecurrence = "daily" | "weekly" | "custom";
export type TaskStatus = "pending" | "completed" | "missed";

export interface Task {
  id: string;
  patient_id: string;
  created_by: string;
  title: string;
  description: string | null;
  scheduled_time: string;
  priority: TaskPriority;
  recurrence: TaskRecurrence;
  days_of_week: string | null;
  start_date: string;
  end_date: string | null;
  status: TaskStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  patient_id: string;
  title: string;
  description?: string | undefined;
  scheduled_time: string;
  priority?: TaskPriority | undefined;
  recurrence?: TaskRecurrence | undefined;
  days_of_week?: string | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
}

export interface GameTypeInfo {
  id: string;
  name: string;
  description: string;
  cognitive_domain: string;
  icon_name: string;
  difficulty_levels: string[];
}

export interface GameSession {
  id: string;
  patient_id: string;
  game_type: string;
  game_id: string;
  score: number;
  accuracy: number;
  duration_seconds: number;
  difficulty: string;
  level_achieved: number;
  next_level_unlocked?: number | undefined;
  metrics: Record<string, unknown> | string | null;
  completed_at: string;
  created_at: string;
}

export interface GameSessionCreate {
  patient_id?: string | undefined;
  game_type: string;
  game_id: string;
  score: number;
  accuracy: number;
  duration_seconds: number;
  difficulty?: string | undefined;
  level_achieved?: number | undefined;
  metrics?: Record<string, unknown> | string | undefined;
}

export interface GameSummary {
  total_sessions: number;
  average_score: number;
  average_accuracy: number;
  total_duration_seconds?: number | undefined;
  games_played?: string[] | undefined;
  favorite_game?: string | null | undefined;
  recent_improvement_percentage?: number | undefined;
}

export interface SingleGameProgress {
  game_id: string;
  highest_level_won: number;
  current_unlocked_level: number;
  best_score: number;
  total_played: number;
  last_played: string | null;
}

export interface GameProgressResponse {
  patient_id: string;
  games: Record<string, SingleGameProgress>;
}

export type RiskLevel = "low" | "moderate" | "high" | "critical" | "unassessable";

export interface AdherenceData {
  medication_rate: number | null;
  task_rate: number | null;
}

export interface DomainSlopeItem {
  slope_7d: number | null;
  slope_30d: number | null;
  declining: boolean;
  days_declining: number;
}

export interface CognitiveAssessment {
  id: string;
  patient_id: string;
  overall_score: number | null;
  risk_level: RiskLevel;
  memory_score: number | null;
  attention_score: number | null;
  executive_function_score: number | null;
  language_score: number | null;
  visuospatial_score: number | null;
  insights: string[] | string | null;
  recommendations: string[] | string | null;
  model_version: string;
  method_description?: string | null;
  adherence?: AdherenceData | null;
  assessment_date: string;
  created_at: string;
}

export interface CognitiveTrendItem {
  date: string;
  overall_score: number | null;
  risk_level?: string | undefined;
  memory_score: number | null;
  attention_score: number | null;
  executive_function_score?: number | null;
  language_score?: number | null;
  visuospatial_score?: number | null;
}

export interface CognitiveTrend {
  patient_id: string;
  trends?: CognitiveTrendItem[] | undefined;
  data_points?: CognitiveTrendItem[] | undefined;
  average_score?: number | null;
  trend_direction: "improving" | "stable" | "declining" | "insufficient_data";
  domain_slopes?: Record<string, DomainSlopeItem>;
  decline_alert_active?: boolean;
  decline_domains?: string[] | null;
}

export interface Notification {
  id: string;
  patient_id: string;
  type:
    | "medication"
    | "task"
    | "general"
    | "hydration"
    | "appointment"
    | "mood_alert"
    | "cognitive_decline";
  title: string;
  message: string;
  scheduled_for: string;
  sent_at: string | null;
  status: "pending" | "sent" | "read" | "failed";
  related_entity_id: string | null;
  created_at: string;
}

export interface VoiceLanguage {
  code: string;
  name: string;
  native_name: string;
}

export interface TranslationLanguage {
  code: string;
  name: string;
  native_name: string;
}

export interface DoctorDashboardPatient {
  patient: User;
  latest_score: number | null;
  latest_score_date: string | null;
  risk_level: RiskLevel | "unassessed";
}

export interface CaregiverDashboardPatient {
  patient: User;
  profile?: PatientProfile | null;
  latest_cognitive_score: number | null;
  risk_level: RiskLevel | "unassessed";
  pending_medication_count: number;
  pending_task_count: number;
}

export interface CaregiverDashboard {
  caretaker_id: string;
  caretaker_name: string;
  total_patients: number;
  patients: CaregiverDashboardPatient[];
}

export interface CaretakerPatientDetail {
  patient: User;
  profile: PatientProfile | null;
  relationship_type: string | null;
  active: boolean;
  connected_since: string;
}

export interface InitialTaskInput {
  title: string;
  description?: string | undefined;
  scheduled_time?: string | undefined;
  priority?: TaskPriority | undefined;
  recurrence?: TaskRecurrence | undefined;
}

export interface InitialMedicationInput {
  medicine_name: string;
  dosage: string;
  scheduled_time?: string | undefined;
  instructions?: string | undefined;
}

export interface CaretakerAddPatientRequest {
  email: string;
  password?: string | undefined;
  name?: string | undefined;
  age?: number | string | undefined;
  date_of_birth?: string | undefined;
  gender?: string | undefined;
  phone?: string | undefined;
  address?: string | undefined;
  emergency_contact_name?: string | undefined;
  emergency_contact_phone?: string | undefined;
  doctor_name?: string | undefined;
  preferred_language?: string | undefined;
  relationship_type?: string | undefined;
  initial_tasks?: InitialTaskInput[] | undefined;
  initial_medications?: InitialMedicationInput[] | undefined;
}

export interface CaretakerAddPatientResponse {
  success: boolean;
  is_new_patient: boolean;
  message: string;
  patient: User;
  profile: PatientProfile | null;
  relationship_id: string;
}

export interface CaretakerCreateMedicationRequest {
  medicine_name: string;
  dosage: string;
  scheduled_time?: string | undefined;
  instructions?: string | undefined;
  frequency?: MedicationFrequency | undefined;
}

export interface CaretakerCreateTaskRequest {
  title: string;
  description?: string | undefined;
  scheduled_time?: string | undefined;
  priority?: TaskPriority | undefined;
  recurrence?: TaskRecurrence | undefined;
}

export interface CaretakerTaskItem {
  id: string;
  title: string;
  description: string | null;
  scheduled_time: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at: string | null;
}

export interface CaretakerMedicationItem {
  id: string;
  medicine_name: string;
  dosage: string;
  scheduled_time: string;
  status: string;
  taken_at: string | null;
  instructions?: string | null;
}

export interface CaretakerGameSessionItem {
  id: string;
  game_name: string;
  game_id: string;
  score: number;
  accuracy: number;
  duration_seconds: number;
  level_achieved: number;
  difficulty: string;
  completed_at: string;
}

export interface CaretakerPatientAnalytics {
  patient_id: string;
  overall_score: number;
  risk_level: string;
  trend: string;
  cognitive_scores: {
    memory: number;
    attention: number;
    executive: number;
    language: number;
  };
  insights: string[];
  recommendations: string[];
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  missed_tasks: number;
  task_completion_rate: number;
  total_medications_scheduled: number;
  medications_taken: number;
  medications_pending: number;
  medications_missed: number;
  medication_adherence_rate: number;
  total_games_played: number;
  average_game_score: number;
  average_game_accuracy: number;
  best_game_score: number;
  total_game_duration_seconds: number;
  games_played: string[];
  recent_game_sessions: CaretakerGameSessionItem[];
  daily_scores: Array<{ date: string; overallScore: number }>;
}

export interface ApiError {
  success: boolean;
  message: string;
  errorCode?: string;
  details?: Array<{ field: string; message: string; type: string }>;
}

// ─── Offline Synchronization Types ──────────────────────────────────────────

export interface SyncGameEvent {
  client_event_id: string;
  game_type: string;
  game_id?: string | undefined;
  score: number;
  accuracy: number;
  duration_seconds: number;
  difficulty?: string | undefined;
  metrics?: Record<string, unknown> | undefined;
  completed_at?: string | undefined;
}

export interface SyncMedicationEvent {
  client_event_id: string;
  schedule_id: string;
  taken_at?: string | undefined;
  status?: string | undefined;
  notes?: string | undefined;
}

export interface SyncTaskEvent {
  client_event_id: string;
  task_id: string;
  completed_at?: string | undefined;
}

export interface SyncMemoryEvent {
  client_event_id: string;
  memory_id?: string | undefined;
  title: string;
  category?: string | undefined;
  description: string;
  date_or_era?: string | undefined;
  image_url?: string | undefined;
  created_at?: string | undefined;
}

export interface SyncVoiceEvent {
  client_event_id: string;
  transcript: string;
  action_taken?: string | undefined;
  timestamp?: string | undefined;
}

export interface SyncHydrationEvent {
  client_event_id: string;
  amount_ml: number;
  source?: HydrationSource | undefined;
  logged_at?: string | undefined;
}

export interface SyncMoodEvent {
  client_event_id: string;
  mood: MoodType;
  note?: string | undefined;
  created_at?: string | undefined;
}

export interface SyncBatchRequest {
  patient_id?: string | undefined;
  last_synced_at?: string | undefined;
  game_events?: SyncGameEvent[] | undefined;
  medication_events?: SyncMedicationEvent[] | undefined;
  task_events?: SyncTaskEvent[] | undefined;
  memory_events?: SyncMemoryEvent[] | undefined;
  voice_events?: SyncVoiceEvent[] | undefined;
  hydration_events?: SyncHydrationEvent[] | undefined;
  mood_events?: SyncMoodEvent[] | undefined;
}

export interface SyncBatchResponse {
  success: boolean;
  synced_games: number;
  synced_medications: number;
  synced_tasks: number;
  synced_memories: number;
  synced_voice_logs: number;
  synced_hydration: number;
  synced_moods: number;
  conflicts: string[];
  server_timestamp: string;
}

// ─── Hydration Types ────────────────────────────────────────────────────────

export type HydrationSource = "manual" | "caregiver_logged" | "reminder_tap";

export interface HydrationLogCreate {
  amount_ml?: number | undefined;
  source?: HydrationSource | undefined;
  patient_id?: string | undefined;
}

export interface HydrationLogResponse {
  id: string;
  patient_id: string;
  amount_ml: number;
  source: HydrationSource;
  logged_at: string;
  created_at: string;
}

export interface DailyHydrationGoalResponse {
  id: string;
  patient_id: string;
  goal_ml: number;
  created_at?: string | undefined;
  updated_at: string;
}

export interface HydrationTodaySummary {
  patient_id: string;
  total_ml: number;
  goal_ml: number;
  percent: number;
  logs: HydrationLogResponse[];
}

// ─── Appointment Types ──────────────────────────────────────────────────────

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "missed";

export interface Appointment {
  id: string;
  patient_id: string;
  created_by: string;
  title: string;
  doctor_name: string | null;
  location: string | null;
  appointment_datetime: string;
  notes: string | null;
  status: AppointmentStatus;
  reminder_lead_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreate {
  patient_id: string;
  title: string;
  doctor_name?: string | undefined;
  location?: string | undefined;
  appointment_datetime: string;
  notes?: string | undefined;
  reminder_lead_minutes?: number | undefined;
}

// ─── Adaptive Difficulty & Calibration Types ────────────────────────────────

export interface AdaptiveLevelResponse {
  recommended_level: number;
  confidence: "high" | "medium" | "low";
  rationale: string;
  based_on_sessions: number;
  ai_difficulty_enabled: boolean;
  model_type?: string;
  theta?: number;
  sigma?: number;
  manual_override_level?: number | null;
  cooldown_active?: boolean;
  last_lowered_at?: string | null;
}

export interface GameAbilityItem {
  game_id: string;
  game_name: string;
  cognitive_domains: string[];
  theta: number;
  sigma: number;
  confidence: "high" | "medium" | "low";
  current_level: number;
  recommended_level: number;
  max_level: number;
  manual_override_level: number | null;
  sessions_count: number;
  last_played_at: string | null;
  last_lowered_at: string | null;
  cooldown_active: boolean;
}

export interface GameAbilityOverviewResponse {
  patient_id: string;
  controller_type: string;
  description: string;
  target_accuracy_band: string;
  abilities: GameAbilityItem[];
}

export interface GameOverrideRequest {
  game_id: string;
  override_level: number | null;
}

export interface CalibrationAnswer {
  question_id: string;
  selected_option_id: string;
}

export interface PatientCalibration {
  id: string;
  patient_id: string;
  total_score: number;
  initial_difficulty: "easy" | "medium" | "hard";
  note: string | null;
  answers: CalibrationAnswer[] | null;
  ai_difficulty_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientCalibrationCreate {
  total_score: number;
  initial_difficulty: string;
  note?: string | null | undefined;
  answers?: CalibrationAnswer[] | undefined;
  ai_difficulty_enabled?: boolean | undefined;
}

// ─── Mood Check-in & Trend Types ────────────────────────────────────────────

export type MoodType = "happy" | "calm" | "confused" | "anxious";

export interface MoodCheckin {
  id: string;
  patient_id: string;
  mood: MoodType;
  note: string | null;
  created_at: string;
}

export interface MoodCheckinCreate {
  mood: MoodType;
  note?: string | undefined;
  patient_id?: string | undefined;
}

export interface MoodTrendResponse {
  patient_id: string;
  total_checkins: number;
  days_evaluated: number;
  mood_counts: Record<MoodType, number>;
  distress_flagged: boolean;
  distress_reason?: string | null;
  recent_checkins: MoodCheckin[];
}
