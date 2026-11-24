export const DEFAULT_AVATAR = "https://i.pinimg.com/736x/54/c7/c3/54c7c36c20ced3eb982c4e3e21f465fe.jpg";

/**
 * Returns the profile picture URL with a cache-busting parameter (?v=...),
 * or the default avatar if the user has no custom profile picture.
 */
export const getAvatarUrl = (user, fallback = DEFAULT_AVATAR) => {
  if (!user) return fallback;

  if (user.hasProfilePicture || user.profilePictureUrl) {
    let url = user.profilePictureUrl;
    if (!url) {
      url = `http://localhost:8080/api/users/${user.id}/avatar`;
    }

    const version = user.updatedAt
      ? new Date(user.updatedAt).getTime()
      : (user._avatarVersion || Date.now());

    if (!url.includes("?v=") && !url.includes("&v=")) {
      url += (url.includes("?") ? "&" : "?") + `v=${version}`;
    }
    return url;
  }

  return fallback;
};
