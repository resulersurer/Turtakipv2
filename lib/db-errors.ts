export function isMissingPrismaTable(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2021"
  );
}

export function isPrismaSetupError(error: unknown) {
  return isMissingPrismaTable(error);
}
