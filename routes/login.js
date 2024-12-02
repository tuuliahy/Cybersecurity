import client from "../db/db.js";
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts"; // For password comparison
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts"; // For validation
import { createSession } from "../sessionService.js"; // For sessions

// Zod schema for login validation
const loginSchema = z.object({
    username: z.string().email({ message: "Invalid email address" }),
});

// Log the successful login
async function logLogin(userUUID, ipAddress) {
    try {
        await client.queryArray(`INSERT INTO login_logs (user_token, ip_address) VALUES ($1, $2)`, [userUUID, ipAddress]);
    } catch (error) {
        console.error("Error logging login event:", error);
    }
}

// Helper function to fetch the user by email
async function getUserByEmail(email) {
    const result = await client.queryArray(`SELECT username, password_hash, user_token, role FROM zephyr_users WHERE username = $1`, [email]);
    return result.rows.length > 0 ? result.rows[0] : null;
}

// Handle user login
export async function loginUser(req, info) {
    const username = req.get('username');
    const password = req.get('password');
    try {
        // Validate the input data using Zod
        loginSchema.parse({ username });

        // Fetch the user by email
        const user = await getUserByEmail(username);
        if (!user) {
            return new Response("Invalid email or password", { status: 400 });
        }

        const [storedUsername, storedPasswordHash, userUUID, role] = user;

        // Compare provided password with the stored hashed password
        const passwordMatches = await bcrypt.compare(password, storedPasswordHash);
        if (!passwordMatches) {
            return new Response("Invalid email or password", { status: 400 });
        }

        // Create session
        const sessionId = createSession({ username: storedUsername, role });

        // Log successful login
        const ipAddress = info.remoteAddr.hostname;
        await logLogin(userUUID, ipAddress);

        // Return a redirect response with the Set-Cookie header
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/",
                "Set-Cookie": `session_id=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/`,
            },
        });


    } catch (error) {
        if (error instanceof z.ZodError) {
            // Handle validation errors from Zod
            return new Response(`Validation Error: ${error.errors.map(e => e.message).join(", ")}`, { status: 400 });
        }
        console.error(error);
        return new Response("Error during login", { status: 500 });
    }
}
