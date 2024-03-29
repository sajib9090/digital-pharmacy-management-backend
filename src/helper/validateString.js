import createError from "http-errors";

const validateString = (stringValue, errorTitle) => {
  const processedString = stringValue
    ?.toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s{2,}/g, " ");

  if (/^[^\w]/.test(processedString)) {
    throw createError(
      400,
      `${errorTitle} name cannot start with a special character`
    );
  }

  if (processedString.length < 3) {
    throw createError(
      400,
      `${errorTitle} name must be at least 3 characters long`
    );
  }
  if (processedString.length > 100) {
    throw createError(
      400,
      `${errorTitle} name can't be more than 100 characters long`
    );
  }

  return processedString;
};

export { validateString };
