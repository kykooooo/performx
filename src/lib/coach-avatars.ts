const COACH_AVATAR_POOL = [
  "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/2202685/pexels-photo-2202685.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/8622140/pexels-photo-8622140.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/7691735/pexels-photo-7691735.jpeg?auto=compress&cs=tinysrgb&w=600",
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getCoachAvatarUrl(avatarUrl: string | null | undefined, identity: string) {
  if (avatarUrl && avatarUrl.trim().length > 0) {
    return avatarUrl;
  }
  const index = hashString(identity) % COACH_AVATAR_POOL.length;
  return COACH_AVATAR_POOL[index];
}

type CoachAvatarInput = {
  id: string;
  name?: string | null;
  speciality?: string | null;
  avatar_url?: string | null;
};

export function buildCoachAvatarMap(items: CoachAvatarInput[]) {
  const map = new Map<string, string>();
  const usedFallbacks = new Set<string>();

  items.forEach((item) => {
    if (item.avatar_url && item.avatar_url.trim().length > 0) {
      map.set(item.id, item.avatar_url);
      return;
    }

    const identity = `${item.name ?? ""}-${item.speciality ?? ""}-${item.id}`;
    const baseIndex = hashString(identity) % COACH_AVATAR_POOL.length;
    let selected = COACH_AVATAR_POOL[baseIndex];

    for (let offset = 0; offset < COACH_AVATAR_POOL.length; offset += 1) {
      const candidate = COACH_AVATAR_POOL[(baseIndex + offset) % COACH_AVATAR_POOL.length];
      if (!usedFallbacks.has(candidate)) {
        selected = candidate;
        break;
      }
    }

    usedFallbacks.add(selected);
    map.set(item.id, selected);
  });

  return map;
}
