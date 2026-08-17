export type AssessmentResultStatus =
  'None' | 'Draft' | 'CorrectionRequested' | 'Validated' | 'Shared';
export type AssessmentResultConfidence = 'Low' | 'Medium' | 'High';

export interface AssessmentResultContent {
  summary: string;
  masteredPoints: string[];
  improvementPoints: string[];
  supportNeeds: string[];
  theoryHours: number | null;
  practicalHoursMin: number | null;
  practicalHoursMax: number | null;
  simulatorHours: number | null;
  roadHours: number | null;
  intermediateAssessments: number | null;
  languageSupportRequired: boolean;
  adaptedEquipmentRequired: boolean;
  recommendedDeliveryMode: string;
  recommendedTraining: string;
  alternatives: string[];
  prospectComment: string;
}

export interface AssessmentResult {
  sessionId: string;
  appointmentId: string;
  leadId: string;
  revision: number;
  resultJson: string | null;
  aiSuggestionJson: string | null;
  confidence: AssessmentResultConfidence | null;
  status: AssessmentResultStatus;
  correctionReason: string | null;
  internalNotes: string | null;
  validatedAtUtc: string | null;
  validatedByUserId: string | null;
  sharedAtUtc: string | null;
  sharedByUserId: string | null;
}

export interface SaveAssessmentResultRequest {
  expectedRevision: number;
  result: AssessmentResultContent;
  confidence: AssessmentResultConfidence;
  aiSuggestion: unknown | null;
}
