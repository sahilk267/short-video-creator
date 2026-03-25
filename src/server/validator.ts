import { createShortInput, CreateShortInput, videoIdSchema, statusRequestSchema, StatusRequest } from "../types/shorts";
import { logger } from "../logger";
import { ZodError } from "zod";

export interface ValidationErrorResult {
  message: string;
  missingFields: Record<string, string>;
  fieldErrors: Record<string, string[]>;
}

export function validateCreateShortInput(input: object): CreateShortInput {
  const validated = createShortInput.safeParse(input);
  logger.info({ validated }, "Validated create short input");

  if (validated.success) {
    return validated.data;
  }

  // Process the validation errors
  const errorResult = formatZodError(validated.error);

  throw new Error(
    JSON.stringify({
      message: errorResult.message,
      missingFields: errorResult.missingFields,
      fieldErrors: errorResult.fieldErrors,
    }),
  );
}

export function validateVideoId(videoId: string): string {
  const validated = videoIdSchema.safeParse(videoId);
  
  if (validated.success) {
    return validated.data;
  }

  const errorResult = formatZodError(validated.error);
  throw new Error(
    JSON.stringify({
      message: "Invalid video ID format",
      details: errorResult.missingFields,
    }),
  );
}

export function validateStatusRequest(input: object): StatusRequest {
  const validated = statusRequestSchema.safeParse(input);
  
  if (validated.success) {
    return validated.data;
  }

  const errorResult = formatZodError(validated.error);
  throw new Error(
    JSON.stringify({
      message: "Invalid status request",
      details: errorResult.missingFields,
    }),
  );
}

function formatZodError(error: ZodError): ValidationErrorResult {
  const missingFields: Record<string, string> = {};
  const fieldErrors: Record<string, string[]> = {};

  // Extract all the errors into a human-readable format
  error.issues.forEach((err: any) => {
    const path = err.path.join(".");
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(err.message);
    
    // For missing fields, use the first error message
    if (!missingFields[path]) {
      missingFields[path] = err.message;
    }
  });

  // Create a human-readable message
  const errorPaths = Object.keys(missingFields);
  let message = `Validation failed for ${errorPaths.length} field(s): `;
  message += errorPaths.map(path => `${path} (${missingFields[path]})`).join(", ");

  return {
    message,
    missingFields,
    fieldErrors,
  };
}
