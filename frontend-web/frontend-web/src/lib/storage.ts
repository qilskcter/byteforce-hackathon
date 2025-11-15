// LocalStorage utilities for ByteEdu

export interface Contribution {
  id: string;
  fileName: string;
  type: string;
  uploadDate: string;
  impactScore: number;
  verified: boolean;
}

export interface Vote {
  proposalId: number;
  amount: number;
  choice: "approve" | "reject";
  date: string;
  txHash: string;
}

export interface Badge {
  id: string;
  name: string;
  color: string;
  earnedDate: string | null;
  obtained: boolean;
  txHash?: string;
}

export interface StudentProfile {
  name: string;
  did: string;
  major: string;
  classYear: string;
  gpa: number;
  semester: string;
  email: string;
}

const STORAGE_KEYS = {
  CONTRIBUTIONS: "byteedu_contributions",
  TOKENS: "byteedu_tokens",
  BADGES: "byteedu_badges",
  VOTES: "byteedu_votes",
  PROFILE: "byteedu_profile",
  AUTHENTICATED: "byteedu_authenticated",
  CURRENT_USER: "byteedu_current_user",
  VERSION: "byteedu_version",
};

const CURRENT_VERSION = "1.1"; // Updated version with txHash support

// Initialize default data
const DEFAULT_PROFILE: StudentProfile = {
  name: "Nguyen Duc Khanh",
  did: "did:byteedu:0x98F7B3C2E1D5A8F4E9C6B2A7D3E5F1A3E",
  major: "Computer Science",
  classYear: "2025",
  gpa: 3.76,
  semester: "Spring 2025",
  email: "khanh.nguyen@byteedu.edu",
};

const DEFAULT_BADGES: Badge[] = [
  { id: "1", name: "Research Excellence", color: "bg-blue-500", obtained: true, earnedDate: "2024-09-15", txHash: "0x8fe08ef56cbefe58fe08ef56cbefe58fe08ef56c" },
  { id: "2", name: "Leadership", color: "bg-purple-500", obtained: true, earnedDate: "2024-10-20", txHash: "0x7a9c3b5e2f1d8c4a6e9b7c3f5a8d2e6b4c1f9a7e" },
  { id: "3", name: "Volunteer Star", color: "bg-green-500", obtained: true, earnedDate: "2024-11-05", txHash: "0x3d5f7a9c1e8b4a6c2f5d8e9a7c3b1f6e4d2a8c5e" },
  { id: "4", name: "Academic Excellence", color: "bg-yellow-500", obtained: true, earnedDate: "2024-08-30", txHash: "0x9b4e6c2a8f5d3e7a1c9b6f4e2d8a5c7e3b1f9d6a" },
  { id: "5", name: "Innovation Award", color: "bg-pink-500", obtained: false, earnedDate: null },
  { id: "6", name: "Community Builder", color: "bg-indigo-500", obtained: true, earnedDate: "2024-09-25", txHash: "0x2e8d5a3f7c9b1e6a4d8f5c2e9a7b3d6f1c8e4a5b" },
  { id: "7", name: "Global Citizen", color: "bg-orange-500", obtained: false, earnedDate: null },
  { id: "8", name: "Tech Pioneer", color: "bg-cyan-500", obtained: true, earnedDate: "2024-10-10", txHash: "0x5c8f2a9e7b3d1f6c4e8a5d2b9f7c3e1a6d4b8f5c" },
  { id: "9", name: "Social Impact", color: "bg-emerald-500", obtained: true, earnedDate: "2024-11-12", txHash: "0x6f9a3c5e8d2b7f1a4c6e9d5b8a3f7c1e4d2b9f6a" },
];

const DEFAULT_CONTRIBUTIONS: Contribution[] = [
  {
    id: "1730800001",
    fileName: "AI_Research_Paper_Final.pdf",
    type: "research",
    uploadDate: "2024-10-15T14:30:00.000Z",
    impactScore: 92,
    verified: true,
  },
  {
    id: "1730800002",
    fileName: "Community_Service_Certificate.jpg",
    type: "volunteer",
    uploadDate: "2024-10-18T09:15:00.000Z",
    impactScore: 85,
    verified: true,
  },
  {
    id: "1730800003",
    fileName: "Blockchain_Competition_Award.pdf",
    type: "competition",
    uploadDate: "2024-10-22T16:45:00.000Z",
    impactScore: 95,
    verified: true,
  },
  {
    id: "1730800004",
    fileName: "CS301_Midterm_Exam_Score.pdf",
    type: "quiz",
    uploadDate: "2024-10-25T11:20:00.000Z",
    impactScore: 88,
    verified: true,
  },
  {
    id: "1730800005",
    fileName: "Tech_Club_President_Certificate.jpg",
    type: "leadership",
    uploadDate: "2024-11-01T10:30:00.000Z",
    impactScore: 90,
    verified: true,
  },
  {
    id: "1730800006",
    fileName: "Database_Systems_Perfect_Attendance.pdf",
    type: "attendance",
    uploadDate: "2024-11-05T08:00:00.000Z",
    impactScore: 78,
    verified: true,
  },
  {
    id: "1730800007",
    fileName: "National_Hackathon_2024_Winner.jpg",
    type: "competition",
    uploadDate: "2024-11-08T15:30:00.000Z",
    impactScore: 87,
    verified: true,
  },
  {
    id: "1730800008",
    fileName: "Machine_Learning_Research_Publication.pdf",
    type: "research",
    uploadDate: "2024-09-20T13:00:00.000Z",
    impactScore: 94,
    verified: true,
  },
  {
    id: "1730800009",
    fileName: "Environmental_Volunteer_Project.jpg",
    type: "volunteer",
    uploadDate: "2024-09-28T10:45:00.000Z",
    impactScore: 82,
    verified: true,
  },
  {
    id: "1730800010",
    fileName: "Math_Olympiad_Bronze_Medal.pdf",
    type: "competition",
    uploadDate: "2024-08-15T14:20:00.000Z",
    impactScore: 86,
    verified: true,
  },
];

