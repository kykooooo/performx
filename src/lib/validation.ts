export type FieldErrors = Record<string, string>;

export function validateEmail(value: string): string | null {
  if (!value.trim()) return "L'adresse e-mail est requise.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Adresse e-mail invalide.";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Le mot de passe est requis.";
  if (value.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) return `${label} est requis.`;
  return null;
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return "Les mots de passe ne correspondent pas.";
  return null;
}

export function validatePrice(value: number): string | null {
  if (value < 0) return "Le prix ne peut pas être négatif.";
  if (value > 1000) return "Le prix semble trop élevé.";
  return null;
}

export function sanitizeInput(value: string): string {
  return value.replace(/[<>]/g, "");
}
