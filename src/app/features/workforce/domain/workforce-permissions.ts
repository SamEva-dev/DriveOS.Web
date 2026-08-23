export const WORKFORCE_PERMISSIONS = {
  dashboard: {
    read: 'Workforce.Dashboard.Read',
  },
  employees: {
    read: 'Workforce.Employees.Read',
    create: 'Workforce.Employees.Create',
    update: 'Workforce.Employees.Update',
    onboard: 'Workforce.Employees.Onboard',
    activate: 'Workforce.Employees.Activate',
    suspend: 'Workforce.Employees.Suspend',
    reactivate: 'Workforce.Employees.Reactivate',
    terminate: 'Workforce.Employees.Terminate',
    rehire: 'Workforce.Employees.Rehire',
  },
  branchAssignments: {
    read: 'Workforce.BranchAssignments.Read',
    manage: 'Workforce.BranchAssignments.Manage',
  },
  jobPositions: {
    read: 'Workforce.JobPositions.Read',
    manage: 'Workforce.JobPositions.Manage',
    assign: 'Workforce.JobPositions.Assign',
  },
  qualifications: {
    read: 'Workforce.Qualifications.Read',
    manage: 'Workforce.Qualifications.Manage',
    verify: 'Workforce.Qualifications.Verify',
  },
  instructorAuthorizations: {
    read: 'Workforce.InstructorAuthorizations.Read',
    manage: 'Workforce.InstructorAuthorizations.Manage',
    verify: 'Workforce.InstructorAuthorizations.Verify',
  },
  employmentContracts: {
    read: 'Workforce.EmploymentContracts.Read',
    manage: 'Workforce.EmploymentContracts.Manage',
    sign: 'Workforce.EmploymentContracts.Sign',
  },
  leavePolicies: {
    read: 'Workforce.LeavePolicies.Read',
    manage: 'Workforce.LeavePolicies.Manage',
  },
  leaveRequests: {
    read: 'Workforce.LeaveRequests.Read',
    manage: 'Workforce.LeaveRequests.Manage',
    submit: 'Workforce.LeaveRequests.Submit',
    approve: 'Workforce.LeaveRequests.Approve',
  },
  workingTime: {
    read: 'Workforce.WorkingTime.Read',
    manage: 'Workforce.WorkingTime.Manage',
  },
  timesheets: {
    read: 'Workforce.Timesheets.Read',
    manage: 'Workforce.Timesheets.Manage',
    submit: 'Workforce.Timesheets.Submit',
    approve: 'Workforce.Timesheets.Approve',
    lock: 'Workforce.Timesheets.Lock',
  },
  equipmentAssignments: {
    read: 'Workforce.EquipmentAssignments.Read',
    manage: 'Workforce.EquipmentAssignments.Manage',
  },
  performanceReviews: {
    read: 'Workforce.PerformanceReviews.Read',
    manage: 'Workforce.PerformanceReviews.Manage',
    acknowledge: 'Workforce.PerformanceReviews.Acknowledge',
    validate: 'Workforce.PerformanceReviews.Validate',
  },
  employeeDocuments: {
    read: 'Workforce.EmployeeDocuments.Read',
    manage: 'Workforce.EmployeeDocuments.Manage',
    verify: 'Workforce.EmployeeDocuments.Verify',
    confidentialRead: 'Workforce.EmployeeDocuments.Confidential.Read',
  },
  professionalRestrictions: {
    read: 'Workforce.ProfessionalRestrictions.Read',
    manage: 'Workforce.ProfessionalRestrictions.Manage',
    apply: 'Workforce.ProfessionalRestrictions.Apply',
    lift: 'Workforce.ProfessionalRestrictions.Lift',
  },
  offboarding: {
    read: 'Workforce.Offboarding.Read',
    manage: 'Workforce.Offboarding.Manage',
    waive: 'Workforce.Offboarding.Waive',
    complete: 'Workforce.Offboarding.Complete',
  },
  analytics: {
    read: 'Workforce.Analytics.Read',
  },
} as const;
