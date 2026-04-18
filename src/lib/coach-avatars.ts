// Palette accent-aligned (orange PerformX + quelques tons complémentaires)
const AVATAR_COLORS = ["ff6a00", "ff8a33", "22c55e", "f59e0b", "6366f1", "ec4899"];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildInitialsAvatar(seed: string) {
  const color = AVATAR_COLORS[hashString(seed) % AVATAR_COLORS.length];
  const encoded = encodeURIComponent(seed.trim() || "Coach");
  // Dicebear "initials" : rendu propre, initiales sur fond plein coloré.
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encoded}&backgroundColor=${color}&textColor=ffffff&fontSize=42`;
}

export function getCoachAvatarUrl(avatarUrl: string | null | undefined, identity: string) {
  if (avatarUrl && avatarUrl.trim().length > 0) {
    return avatarUrl;
  }
  return buildInitialsAvatar(identity);
}

type CoachAvatarInput = {
  id: string;
  name?: string | null;
  speciality?: string | null;
  avatar_url?: string | null;
};

export function buildCoachAvatarMap(items: CoachAvatarInput[]) {
  const map = new Map<string, string>();

  items.forEach((item) => {
    if (item.avatar_url && item.avatar_url.trim().length > 0) {
      map.set(item.id, item.avatar_url);
      return;
    }
    map.set(item.id, buildInitialsAvatar(item.name ?? item.id));
  });

  return map;
}
