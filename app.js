// app.js
import { Hono } from "https://deno.land/x/hono@v2.1.2/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { hash } from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";
import { serveStatic } from "https://deno.land/x/hono@v2.1.2/middleware.ts";

const app = new Hono();

// PostgreSQL-yhteysasetukset
const client = new Client({
  user: "postgres",
  database: "postgres",
  hostname: "localhost",
  password: "Secret1234!",
  port: 5432,
});

// Yhdistä tietokantaan
await client.connect();

// Palvelin staattinen HTML-tiedosto
app.use("/", serveStatic({ path: "./index.html" }));

// Rekisteröintireitti
app.post("/register", async (c) => {
  const { username, password, email, age, consent_to_data_collection } = await c.req.parseBody();

  // Syötteen validointi
  if (!username || !password || !email || !age) {
    return c.text("All fields are required!", 400);
  }
  if (parseInt(age) < 15) {
    return c.text("User must be over 15 years old to register.", 400);
  }

  // Tarkista, onko käyttäjä jo olemassa
  const existingUser = await client.queryObject(
    "SELECT * FROM abc123_users WHERE username = $1 OR email = $2",
    username,
    email,
  );
  if (existingUser.rowCount > 0) {
    return c.text("Username or Email already in use!", 400);
  }

  // Hashaa salasana ja lisää käyttäjä tietokantaan
  const passwordHash = await hash(password);
  try {
    await client.queryObject(
      `INSERT INTO abc123_users (username, password_hash, email, role, age, consent_to_data_collection) 
       VALUES ($1, $2, $3, 'reserver', $4, $5)`,
      username,
      passwordHash,
      email,
      parseInt(age),
      consent_to_data_collection === "on"
    );
    return c.text("User registered successfully!", 201);
  } catch (error) {
    console.error("Error inserting user:", error);
    return c.text("Error registering user.", 500);
  }
});

Deno.serve(app.fetch);