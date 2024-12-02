import { Client } from "https://deno.land/x/postgres/mod.ts";

// Set up PostgreSQL client connection
const client = new Client({
  user: "postgres",
  database: "postgres", // Käytetään oikeaa tietokannan nimeä
  hostname: "localhost", // Docker-kontin isäntänimi (localhost toimii tässä)
  password: "mysecretpassword", // Salasana
  port: 5435, // PostgreSQL:n portti
});


await client.connect();

export default client;
