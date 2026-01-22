/**
 * Session ID management
 * Uses sessionStorage - clears when tab closes
 */

const SESSION_KEY = 'sprekta-session-id';

const Session = {
  getId() {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  },

  clear() {
    sessionStorage.removeItem(SESSION_KEY);
  },

  // Generate new session (for "New conversation")
  regenerate() {
    const newId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, newId);
    return newId;
  }
};

export default Session;
