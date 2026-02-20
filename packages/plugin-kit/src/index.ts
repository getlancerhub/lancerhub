// Plugin kit placeholder:
// define event types + webhook payload contracts here
export type LancerHubEvent =
  | { type: 'invoice.paid'; data: { invoiceId: string; workspaceId: string } }
  | {
      type: 'form.submitted'
      data: { formId: string; submissionId: string; workspaceId: string }
    }

export const pluginKitVersion = '0.0.1'
