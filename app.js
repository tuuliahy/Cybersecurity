import { Hono } from "https://deno.land/x/hono/mod.ts";  // Hono-kirjasto HTTP-palvelimelle
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";  // PostgreSQL asiakas
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";  // Salasanan hashaukseen
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts"; // Zod validointiin
import * as path from "https://deno.land/std@0.186.0/path/mod.ts"; // Polun käsittelyyn

const app = new Hono(); // Luo Hono-sovellus

// PostgreSQL-yhteysasetukset
const client = new Client({
  user: "postgres",
  database: "postgres",
  hostname: "localhost",
  password: "Secret1234!",  // Muista vaihtaa salasana
  port: 5432,
});

// Yhdistetään tietokantaan
await client.connect();

// Zod-skeema rekisteröinnin validointiin
const registerSchema = z.object({
  username: z.string().email("Invalid email address").max(50, "Email must not exceed 50 characters"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  age: z.string()
    .regex(/^\d+$/, "Age must be a valid integer") // Tarkistaa, että ikä on kelvollinen luku
    .transform(value => {
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error("Invalid age");
      }
      return num;
    })
    .refine(val => val >= 15, { message: "You must be at least 15 years old" }), // Tarkistetaan, että ikä on vähintään 15
  role: z.enum(["reserver", "admin"], "Invalid role"),
});

// Zod-skeema kirjautumisen validointiin
const loginSchema = z.object({
  username: z.string().email("Invalid email address or password"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

// Middleware suojauksen otsikoiden lisäämiseen
app.use((c, next) => {
  // Lisää Content-Security-Policy (CSP)
  c.res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self'; " +
    "img-src 'self'; " +
    "frame-ancestors 'none'; " +  // Estää kaikki upotukset (Clickjacking)
    "form-action 'self'; "  // Rajoittaa lomakkeiden lähettämisen vain oman domainin sisälle
  );

  // Lisää X-Frame-Options (estää clickjackingin)
  c.res.headers.set("X-Frame-Options", "DENY");

  // Lisää X-Content-Type-Options (estää MIME-sniffingin)
  c.res.headers.set("X-Content-Type-Options", "nosniff");

  return next();
});

// Reititys juureen, joka näyttää etusivun valikon
app.get('/', async (c) => {
  try {
    const etusivuHtml = await Deno.readTextFile(path.join(Deno.cwd(), "etusivu.html"));
    return c.html(etusivuHtml);
  } catch (error) {
    console.error("Error reading etusivu.html:", error);
    return c.text('Error reading the homepage', 500);
  }
});

// Tarjoa rekisteröintilomake (lue tiedosto)
app.get('/register', async (c) => {
  try {
    const registerHtml = await Deno.readTextFile(path.join(Deno.cwd(), "register.html"));
    return c.html(registerHtml);
  } catch (error) {
    console.error("Error reading register.html:", error);
    return c.text('Error reading the register form', 500);
  }
});

// Käsittele rekisteröinti (lomakkeen lähetys)
app.post('/register', async (c) => {
  const body = await c.req.parseBody();
  const { username, password, age, role } = body;

  try {
    // Validointi Zod-skeemalla
    const validatedData = registerSchema.parse({
      username,
      password,
      age,
      role,
    });

    const { age: validatedAge } = validatedData;

    // Tarkista, onko sähköposti jo käytössä
    const result = await client.queryArray(
      `SELECT username FROM abc123_users WHERE username = $1`,
      [username]
    );
    if (result.rows.length > 0) {
      return c.html(`<p>Email already in use. Please try again.</p>`); // Virheviesti, jos sähköposti on jo käytössä
    }

    // Hashaa salasana bcrypt:llä
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Lisää uusi käyttäjä tietokantaan
    await client.queryArray(
      `INSERT INTO abc123_users (username, password_hash, age, role) 
       VALUES ($1, $2, $3, $4)`,
      [username, hashedPassword, validatedAge, role]
    );

    // Palauta onnistumisvastaus, jossa on linkki kirjautumissivulle ja etusivulle
    return c.html(`
      <h1>Registration Successful!</h1>
      <p>Click <a href="/login">here</a> to login.</p>
      <p>Click <a href="/">here</a> to go to the homepage.</p>
    `);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.text(`Validation Error: ${error.errors.map(e => e.message).join(", ")}`, 400);
    }
    console.error(error);
    return c.text('Error during registration', 500);
  }
});

// Tarjoa kirjautumislomake (lue tiedosto)
app.get('/login', async (c) => {
  try {
    const loginHtml = await Deno.readTextFile(path.join(Deno.cwd(), "login.html"));
    return c.html(loginHtml);
  } catch (error) {
    console.error("Error reading login.html:", error);
    return c.text('Error reading the login form', 500);
  }
});

// Käsittele kirjautuminen
app.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const { username, password } = body;

  try {
    // Validointi kirjautumisen syötteelle
    loginSchema.parse({ username, password });

    // Hae käyttäjä tietokannasta
    const result = await client.queryArray(
      `SELECT user_id, username, password_hash FROM abc123_users WHERE username = $1`,
      [username]
    );
    
    if (result.rows.length === 0) {
      return c.text('Invalid email or password', 400); // Jos käyttäjää ei löydy
    }

    const [userId, storedUsername, storedPasswordHash] = result.rows[0];

    // Tarkista, että salasana täsmää
    const passwordMatches = await bcrypt.compare(password, storedPasswordHash);
    if (!passwordMatches) {
      return c.text('Invalid email or password', 400); // Jos salasana ei täsmää
    }

    // Kirjautuminen onnistui, lisää linkki etusivulle
    return c.html(`
      <h1>Login Successful!</h1>
      <p>Click <a href="/">here</a> to go to the homepage.</p>
    `);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.text(`Validation Error: ${error.errors.map(e => e.message).join(", ")}`, 400);
    }

    console.error(error);
    return c.text('Error during login', 500);
  }
});

// Kuuntele palvelinta portissa 8000
Deno.serve(app.fetch, { port: 8000 });
