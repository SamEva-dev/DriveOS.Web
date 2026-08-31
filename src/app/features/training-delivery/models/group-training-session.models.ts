export interface GroupTrainingSessionParticipant {
  id: string;
  studentId: string;
  addedOutsideOriginalList: boolean;
  attendanceStatus: number;
  attendanceMethod: number | null;
  checkInAtUtc: string | null;
  checkOutAtUtc: string | null;
  competencyId: string | null;
  assessmentLevel: number | null;
  quizScore: number | null;
  individualObservation: string | null;
  certificateStatus: number;
}
export interface GroupTrainingSession {
  id: string;
  sourceBookingId: string;
  program: string;
  capacity: number;
  trainerId: string;
  branchId: string | null;
  roomResourceId: string | null;
  roomName: string | null;
  plannedStartAtUtc: string;
  plannedEndAtUtc: string;
  sharedObjectives: string | null;
  collectiveReport: string | null;
  registeredCount: number;
  presentCount: number;
  absentCount: number;
  participants: readonly GroupTrainingSessionParticipant[];
}
