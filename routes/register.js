import client from "../db/db.js";
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts"; // Import Zod

// Zod schema for validating the registration form
const registerSchema = z.object({
    username: z.string().email({ message: "Invalid email address" }).max(50, "Email must not exceed 50 characters"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    birthdate: z.string().refine((date) => {
        // Ensure birthdate is a valid date (and optionally check for age)
        const birthDateObj = new Date(date);
        return !isNaN(birthDateObj.getTime()); // Check if it's a valid date
    }, { message: "Invalid birthdate" }),
    role: z.enum(["reserver", "administrator"], { message: "Invalid role" }),
    terms_accepted: z.enum(["on"], { message: "You must accept the terms of service." }),
});

// Helper function to check if a username (email) already exists
async function isUniqueUsername(email) {
    const result = await client.queryArray(`SELECT username FROM zephyr_users WHERE username = $1`, [email]);
    return result.rows.length === 0;
}

// Handle user registration
export async function registerUser(c) {
    const username = c.get('username');
    const password = c.get('password');
    const birthdate = c.get('birthdate');
    const role = c.get('role');
    const terms_accepted = c.get('accept_terms');
    try {
        // Validate the input data using Zod
        registerSchema.parse({ username, password, birthdate, role, terms_accepted });

        // Check if the email is unique
        if (!(await isUniqueUsername(username))) {
            return new Response("Email already in use", { status: 400 });
        }
        // Hash the user's password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert the new user into the database
        await client.queryArray(
            `INSERT INTO zephyr_users (username, password_hash, role, birthdate, terms_accepted, created_at) 
             VALUES ($1, $2, $3, $4, TRUE, NOW())`,
            [username, hashedPassword, role, birthdate]
        );
        // Success response, redirect to the index page
        return new Response(null, { status: 302, headers: { Location: "/", }, });

    } catch (error) {
        if (error instanceof z.ZodError) {
            // Handle validation errors from Zod
            return new Response(`Validation Error: ${error.errors.map(e => e.message).join(", ")}`, { status: 400 });
        }
        console.error(error);
        return new Response("Error during registration", { status: 500 });
    }
}

export async function getAccountInfo(username) {
    try {
        // Fetch account details from the database
        const result = await client.queryObject(
            `SELECT username, role, terms_accepted, created_at FROM zephyr_users WHERE username = $1`,
            [username]
        );

        if (result.rows.length === 0) {
            return new Response("Account not found", { status: 404 });
        }

        // Respond with the account details
        return new Response(JSON.stringify(result.rows[0]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching account information:", error);
        return new Response("Error fetching account information", { status: 500 });
    }
}