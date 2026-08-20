export const SCHEDULING_PERMISSIONS = {
  resources: { read: 'Scheduling.Resources.Read', manage: 'Scheduling.Resources.Manage' },
  availability: { read: 'Scheduling.Availability.Read', manage: 'Scheduling.Availability.Manage' },
  bookings: {
    read: 'Scheduling.Bookings.Read',
    create: 'Scheduling.Bookings.Create',
    reserve: 'Scheduling.Bookings.Reserve',
    confirm: 'Scheduling.Bookings.Confirm',
    reschedule: 'Scheduling.Bookings.Reschedule',
    cancel: 'Scheduling.Bookings.Cancel',
    cancelOverride: 'Scheduling.Bookings.CancelOverride',
  },
  conflicts: {
    read: 'Scheduling.Conflicts.Read',
    resolve: 'Scheduling.Conflicts.Resolve',
    override: 'Scheduling.Conflicts.Override',
  },
  waitingList: { read: 'Scheduling.WaitingList.Read', manage: 'Scheduling.WaitingList.Manage' },
  capacity: {
    read: 'Scheduling.Capacity.Read',
    forecast: 'Scheduling.Capacity.Forecast',
    scenarios: 'Scheduling.Capacity.Scenarios.Create',
  },
  slotSearch: 'Scheduling.SlotSearch',
  recurrence: {
    create: 'Scheduling.Recurrence.Create',
    update: 'Scheduling.Recurrence.Update',
    cancel: 'Scheduling.Recurrence.Cancel',
  },
  attendance: {
    record: 'Scheduling.Attendance.Record',
    updateWithinWindow: 'Scheduling.Attendance.UpdateWithinWindow',
    override: 'Scheduling.Attendance.Override',
  },
  travel: { read: 'Scheduling.Travel.Read', preciseLocation: 'Scheduling.Travel.PreciseLocation' },
  instructorReplacement: {
    read: 'Scheduling.InstructorReplacement.Read',
    assign: 'Scheduling.InstructorReplacement.Assign',
  },
  vehicleReplacement: {
    read: 'Scheduling.VehicleReplacement.Read',
    assign: 'Scheduling.VehicleReplacement.Assign',
  },
} as const;
