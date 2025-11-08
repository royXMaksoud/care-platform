# ============================================
# 🚀 Production Deployment Script
# نشر متكامل على سيرفر إنتاجي
# ============================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('build', 'compose', 'deploy', 'stop', 'logs', 'restart', 'all')]
    [string]$Action = 'all',

    [Parameter(Mandatory=$false)]
    [string]$Server = 'localhost',

    [Parameter(Mandatory=$false)]
    [string]$DBPassword = 'P@ssw0rd123',

    [Parameter(Mandatory=$false)]
    [string]$JWTSecret = 'SuperSecureKeyThatIsAtLeast64CharactersLong123456789'
)

# Colors
$colors = @{
    Success = 'Green'
    Error = 'Red'
    Warning = 'Yellow'
    Info = 'Cyan'
    Header = 'Magenta'
}

function Write-Log {
    param([string]$Message, [string]$Type = 'Info')
    $timestamp = Get-Date -Format 'HH:mm:ss'
    $color = $colors[$Type]
    Write-Host "[$timestamp] " -NoNewline
    Write-Host $Message -ForegroundColor $color
}

function Build-JavaServices {
    Write-Log "========================================" "Header"
    Write-Log "🏗️  Building Java Services..." "Header"
    Write-Log "========================================" "Header"

    $projectRoot = Get-Location

    Write-Log "Building all services with Maven..." "Info"
    mvn clean package -DskipTests -q

    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ All Java services built successfully" "Success"
        return $true
    } else {
        Write-Log "❌ Maven build failed" "Error"
        return $false
    }
}

function Build-ReactApp {
    Write-Log "========================================" "Header"
    Write-Log "🎨 Building React Web Portal..." "Header"
    Write-Log "========================================" "Header"

    cd web-portal

    Write-Log "Installing dependencies..." "Info"
    npm ci

    Write-Log "Building for production..." "Info"
    npm run build

    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ React app built successfully" "Success"
        cd ..
        return $true
    } else {
        Write-Log "❌ React build failed" "Error"
        cd ..
        return $false
    }
}

function Build-DockerImages {
    Write-Log "========================================" "Header"
    Write-Log "🐳 Building Docker Images..." "Header"
    Write-Log "========================================" "Header"

    Write-Log "Building Docker images from docker-compose..." "Info"
    docker-compose build

    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Docker images built successfully" "Success"
        return $true
    } else {
        Write-Log "❌ Docker build failed" "Error"
        return $false
    }
}

function Create-DotEnvFile {
    Write-Log "========================================" "Header"
    Write-Log "🔐 Creating .env file..." "Header"
    Write-Log "========================================" "Header"

    $envContent = @"
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cms_db
DB_USERNAME=postgres
DB_PASSWORD=$DBPassword

# Security
JWT_SECRET=$JWTSecret

# Environment
SPRING_PROFILES_ACTIVE=prod
ENVIRONMENT=production

# Eureka & Config
EUREKA_SERVER=http://service-registry:8761/eureka
CONFIG_SERVER=http://config-server:8888
"@

    Set-Content -Path ".env" -Value $envContent
    Write-Log "✅ .env file created successfully" "Success"
}

function Deploy-Services {
    Write-Log "========================================" "Header"
    Write-Log "📦 Deploying Services with Docker Compose..." "Header"
    Write-Log "========================================" "Header"

    Write-Log "Starting services..." "Info"
    docker-compose -f docker-compose.prod.yml up -d

    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Services started successfully" "Success"

        Write-Log "Waiting for services to be healthy..." "Info"
        Start-Sleep -Seconds 30

        # Check health
        $health = docker-compose ps
        Write-Log $health "Info"

        return $true
    } else {
        Write-Log "❌ Failed to start services" "Error"
        return $false
    }
}

function Stop-Services {
    Write-Log "========================================" "Header"
    Write-Log "⏹️  Stopping Services..." "Header"
    Write-Log "========================================" "Header"

    docker-compose -f docker-compose.prod.yml down

    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Services stopped successfully" "Success"
        return $true
    } else {
        Write-Log "❌ Failed to stop services" "Error"
        return $false
    }
}

function Show-Logs {
    Write-Log "========================================" "Header"
    Write-Log "📊 Service Logs..." "Header"
    Write-Log "========================================" "Header"

    docker-compose -f docker-compose.prod.yml logs -f --tail=100
}

function Restart-Services {
    Write-Log "========================================" "Header"
    Write-Log "🔄 Restarting Services..." "Header"
    Write-Log "========================================" "Header"

    docker-compose -f docker-compose.prod.yml restart

    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Services restarted successfully" "Success"
        return $true
    } else {
        Write-Log "❌ Failed to restart services" "Error"
        return $false
    }
}

function Verify-Deployment {
    Write-Log "========================================" "Header"
    Write-Log "✅ Verifying Deployment..." "Header"
    Write-Log "========================================" "Header"

    $endpoints = @(
        @{ Name = "Eureka"; Url = "http://localhost:8761/"; Port = 8761 }
        @{ Name = "Config Server"; Url = "http://localhost:8888/"; Port = 8888 }
        @{ Name = "Gateway"; Url = "http://localhost:6060/actuator/health"; Port = 6060 }
        @{ Name = "Auth Service"; Url = "http://localhost:6061/actuator/health"; Port = 6061 }
        @{ Name = "React App"; Url = "http://localhost:3000/"; Port = 3000 }
    )

    Write-Log ""
    Write-Log "Service Status:" "Info"
    Write-Log "===============" "Info"

    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint.Url -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 302) {
                Write-Log "✅ $($endpoint.Name) - UP (Port $($endpoint.Port))" "Success"
            } else {
                Write-Log "⚠️  $($endpoint.Name) - Unexpected Status" "Warning"
            }
        } catch {
            Write-Log "❌ $($endpoint.Name) - DOWN" "Error"
        }
    }

    Write-Log ""
    Write-Log "Running Containers:" "Info"
    Write-Log "==================" "Info"
    docker-compose ps

    Write-Log ""
    Write-Log "Resource Usage:" "Info"
    Write-Log "===============" "Info"
    docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.CPUPerc}}"
}

# Main execution
Write-Log "🚀 Production Deployment Script" "Header"
Write-Log "Action: $Action | Server: $Server" "Info"
Write-Log ""

switch ($Action) {
    'build' {
        if (Build-JavaServices) {
            Build-ReactApp
            Build-DockerImages
        }
    }
    'compose' {
        Create-DotEnvFile
    }
    'deploy' {
        Deploy-Services
        Verify-Deployment
    }
    'stop' {
        Stop-Services
    }
    'logs' {
        Show-Logs
    }
    'restart' {
        Restart-Services
        Verify-Deployment
    }
    'all' {
        if (Build-JavaServices) {
            if (Build-ReactApp) {
                if (Build-DockerImages) {
                    Create-DotEnvFile
                    Deploy-Services
                    Verify-Deployment
                }
            }
        }
    }
    default {
        Write-Log "Invalid action: $Action" "Error"
        exit 1
    }
}

Write-Log "Done! ✅" "Success"
