# The booking system
1. Create a database
    1. Install Docker: https://www.docker.com/
    2. Load the postgres image: docker pull postgres
    3. Create a container: docker run --name booking_system_database -e POSTGRES_PASSWORD=Secret1234! -d -p 5432:5432 postgres
    4. Connect to the database: docker exec -it booking_system_database psql -U postgres -d postgres
    5. Copy the file booking_system_structure.sql to the clipboard.
    6. Paste the file into the psql terminal
2. Run the command: deno run --allow-net --allow-env --allow-read --watch app.js

# Pages
1. http://localhost:8000/register --> GET and POST
2. http://localhost:8000/login --> GET and POST
3. http://localhost:8000/logout --> GET
4. http://localhost:8000/resources --> GET and POST
5. http://localhost:8000/reservation --> GET and POST
6. http://localhost:8000/resourcesList --> GET


# Logbook

30.10.2024, 2h, Kick-off lecture, Lecture recording

| Date  | Used hours | Subject(s) |  output |
| :---         |     :---:      |     :---:      |     :---:      |
| 30.10.2024 | 2 | Kick-off lecture  | Lecture recording  |
| 31.10.2024 | 2 | Kick-off lecture  | Lecture recording  |
| 30.10.2024 | 2 | Kick-off lecture  | Lecture recording  |
| 30.10.2024 | 2 | Kick-off lecture  | Lecture recording  |
