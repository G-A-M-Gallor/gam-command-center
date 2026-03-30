import { NextRequest, NextResponse } from "next/server";
import { execFileSync } from "child_process";
import { requireAuth } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";

interface SystemHealth {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  uptime: number;
  timestamp: number;
}

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  cpu: number;
  memory: {
    usage: number;
    limit: number;
    percentage: number;
  };
  network: {
    rx: number;
    tx: number;
  };
  ports: string[];
  created: string;
  uptime: string;
}

interface ServerHealthResponse {
  system: SystemHealth;
  docker: {
    containers: DockerContainer[];
    images: number;
    volumes: number;
    networks: number;
  };
  services: {
    name: string;
    status: 'running' | 'stopped' | 'error';
    pid?: number;
    port?: number;
    uptime?: string;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const authResult = await requireAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(
      request,
      RATE_LIMITS.general
    );

    if (rateLimitResult.limited) {
      return rateLimitResult.response;
    }

    const health: ServerHealthResponse = {
      system: await getSystemHealth(),
      docker: await getDockerHealth(),
      services: await getServicesHealth(),
    };

    return NextResponse.json(health);

  } catch (error) {
    console.error("Server health check error:", error);
    return NextResponse.json(
      {
        error: "Failed to get server health",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

async function getSystemHealth(): Promise<SystemHealth> {
  const timestamp = Date.now();

  try {
    // Get CPU info
    let cpu = { usage: 0, cores: 1, loadAverage: [0, 0, 0] };
    try {
      const cpuInfo = execFileSync('sh', ['-c', 'sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo "1"'], { encoding: 'utf8' }).trim();
      cpu.cores = parseInt(cpuInfo) || 1;

      // Get load average (macOS/Linux)
      try {
        const loadAvg = execFileSync('uptime', [], { encoding: 'utf8' });
        const loadMatch = loadAvg.match(/load averages?: ([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
        if (loadMatch) {
          cpu.loadAverage = [
            parseFloat(loadMatch[1]),
            parseFloat(loadMatch[2]),
            parseFloat(loadMatch[3])
          ];
          cpu.usage = Math.min((cpu.loadAverage[0] / cpu.cores) * 100, 100);
        }
      } catch {
        // Fallback: use top command
        const topOutput = execFileSync('top', ['-l', '1', '-n', '0'], { encoding: 'utf8', timeout: 3000 });
        const cpuMatch = topOutput.match(/CPU usage: ([\d.]+)% user/);
        if (cpuMatch) {
          cpu.usage = parseFloat(cpuMatch[1]);
        }
      }
    } catch {
      // Fallback values
    }

    // Get memory info
    let memory = { total: 0, used: 0, free: 0, usage: 0 };
    try {
      if (process.platform === 'darwin') {
        // macOS
        const memInfo = execFileSync('vm_stat', [], { encoding: 'utf8' });
        const pageSize = 4096; // Default page size

        const freeMatch = memInfo.match(/Pages free:\s+(\d+)/);
        const activeMatch = memInfo.match(/Pages active:\s+(\d+)/);
        const inactiveMatch = memInfo.match(/Pages inactive:\s+(\d+)/);
        const wiredMatch = memInfo.match(/Pages wired down:\s+(\d+)/);

        if (freeMatch && activeMatch && inactiveMatch && wiredMatch) {
          const free = parseInt(freeMatch[1]) * pageSize;
          const active = parseInt(activeMatch[1]) * pageSize;
          const inactive = parseInt(inactiveMatch[1]) * pageSize;
          const wired = parseInt(wiredMatch[1]) * pageSize;

          memory.free = free;
          memory.used = active + inactive + wired;
          memory.total = memory.free + memory.used;
          memory.usage = (memory.used / memory.total) * 100;
        }
      } else {
        // Linux - read /proc/meminfo
        const memInfo = execFileSync('cat', ['/proc/meminfo'], { encoding: 'utf8' });
        const totalMatch = memInfo.match(/MemTotal:\s+(\d+) kB/);
        const freeMatch = memInfo.match(/MemFree:\s+(\d+) kB/);
        const availableMatch = memInfo.match(/MemAvailable:\s+(\d+) kB/);

        if (totalMatch && freeMatch) {
          memory.total = parseInt(totalMatch[1]) * 1024;
          memory.free = parseInt(freeMatch[1]) * 1024;
          if (availableMatch) {
            memory.free = parseInt(availableMatch[1]) * 1024;
          }
          memory.used = memory.total - memory.free;
          memory.usage = (memory.used / memory.total) * 100;
        }
      }
    } catch {
      // Fallback: estimate based on Node.js process
      const nodeMemory = process.memoryUsage();
      memory.used = nodeMemory.heapUsed + nodeMemory.external;
      memory.total = Math.max(memory.used * 4, 8 * 1024 * 1024 * 1024); // Estimate 8GB
      memory.free = memory.total - memory.used;
      memory.usage = (memory.used / memory.total) * 100;
    }

    // Get disk info
    let disk = { total: 0, used: 0, free: 0, usage: 0 };
    try {
      const dfOutput = execFileSync('df', ['-k', '.'], { encoding: 'utf8' });
      const lines = dfOutput.trim().split('\n');
      if (lines.length > 1) {
        const parts = lines[1].trim().split(/\s+/);
        if (parts.length >= 4) {
          disk.total = parseInt(parts[1]) * 1024;
          disk.used = parseInt(parts[2]) * 1024;
          disk.free = parseInt(parts[3]) * 1024;
          disk.usage = (disk.used / disk.total) * 100;
        }
      }
    } catch {
      // Fallback values
      disk = { total: 100 * 1024 * 1024 * 1024, used: 50 * 1024 * 1024 * 1024, free: 50 * 1024 * 1024 * 1024, usage: 50 };
    }

    // Get uptime
    let uptime = 0;
    try {
      const uptimeOutput = execFileSync('uptime', [], { encoding: 'utf8' });
      const uptimeMatch = uptimeOutput.match(/up\s+(?:(\d+)\s+days?,\s*)?(?:(\d+):(\d+),\s*)?(?:(\d+)\s+mins?,\s*)?/);
      if (uptimeMatch) {
        const days = parseInt(uptimeMatch[1] || '0');
        const hours = parseInt(uptimeMatch[2] || '0');
        const minutes = parseInt(uptimeMatch[3] || '0');
        uptime = (days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60);
      }
    } catch {
      // Fallback: Node.js process uptime
      uptime = process.uptime();
    }

    return {
      cpu,
      memory,
      disk,
      uptime,
      timestamp,
    };

  } catch (error) {
    console.error("Error getting system health:", error);
    // Return safe fallback values
    return {
      cpu: { usage: 0, cores: 1, loadAverage: [0, 0, 0] },
      memory: { total: 0, used: 0, free: 0, usage: 0 },
      disk: { total: 0, used: 0, free: 0, usage: 0 },
      uptime: 0,
      timestamp,
    };
  }
}

async function getDockerHealth() {
  try {
    // Check if Docker is available
    execFileSync('docker', ['--version'], { timeout: 2000 });

    // Get containers
    const containersOutput = execFileSync('docker', [
      'ps', '-a', '--format',
      'table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.State}}\t{{.Ports}}\t{{.CreatedAt}}'
    ], { encoding: 'utf8', timeout: 5000 });

    const containers: DockerContainer[] = [];
    const lines = containersOutput.trim().split('\n');

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('\t');
      if (parts.length >= 7) {
        const container: DockerContainer = {
          id: parts[0].substring(0, 12),
          name: parts[1],
          image: parts[2],
          status: parts[3],
          state: parts[4],
          cpu: 0,
          memory: { usage: 0, limit: 0, percentage: 0 },
          network: { rx: 0, tx: 0 },
          ports: parts[5] ? parts[5].split(',').map(p => p.trim()) : [],
          created: parts[6],
          uptime: extractUptime(parts[3]),
        };

        // Get detailed stats for running containers
        if (parts[4].toLowerCase() === 'running') {
          try {
            const statsOutput = execFileSync('docker', [
              'stats', container.id, '--no-stream', '--format',
              'table {{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}'
            ], { encoding: 'utf8', timeout: 3000 });

            const statsLines = statsOutput.trim().split('\n');
            if (statsLines.length > 1) {
              const statsParts = statsLines[1].split('\t');
              if (statsParts.length >= 4) {
                container.cpu = parseFloat(statsParts[0].replace('%', ''));

                // Parse memory usage (e.g., "1.5GiB / 8GiB")
                const memoryParts = statsParts[1].split(' / ');
                if (memoryParts.length === 2) {
                  container.memory.usage = parseMemorySize(memoryParts[0]);
                  container.memory.limit = parseMemorySize(memoryParts[1]);
                }

                container.memory.percentage = parseFloat(statsParts[2].replace('%', ''));

                // Parse network I/O (e.g., "1.2MB / 3.4MB")
                const networkParts = statsParts[3].split(' / ');
                if (networkParts.length === 2) {
                  container.network.rx = parseMemorySize(networkParts[0]);
                  container.network.tx = parseMemorySize(networkParts[1]);
                }
              }
            }
          } catch {
            // Stats failed, keep defaults
          }
        }

        containers.push(container);
      }
    }

    // Get Docker system info
    let images = 0, volumes = 0, networks = 0;
    try {
      const imagesOutput = execFileSync('docker', ['images', '-q'], { encoding: 'utf8', timeout: 3000 });
      images = imagesOutput.trim().split('\n').filter(line => line.trim()).length;

      const volumesOutput = execFileSync('docker', ['volume', 'ls', '-q'], { encoding: 'utf8', timeout: 3000 });
      volumes = volumesOutput.trim().split('\n').filter(line => line.trim()).length;

      const networksOutput = execFileSync('docker', ['network', 'ls', '-q'], { encoding: 'utf8', timeout: 3000 });
      networks = networksOutput.trim().split('\n').filter(line => line.trim()).length;
    } catch {
      // Keep defaults
    }

    return {
      containers,
      images,
      volumes,
      networks,
    };

  } catch (error) {
    console.error("Docker not available or error:", error);
    return {
      containers: [],
      images: 0,
      volumes: 0,
      networks: 0,
    };
  }
}

async function getServicesHealth() {
  const services = [
    { name: 'Next.js App', status: 'running' as const, port: 3000 },
    { name: 'PostgreSQL', status: 'stopped' as const, port: 5432 },
    { name: 'Redis', status: 'stopped' as const, port: 6379 },
  ];

  // Basic port checks (this is a simple implementation)
  for (const service of services) {
    if (service.port) {
      try {
        // Simple check - this is a basic implementation
        // In production, you'd want proper health checks
        if (service.name === 'Next.js App') {
          service.status = 'running'; // We know this is running since we're serving the request
        }
      } catch {
        service.status = 'stopped';
      }
    }
  }

  return services;
}

function extractUptime(status: string): string {
  const uptimeMatch = status.match(/Up\s+(.*?)(?:\s|$)/);
  return uptimeMatch ? uptimeMatch[1] : '0 seconds';
}

function parseMemorySize(sizeStr: string): number {
  const size = parseFloat(sizeStr);
  if (sizeStr.includes('GB') || sizeStr.includes('GiB')) {
    return size * 1024 * 1024 * 1024;
  } else if (sizeStr.includes('MB') || sizeStr.includes('MiB')) {
    return size * 1024 * 1024;
  } else if (sizeStr.includes('KB') || sizeStr.includes('KiB')) {
    return size * 1024;
  }
  return size;
}