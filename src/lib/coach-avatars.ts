/**
 * Renvoie l'URL d'une vraie photo si elle existe, sinon `null`.
 * Le rendu visuel sans photo est géré côté composant (initiales + gradient
 * accent + emoji de spécialité) plutôt que par un service tiers comme
 * Dicebear : plus rapide, plus cohérent avec la charte, pas de dépendance
 * réseau.
 */
export function getCoachAvatarUrl(
  avatarUrl: string | null | undefined,
  _identity: string,
): string | null {
  void _identity;
  if (avatarUrl && avatarUrl.trim().length > 0) {
    return avatarUrl;
  }
  return null;
}

type CoachAvatarInput = {
  id: string;
  name?: string | null;
  speciality?: string | null;
  avatar_url?: string | null;
};

export function buildCoachAvatarMap(items: CoachAvatarInput[]) {
  const map = new Map<string, string | null>();

  items.forEach((item) => {
    if (item.avatar_url && item.avatar_url.trim().length > 0) {
      map.set(item.id, item.avatar_url);
      return;
    }
    map.set(item.id, null);
  });

  return map;
}
