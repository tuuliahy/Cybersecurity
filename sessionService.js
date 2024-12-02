import { getCookie, setCookie, deleteCookie } from "https://deno.land/x/hono@v4.3.11/helper.ts";

// In-memory session store (replace with a database in production)
const sessionStore = new Map();

// Session expiration time (e.g., 1 hour in milliseconds)
const SESSION_EXPIRATION_TIME = 60 * 60 * 1000;

// Create a session for the user
export function createSession(user) {
    const sessionId = crypto.randomUUID(); // Generate a unique session ID
    const sessionData = {
        username: user.username,
        role: user.role,
        createdAt: Date.now(),
    };
    sessionStore.set(sessionId, sessionData); // Store the session data

    return sessionId; // Ensure this is a string
}

// Retrieve session data by session ID
export function getSession(req) {
    const cookies = req.headers.get("Cookie") || "";
    const sessionId = getCookieValue(cookies, "session_id");

    if (!sessionId) return null;

    const sessionData = sessionStore.get(sessionId);
    if (sessionData && Date.now() - sessionData.createdAt < SESSION_EXPIRATION_TIME) {
        return sessionData; // Return valid session
    }

    // Session expired or invalid
    sessionStore.delete(sessionId); // Remove expired session
    return null;
}


// Helper function to parse cookies
export function getCookieValue(cookies, name) {
    const cookieArr = cookies.split(";").map(cookie => cookie.trim());
    for (const cookie of cookieArr) {
        const [key, value] = cookie.split("=");
        if (key === name) {
            return value;
        }
    }
    return null;
}

// Destroy a session
export function destroySession(sessionId) {
    if (sessionId) {
        sessionStore.delete(sessionId); // Remove the session data
    }
}