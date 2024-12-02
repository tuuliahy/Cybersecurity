// Fetch available resources and populate the dropdown
async function loadResources() {
    try {
        const response = await fetch('/resourcesList');
        const resources = await response.json();
        const resourceDropdown = document.getElementById('resource_id');
        resources.forEach(resource => {
            const option = document.createElement('option');
            option.value = resource.resource_id;
            option.textContent = `${resource.resource_name} (${resource.resource_description})`;
            resourceDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading resources:', error);
    }
}

// Load resources when the page is loaded
document.addEventListener('DOMContentLoaded', loadResources);
