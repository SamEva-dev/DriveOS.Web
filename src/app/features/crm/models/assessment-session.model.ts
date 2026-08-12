export type AssessmentSessionStatus = 'InProgress' | 'DraftCompleted' | 'Submitted';

export interface AssessmentQuestionOption {
  value: string;
  label: string;
}

export interface AssessmentQuestion {
  id: string;
  section: string;
  label: string;
  helpText?: string;
  required: boolean;
  options: AssessmentQuestionOption[];
}

export interface AssessmentQuestionnaireSnapshot {
  title: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentAnswer {
  questionId: string;
  value: string;
}

export interface AssessmentSession {
  sessionId: string;
  appointmentId: string;
  leadId: string;
  evaluatorUserId: string;
  questionnaireCode: string;
  questionnaireVersion: number;
  questionnaireSnapshotJson: string;
  answersJson: string;
  factualObservations: string | null;
  pedagogicalInterpretation: string | null;
  recommendation: string | null;
  internalNotes: string | null;
  prospectComment: string | null;
  status: AssessmentSessionStatus;
  revision: number;
  startedAtUtc: string;
  lastSavedAtUtc: string | null;
  submittedAtUtc: string | null;
  submittedByUserId: string | null;
}

export interface AssessmentAppointment {
  id: string;
  branchId: string | null;
  leadId: string;
  startsAtUtc: string;
  endsAtUtc: string;
  type: string;
  deliveryMode: string;
  locationKind: string;
  locationDetails: string | null;
  evaluatorUserId: string | null;
  vehicleId: string | null;
  roomId: string | null;
  simulatorId: string | null;
  priceAmount: number | null;
  priceCurrency: string | null;
  notes: string | null;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'NoShow';
  closedAtUtc: string | null;
  createdAtUtc: string;
}

export interface SaveAssessmentDraftRequest {
  answers: AssessmentAnswer[];
  factualObservations: string | null;
  pedagogicalInterpretation: string | null;
  recommendation: string | null;
  internalNotes: string | null;
  prospectComment: string | null;
  draftCompleted: boolean;
}
