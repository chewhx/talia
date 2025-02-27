// // From HeyTalia WebApp
export const TALIA_EVENTS = {
  actions: {
    SCAN_FORM_REQUEST: "SCAN_FORM_REQUEST", // Request Extension to Scan Form (For SLS, GoogleClassroom, FormSG, etc)
    FILL_FORM_REQUEST: "FILL_FORM_REQUEST", // Request Extension to fill in the form  (For SLS, GoogleClassroom, FormSG, etc)
    PG_DRAFT_REQUEST: "PG_DRAFT_REQUEST", // Request Extension to send request to PG to create draft
    GO_DRAFT_PAGE: "GO_DRAFT_PAGE", // Request Extension to navigate into draft page with given draftID
  },
  listeners: {
    SCAN_FORM_RESPONSE: "SCAN_FORM_RESPONSE", // Listen scanned form response from extension
    PG_DRAFT_RESPONSE: "PG_DRAFT_RESPONSE", // LIsten draft response from extension
    PG_UNAUTHORIZED: "PG_UNAUTHORIZED",
  },
};
