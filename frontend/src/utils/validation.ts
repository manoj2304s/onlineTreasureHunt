export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isStrongEnoughPassword = (password: string) => {
  return password.length >= 6;
};
