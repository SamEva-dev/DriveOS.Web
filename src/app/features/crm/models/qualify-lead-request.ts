import { FinancingOption } from './lead.model';

export interface QualifyLeadRequest {
  need: string;
  licenseCategory: string;
  availability: string;
  targetDate: string | null;
  financing: FinancingOption;
  notes: string | null;
}
