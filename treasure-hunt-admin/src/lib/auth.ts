export function getToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("adminToken");
}

export function isAuthenticated() {
  const token = getToken();
  return !!token;
}
