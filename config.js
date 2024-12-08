let config = null;


export async function loadConfig() {
    if (config) {
        return config; 
    }

    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error(`Failed to load config: ${response.status}`);
        }
        config = await response.json();
        console.log("Configuration loaded:", config);
        return config;
    } catch (error) {
        console.error("Error loading configuration:", error);
        throw error;
    }
}