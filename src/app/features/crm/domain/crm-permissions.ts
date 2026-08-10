export const CRM_PERMISSIONS = {
  leads: {
    read: 'Crm.Leads.Read',
    create: 'Crm.Leads.Create',
    update: 'Crm.Leads.Update',
    assign: 'Crm.Leads.Assign',
    qualify: 'Crm.Leads.Qualify',
    changeStatus: 'Crm.Leads.ChangeStatus',
  },
  activities: {
    read: 'Crm.Activities.Read',
    create: 'Crm.Activities.Create',
  },
  assessments: {
    read: 'Crm.Assessments.Read',
    create: 'Crm.Assessments.Create',
    schedule: 'Crm.Assessments.Schedule',
    complete: 'Crm.Assessments.Complete',
    cancel: 'Crm.Assessments.Cancel',
  },
  offers: {
    read: 'Crm.Offers.Read',
    create: 'Crm.Offers.Create',
    update: 'Crm.Offers.Update',
    send: 'Crm.Offers.Send',
    accept: 'Crm.Offers.Accept',
    reject: 'Crm.Offers.Reject',
  },
  conversions: {
    convertToStudent: 'Crm.Conversions.ConvertToStudent',
  },
} as const;
