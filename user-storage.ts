export interface UserProfile {
  username: string;
  createdAt: string;
  lastUpdated: string;
}

export interface UserData {
  profile: UserProfile;
  settings: {
    capital: number;
    age: number;
    withdrawal: number;
    lifeExpectancy: number;
    bucket1Name: string;
    bucket1Weight: number;
    bucket1Return: number;
    bucket2Name: string;
    bucket2Weight: number;
    bucket2Return: number;
    bucket3Name: string;
    bucket3Weight: number;
    bucket3Return: number;
    inflationEnabled: boolean;
    inflationRate: number;
    avoidLossRealization: boolean;
  };
}

const STORAGE_KEY = "ruhestandsplaner_user";
const USERS_KEY = "ruhestandsplaner_users";

export const defaultSettings: UserData["settings"] = {
  capital: 500000,
  age: 65,
  withdrawal: 24000,
  lifeExpectancy: 95,
  bucket1Name: "Liquidität",
  bucket1Weight: 15,
  bucket1Return: 2,
  bucket2Name: "Anleihen",
  bucket2Weight: 35,
  bucket2Return: 4,
  bucket3Name: "Aktien",
  bucket3Weight: 50,
  bucket3Return: 7,
  inflationEnabled: true,
  inflationRate: 2,
  avoidLossRealization: true,
};

export function getCurrentUser(): UserData | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as UserData;
  } catch {
    return null;
  }
}

export function saveCurrentUser(userData: UserData): void {
  if (typeof window === "undefined") return;
  
  userData.profile.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  
  const users = getAllUsers();
  const existingIndex = users.findIndex(u => u.profile.username === userData.profile.username);
  if (existingIndex >= 0) {
    users[existingIndex] = userData;
  } else {
    users.push(userData);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getAllUsers(): UserData[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored) as UserData[];
  } catch {
    return [];
  }
}

export function loginUser(username: string): UserData {
  const users = getAllUsers();
  const existingUser = users.find(u => u.profile.username.toLowerCase() === username.toLowerCase());
  
  if (existingUser) {
    existingUser.profile.lastUpdated = new Date().toISOString();
    saveCurrentUser(existingUser);
    return existingUser;
  }
  
  const newUser: UserData = {
    profile: {
      username,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    },
    settings: { ...defaultSettings },
  };
  
  saveCurrentUser(newUser);
  return newUser;
}

export function logoutUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function updateUserSettings(settings: Partial<UserData["settings"]>): UserData | null {
  const user = getCurrentUser();
  if (!user) return null;
  
  user.settings = { ...user.settings, ...settings };
  saveCurrentUser(user);
  return user;
}