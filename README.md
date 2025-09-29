# Prometheus Metrics Generator
This project provides a lightweight, configuration-driven server built with Deno to generate and expose synthetic Prometheus metrics. It is ideal for testing Prometheus setups, Grafana dashboards, and alerting rules without relying on real production data.

## Features ✨ 

- **Configuration Driven:** Metrics, port, and update interval are defined entirely in config.json.
- **Deno Native:** Uses the modern Deno runtime for security, performance, and simplicity.
- **Standalone Executable:** Can be compiled into a single, dependency-free Windows executable.
- **Gauge Support:** Generates random values within configured min/max ranges.
---

## 1. Quick Start 🚀

You must have the **Deno Runtime** installed on your system.

### Running in Development Mode

The `deno.json` file includes a `start` task with file-watching, networking, and read permissions enabled.

#### 1. Start the Server:
Located in the project directory where all the files are present using `CMD / Powershell / Bash`

```bash
deno task start
```
#### 2. Server Output:  The application will confirm the port and metric count, then begin listening.
```bash
Loaded 3 metrics from config.json
Server will run on port: 9091
HTTP server running on http://localhost:9091
```
#### 3. Verify Metrics: Access the /metrics endpoint to see the data (values update every configured interval):
```bash
curl http://localhost:9091/metrics
```

## 2. Configuration ⚙️ (`config.json`)

All operational and metric parameters are controlled by the config.json file.

### Configuration Structure

The file contains a top-level `settings` object and a `metrics` array.
```json
{
  "settings": {
    "port": 9091,
    "update_interval_ms": 5000
  },
  "metrics": [
    {
      "name": "app_requests_total",
      "help": "Total number of processed requests.",
      "type": "gauge",
      "range": {
        "min": 100,
        "max": 500
      }
    }
  ]
}
```
| Section | Key | Type | Description |
| ----------- | ----------- | ----------- | ----------- |
| `settings` | `port` | `number` | The TCP port the HTTP server binds to. |
|  | `update_interval_ms` | `number` | The frequency (in milliseconds) at which metric values are randomized and updated. |
| `metrics` | `name` | `string` | The Prometheus metric name. |
|  | `type` | `string` | The metric type. **Only** `gauge` **is currently implemented.** |
|  | `range.min` | `number` | The minimum allowable random value. |
|  | `range.max` | `number` | The maximum allowable random value. |

## 3. Development and Dependencies 🛠️

### Entry Point (`main.ts`)

The application's logic is contained entirely within `main.ts`. Key concepts used:

1. **Configuration Reading:** The script reads the structured `config.json` file at startup.
2. `ts_prometheus`: It uses the older, stable `ts_prometheus@v0.3.0` module.
3. **Instance-Based Registration:** Due to the older module's API, metrics are created and registered directly with a custom `Registry` instance using the factory pattern:

```typescript
const gauge = Gauge.with({ /* ... */ registry: [registry] });
```

### Dependencies (`deno.json`)

The project uses an **Import Map** to manage the external Prometheus client dependency:

```json
{
  "imports": {
    "prometheus_client/": "https://deno.land/x/ts_prometheus@v0.3.0/"
  },
  "tasks": {
    "start": "deno run --allow-net --allow-read --watch main.ts"
  }
}
```
### Extending Metrics

To add support for `Counter` or `Histogram` types:

1. Add the new type to the `MetricConfig` interface in `main.ts`.
2. Import the corresponding class (`Counter` or `Histogram`) from `prometheus_client/mod.ts`.
3. Add logic to the configuration loop (`for (const conf of config.metrics)`) to check the `conf.type` and instantiate the correct metric class (`Counter.with(...)` or `Histogram.with(...)`).

## 4. Building a Windows Executable 📦

You can compile the project into a single, self-contained Windows executable (`.exe`). This binary bundles the Deno runtime and all code, making it highly portable.

### Compilation Command

Run the following command from your project root. The `--target` flag is essential for building a Windows binary:

```dos
deno compile --allow-net --allow-read --output metrics_generator.exe --target x86_64-pc-windows-msvc main.ts
```

### Deployment

To run the application on a target Windows machine:

1. Ensure the compiled `metrics_generator.exe` and the `config.json` file are in the same folder.
2. Execute the binary. The server will launch using the configured port.

```dos
.\metrics_generator.exe
```

Or double-click the `metrics_generator.exe`
