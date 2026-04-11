export type FieldErrors = Record<string, string>;

export function validateEmail(value: string): string | null {
  if (!value.trim()) return "L'adresse e-mail est requise.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Adresse e-mail invalide.";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Le mot de passe est requis.";
  if (value.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (!/[A-Z]/.test(value)) return "Le mot de passe doit contenir au moins une majuscule.";
  if (!/[0-9]/.test(value)) return "Le mot de passe doit contenir au moins un chiffre.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Le mot de passe doit contenir au moins un caractère spécial.";
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
  // Strip actual HTML tags while preserving innocent < > in text (e.g. "3 < 5").
  // Matches opening/closing/self-closing tags and HTML comments.
  // React auto-escapes output; this is defense-in-depth against stored XSS.
  return value.replace(/<\/?[a-zA-Z!][^>]*>/g, "");
}
