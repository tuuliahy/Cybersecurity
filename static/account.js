document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Fetch account information from the server
        const response = await fetch("/accountInfo");
        if (!response.ok) {
            throw new Error("Failed to fetch account information");
        }
        const accountData = await response.json();

        // Populate account information on the page
        document.getElementById("username").textContent = accountData.username;
        document.getElementById("role").textContent = accountData.role;
        document.getElementById("terms_accepted").textContent = accountData.terms_accepted ? "Yes" : "No";
        document.getElementById("created_at").textContent = new Date(accountData.created_at).toLocaleString();
    } catch (error) {
        console.error("Error loading account information:", error);
        //alert("Failed to load account information. Please try again later.");
    }
});
