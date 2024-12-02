import { getSession } from "../sessionService.js"; // For sessions
import client from "../db/db.js";

async function getReservations() {
    try {
        const query = `
            SELECT resource_name, reservation_start, reservation_end
            FROM zephyr_booked_resources_view;
        `;
        const result = await client.queryObject(query);

        // Generate HTML table dynamically
        const tableRows = result.rows
            .map(row => `
                <tr>
                    <td>${row.resource_name}</td>
                    <td>${new Date(row.reservation_start).toLocaleString()}</td>
                    <td>${new Date(row.reservation_end).toLocaleString()}</td>
                </tr>
            `)
            .join("");
        return tableRows;
    } catch (error) {
        console.error("Error fetching booked resources:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

async function getReservationsWithUser() {
    try {
        const query = `
        SELECT
            r.resource_name,
            res.reservation_start,
            res.reservation_end,
            u.username AS reserver_username
        FROM zephyr_resources r
        JOIN zephyr_reservations res ON r.resource_id = res.resource_id
        JOIN zephyr_users u ON res.reserver_token = u.user_token;
        `;
        const result = await client.queryObject(query);

        // Generate HTML table dynamically
        const tableRows = result.rows
            .map(row => `
                <tr>
                    <td>${row.resource_name}</td>
                    <td>${new Date(row.reservation_start).toLocaleString()}</td>
                    <td>${new Date(row.reservation_end).toLocaleString()}</td>
                    <td>${row.reserver_username}</td>
                </tr>
            `)
            .join("");
        return tableRows;
    } catch (error) {
        console.error("Error fetching booked resources:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}


export async function handleIndex(req) {
    const session = getSession(req);
    // Generate HTML table dynamically
    const tableRows = await getReservationsWithUser();

    // Respond with a personalized welcome message
    const loggedHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Home</title>
                <link rel="stylesheet" href="/static/styles.css">
            </head>
            <body>
                <div class="container">
                    <h1>Welcome ${session.username}</h1>
                    <p>Please choose one of the options below:</p>
                    <ul>
                        <li><a href="/logout">Log Out</a></li>
                        <li><a href="/resources">Add a new resource</a></li>
                        <li><a href="/reservation">Add a new reservation</a></li>
                    </ul>
                <h1>Booked Resources</h1>
                <table border="1" cellpadding="5" cellspacing="0">
                    <thead>
                        <tr>
                            <th>Resource Name</th>
                            <th>Reservation Start</th>
                            <th>Reservation End</th>
                            <th>Reserver Username</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
            </body>
            </html>`;
    return new Response(loggedHtml, {
        headers: { "Content-Type": "text/html" },
    });
}

export async function handleDefaultIndex(req) {
    // Generate HTML table dynamically
    const tableRows = await getReservations();

    // Default HTML response
    const defaultHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Home</title>
        <link rel="stylesheet" href="/static/styles.css">
    </head>
    <body>
        <div class="container">
            <h1>Welcome to the Booking System</h1>
            <p>Please choose one of the options below:</p>
            <ul>
                <li><a href="/login">Login</a></li>
                <li><a href="/register">Register</a></li>
            </ul>
            <h1>Booked Resources</h1>
                <table border="1" cellpadding="5" cellspacing="0">
                    <thead>
                        <tr>
                            <th>Resource Name</th>
                            <th>Reservation Start</th>
                            <th>Reservation End</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
        </div>
    </body>
    </html>`;
    return new Response(defaultHtml, {
        headers: { "Content-Type": "text/html" },
    });
}