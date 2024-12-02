import client from "../db/db.js";

export async function getResources(req) {
    const query = `SELECT resource_id, resource_name, resource_description FROM zephyr_resources`;
    try {
        const result = await client.queryObject(query);
        return new Response(JSON.stringify(result.rows), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error('Error fetching resources:', error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

export async function registerResource(req) {
    const resourceName = req.get("resource_name");
    const resourceDescription = req.get("resource_description");
    try {
        const query = `INSERT INTO zephyr_resources (resource_name, resource_description) VALUES ($1, $2)`;
        await client.queryArray(query, [resourceName, resourceDescription]);
        return new Response(null, { status: 302, headers: { Location: "/", }, });
    } catch (error) {
        console.error(error);
        return new Response("Error during adding resource", { status: 500 });
    }
}
