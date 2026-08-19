export interface LicenseCategoryListItem { id:string; countryCode:string; code:string; name:string; status:string; }
export interface CurriculumListItem { id:string; code:string; name:string; countryCode:string; licenseCategoryCode:string; status:string; latestVersionNumber:number; }
export interface Competency { id:string; code:string; name:string; description?:string|null; learningObjective:string; order:number; isRequired:boolean; }
export interface CurriculumModule { id:string; code:string; name:string; description?:string|null; order:number; competencies:Competency[]; }
export interface CurriculumVersion { id:string; versionNumber:number; sourceVersionId?:string|null; status:string; effectiveFrom:string; effectiveTo?:string|null; changeSummary?:string|null; createdAtUtc:string; publishedAtUtc?:string|null; modules:CurriculumModule[]; }
export interface CurriculumDetail { id:string; code:string; name:string; description?:string|null; countryCode:string; licenseCategoryCode:string; status:string; versions:CurriculumVersion[]; }
export interface CreateCurriculumRequest { code:string; name:string; description?:string|null; countryCode:string; licenseCategoryCode:string; }
export interface CreateLicenseCategoryRequest { countryCode:string; code:string; name:string; description?:string|null; }