const DEFAULT_VOTES: Vote[] = [
  {
    proposalId: 11,
    amount: 15,
    choice: "approve",
    date: "2024-10-20T14:30:00.000Z",
    txHash: "0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385"
  },
  {
    proposalId: 10,
    amount: 20,
    choice: "approve",
    date: "2024-10-25T09:15:00.000Z",
    txHash: "0x3c2f8b4e6d1a9c7b5e3f8d4c2a1b9e7f6d5c4b3a2e1f9d8c7b6a5e4f3d2c1b0a"
  },
  {
    proposalId: 9,
    amount: 10,
    choice: "reject",
    date: "2024-11-01T16:45:00.000Z",
    txHash: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
  },
  {
    proposalId: 8,
    amount: 25,
    choice: "approve",
    date: "2024-09-15T11:20:00.000Z",
    txHash: "0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5"
  },
  {
    proposalId: 7,
    amount: 12,
    choice: "approve",
    date: "2024-09-22T08:30:00.000Z",
    txHash: "0xf6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7"
  },
];

// Get functions
export const getContributions = (): Contribution[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CONTRIBUTIONS);
  return data ? JSON.parse(data) : DEFAULT_CONTRIBUTIONS;
};

export const getTokenBalance = (): number => {
  const data = localStorage.getItem(STORAGE_KEYS.TOKENS);
  return data ? parseInt(data) : 300;
};

export const getBadges = (): Badge[] => {
  const data = localStorage.getItem(STORAGE_KEYS.BADGES);
  if (!data) return DEFAULT_BADGES;
  
  // Merge txHash from DEFAULT_BADGES to existing badges if missing
  const existingBadges: Badge[] = JSON.parse(data);
  const updatedBadges = existingBadges.map(badge => {
    const defaultBadge = DEFAULT_BADGES.find(db => db.id === badge.id);
    if (defaultBadge && !badge.txHash && defaultBadge.txHash) {
      return { ...badge, txHash: defaultBadge.txHash };
    }
    return badge;
  });
  
  // Save updated badges back to localStorage
  localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(updatedBadges));
  return updatedBadges;
};

export const getVotes = (): Vote[] => {
  const data = localStorage.getItem(STORAGE_KEYS.VOTES);
  return data ? JSON.parse(data) : DEFAULT_VOTES;
};

export const getProfile = (): StudentProfile => {
  const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
  return data ? JSON.parse(data) : DEFAULT_PROFILE;
};

// Set functions
export const addContribution = (contribution: Contribution) => {
  const contributions = getContributions();
  contributions.unshift(contribution);
  localStorage.setItem(STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(contributions));
};

export const setTokenBalance = (balance: number) => {
  localStorage.setItem(STORAGE_KEYS.TOKENS, balance.toString());
};

export const addTokens = (amount: number) => {
  const current = getTokenBalance();
  setTokenBalance(current + amount);
};

export const deductTokens = (amount: number) => {
  const current = getTokenBalance();
  setTokenBalance(Math.max(0, current - amount));
};

export const earnBadge = (badgeId: string) => {
  const badges = getBadges();
  const updatedBadges = badges.map(badge => {
    if (badge.id === badgeId) {
      // Generate a consistent txHash if not exists
      const txHash = badge.txHash || `0x${Math.random().toString(16).substring(2, 42)}`;
      return { ...badge, obtained: true, earnedDate: new Date().toISOString(), txHash };
    }
    return badge;
  });
  localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(updatedBadges));
};

export const addVote = (vote: Vote) => {
  const votes = getVotes();
  votes.unshift(vote);
  localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(votes));
};

export const updateProfile = (profile: Partial<StudentProfile>) => {
  const current = getProfile();
  const updated = { ...current, ...profile };
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
};

// Authentication functions
export const setAuthenticated = (authenticated: boolean) => {
  localStorage.setItem(STORAGE_KEYS.AUTHENTICATED, authenticated.toString());
};

export const isAuthenticated = (): boolean => {
  const data = localStorage.getItem(STORAGE_KEYS.AUTHENTICATED);
  return data === "true";
};

export const setCurrentUser = (profile: StudentProfile) => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));
  updateProfile(profile);
  setAuthenticated(true);
};

export const logout = () => {
  setAuthenticated(false);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

// Initialize storage with default data if empty
export const initializeStorage = () => {
  const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
  
  // If version changed, force update badges to get new txHash
  if (storedVersion !== CURRENT_VERSION) {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(DEFAULT_BADGES));
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BADGES)) {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(DEFAULT_BADGES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TOKENS)) {
    localStorage.setItem(STORAGE_KEYS.TOKENS, "300");
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONTRIBUTIONS)) {
    localStorage.setItem(STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(DEFAULT_CONTRIBUTIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.VOTES)) {
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(DEFAULT_VOTES));
  }
};

// Force refresh badges with default data (useful after schema changes)
export const resetBadges = () => {
  localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(DEFAULT_BADGES));
};
