import { IMAGE_MIME_TYPE, MIME_TYPES } from "../../../shared/constants";

type ValidationResult = {
  success: boolean;
  fileName: string;
  reason: string;
};

const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
const allowedMimeTypes: string[] = [
  ...IMAGE_MIME_TYPE,
  MIME_TYPES.pdf,
  MIME_TYPES.docx,
];

export function validateFiles(
  newFiles: File[],
  existingFiles: File[]
): ValidationResult[] {
  return newFiles.map((file) => {
    const fileName = file.name;
    // Check if file already exists in the array
    if (existingFiles.some((existingFile) => existingFile.name === file.name)) {
      return {
        success: false,
        fileName,
        reason: "A file with the same name already exists.",
      };
    }

    // Check file size
    if (file.size > maxSizeInBytes) {
      return {
        success: false,
        fileName,
        reason: "File size exceeds the maximum limit of 5MB.",
      };
    }

    // Check file type
    if (!allowedMimeTypes.includes(file.type)) {
      return {
        success: false,
        fileName,
        reason:
          "Invalid file type. Only images, PDFs, and DOCX files are allowed.",
      };
    }

    // All validations passed
    return {
      success: true,
      fileName,
      reason: "File is valid and can be uploaded.",
    };
  });
}
