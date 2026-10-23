
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

async function request(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;

    try {
      const errorData = await response.json();
      message = errorData.error || message;
    } catch {
      // Keep the default error message if the response isn't JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

// Backend health and safety
export const getHealth = () => request("/api/health");
export const getSafety = () => request("/api/safety");

// Existing demo endpoints
export const getMetrics = () => request("/api/metrics");
export const getAlerts = () => request("/api/alerts");
export const getLogs = () => request("/api/logs");

// Real AWS Cost Explorer data
export const getAwsCosts = () => request("/api/aws/costs");
