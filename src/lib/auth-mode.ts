export function authMode() {
  return (
    process.env.AUTH_MODE ??
    (process.env.ENVIRONMENT === "local" ? "local" : "ldap")
  );
}

export function passwordlessDevelopment() {
  return process.env.NODE_ENV === "development" && authMode() === "local";
}
