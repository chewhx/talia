// // From HeyTalia WebApp
export const TALIA_EVENTS = {
  actions: {
    SCAN_FORM_REQUEST: "SCAN_FORM_REQUEST", // Request Extension to Scan Form (For SLS, GoogleClassroom, FormSG, etc)
    FILL_FORM_REQUEST: "FILL_FORM_REQUEST", // Request Extension to fill in the form  (For SLS, GoogleClassroom, FormSG, etc)
    PG_DRAFT_REQUEST: "PG_DRAFT_REQUEST", // Request Extension to send request to PG to create draft
    GO_DRAFT_PAGE: "GO_DRAFT_PAGE", // Request Extension to navigate into draft page with given draftID
    IDENTITY_CURRENT_ACTIVE_TAB: "IDENTITY_CURRENT_ACTIVE_TAB", // Identify the current active tab
  },
  listeners: {
    SCAN_FORM_RESPONSE: "SCAN_FORM_RESPONSE", // Listen scanned form response from extension
    PG_DRAFT_RESPONSE: "PG_DRAFT_RESPONSE", // LIsten draft response from extension
    CURRENT_ACTIVE_TAB_RESPONSE: "CURRENT_ACTIVE_TAB_RESPONSE",
    PG_UNAUTHORIZED: "PG_UNAUTHORIZED",
  },
};

export const MIME_TYPES = {
  // Images
  png: "image/png",
  gif: "image/gif",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",

  // Documents
  mp4: "video/mp4",
  zip: "application/zip",
  rar: "application/x-rar",
  "7z": "application/x-7z-compressed",
  csv: "text/csv",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  exe: "application/vnd.microsoft.portable-executable",
} as const;

export const IMAGE_MIME_TYPE = [
  MIME_TYPES.png,
  MIME_TYPES.gif,
  MIME_TYPES.jpeg,
  MIME_TYPES.svg,
  MIME_TYPES.webp,
  MIME_TYPES.avif,
  MIME_TYPES.heic,
  MIME_TYPES.heif,
];
