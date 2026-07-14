export type InstagramProfile = {
  provider: "scrapecreators";
  providerUserId: string | null;
  username: string | null;
  displayName: string | null;
  biography: string | null;
  profileImageUrl: string | null;
  externalUrl: string | null;
  followersCount: number | null;
  followingCount: number | null;
  postsCount: number | null;
  isPrivate: boolean | null;
  isVerified: boolean | null;
  isBusiness: boolean | null;
  category: string | null;
  rawDataAvailable: boolean;
  fetchedAt: string;
};
