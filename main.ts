import {
  Registry,
  Gauge,
} from "prometheus_client/mod.ts";

// NOTE: If you need Counter, Summary, etc., you'll need to import them separately:
// import { Counter } from "prometheus_client/lib/counter.ts"; 
// import { Summary } from "prometheus_client/lib/summary.ts"; 


// Define the structure for a single metric configuration
interface MetricConfig {
  name: string;
  help: string;
  type: "gauge"; // Extend this if you want to support other types
  range: {
    min: number;
    max: number;
  };
}

interface AppSettings {
    port: number;
    update_interval_ms: number;
}

interface AppConfig {
    settings: AppSettings;
    metrics: MetricConfig[];
}

console.log("Application for Prometheus / Grafana Training\n")
console.log("Developed by: Luis Peralta - Mail: lperaltamolina@gmail.com")
console.log("Role: IT Pro\n")

// Load and Parse the new Config Structure ---
const CONFIG_FILE = "config.json";
let config: AppConfig;
try {
  const configData = await Deno.readTextFile(CONFIG_FILE);
  config = JSON.parse(configData);
  
  console.log(`Loaded ${config.metrics.length} metrics from ${CONFIG_FILE}`);
  console.log(`Server will run on port: ${config.settings.port}`);

} catch (error) {
  console.error(`Error loading or parsing configuration file ${CONFIG_FILE}:`, error);
  Deno.exit(1);
}

// Initialize Prometheus Registry and Metrics
const registry = new Registry();
const createdGauges = new Map<string, Gauge>();

// Create and Register metrics based on configuration (Iterate over config.metrics)
for (const conf of config.metrics) {
  if (conf.type === "gauge") {
    const gauge = Gauge.with({
      name: conf.name,
      help: conf.help,
      registry: [registry], 
    });
    createdGauges.set(conf.name, gauge);
  }
}

// Function to update metrics (uses config.metrics to get ranges)
function updateMetrics() {
  for (const conf of config.metrics) {
    const gauge = createdGauges.get(conf.name);
    if (gauge) {
      const { min, max } = conf.range;
      const value = Math.random() * (max - min) + min;
      gauge.set(value);
    }
  }
}

// Apply the update interval from settings
const UPDATE_INTERVAL = config.settings.update_interval_ms;
setInterval(updateMetrics, UPDATE_INTERVAL);
updateMetrics(); // Initial update

// HTTP Server setup to expose the /metrics endpoint
const PORT = config.settings.port;

const handler = async (req: Request) => {
  const url = new URL(req.url);

  if (url.pathname === "/metrics") {
    // Expose metrics directly from our custom registry instance
    const metrics = await registry.metrics();
    
    return new Response(metrics, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      },
    });
  }

  // Handle other paths
  return new Response("Deno Prometheus Metrics Server. Scrape /metrics", {
    status: 404,
  });
};

console.log(`HTTP server running on http://localhost:${PORT}\n`);
console.log("To access the metrics go to the following URL and add /metrics at the end of the URL\n")

// Deno.serve requires Deno 1.34+
Deno.serve({ port: PORT }, handler);
