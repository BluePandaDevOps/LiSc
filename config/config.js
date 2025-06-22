let config = null;

const CONFIG_PATH = 'config/config.json'
export const IN_BUILD_PARSER_MODE = { flag: false };



export async function loadConfig() {
    if (config) {
        return config;
    }

    try {
        const response = await fetch(CONFIG_PATH);
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