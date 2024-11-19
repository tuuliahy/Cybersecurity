import { Hono } from "https://deno.land/x/hono/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";  // PostgreSQL asiakas
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";  // Salasanan hashaukseen
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts"; // Zod validaatio

const app = new Hono();

// PostgreSQL-yhteysasetukset
const client = new Client({
  user: "postgres",
  database: "postgres",
  hostname: "localhost",
  password: "Secret1234!",
  port: 5432,
});

// Yhdistetään tietokantaan
await client.connect();

// Zod-skeema rekisteröinnin validointiin
const registerSchema = z.object({
  username: z.string().email("Invalid email address").max(50, "Email must not exceed 50 characters"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(["reserver", "admin"], "Invalid role"),
  consent_to_data_collection: z.boolean(),  // Odotetaan boolean
});

// Tarjoa rekisteröintilomake
app.get('/', async (c) => {
  return c.html(await Deno.readTextFile("./index.html"));
});

// Käsittele käyttäjien rekisteröinti (lomakkeen lähetys)
app.post('/register', async (c) => {
  const body = await c.req.parseBody();

  // Varmistetaan, että consent_to_data_collection on boolean
  const consent_to_data_collection = body.consent_to_data_collection === "on"; // Muutetaan "on" tai "off" boolean-arvoksi

  try {
    // Validoi tiedot Zod-skeemalla
    const validatedData = registerSchema.parse({
      ...body,
      consent_to_data_collection, // Uusi kenttä, jossa on oikea boolean-arvo
    });

    const { username, password, role } = validatedData;

    // Tarkista, onko käyttäjätunnus jo olemassa
    const result = await client.queryArray(
      `SELECT username FROM abc123_users WHERE username = $1`,
      [username]
    );
    if (result.rows.length > 0) {
      return c.text('Email already in use', 400);
    }

    // Hashaa käyttäjän salasana
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Lisää uusi käyttäjä tietokantaan
    await client.queryArray(
      `INSERT INTO abc123_users (username, password_hash, role, consent_to_data_collection) 
       VALUES ($1, $2, $3, $4::BOOLEAN)`,
      [username, hashedPassword, role, consent_to_data_collection]
    );

    // Palauta onnistumisvastaus
    return c.text('User registered successfully!');
  } catch (error) {
    // Jos Zod-validointi epäonnistuu, palautetaan virhe
    if (error instanceof z.ZodError) {
      return c.text(`Validation Error: ${error.errors.map(e => e.message).join(", ")}`, 400);
    }
    console.error(error);
    return c.text('Error during registration', 500);
  }
});

// Kuuntele palvelinta portissa 8000
Deno.serve(app.fetch, { port: 8000 });
