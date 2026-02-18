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
