export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

export const getTokenExpiryTime = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp;
  } catch {
    return null;
  }
};

export const getTimeUntilExpiry = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return Math.max(0, payload.exp - currentTime);
  } catch {
    return 0;
  }
};

export const shouldRefreshToken = (token: string, thresholdMinutes: number = 5): boolean => {
  const timeUntilExpiry = getTimeUntilExpiry(token);
  return timeUntilExpiry > 0 && timeUntilExpiry < (thresholdMinutes * 60);
}; 