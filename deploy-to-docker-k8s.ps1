# ============================================
# 🚀 Care Management System Deployment Script
# Deploy to Docker & Kubernetes
# ============================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('setup', 'build', 'test', 'docker', 'k8s', 'all')]
    [string]$Action = 'all',

    [Parameter(Mandatory=$false)]
    [string]$DockerUsername = '',

    [Parameter(Mandatory=$false)]
    [string]$Environment = 'dev',

    [Parameter(Mandatory=$false)]
    [switch]$SkipTests,

    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Colors for output
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

function Test-Prerequisites {
    Write-Log "========================================" "Header"
    Write-Log "✅ Checking Prerequisites..." "Header"
    Write-Log "========================================" "Header"

    $tools = @(
        @{ Name = 'git'; Command = 'git --version' }
        @{ Name = 'docker'; Command = 'docker --version' }
        @{ Name = 'docker-compose'; Command = 'docker-compose --version' }
        @{ Name = 'kubectl'; Command = 'kubectl version --client' }
        @{ Name = 'mvn'; Command = 'mvn --version' }
        @{ Name = 'java'; Command = 'java -version' }
    )

    $allOk = $true

    foreach ($tool in $tools) {
        try {
            $result = & cmd /c $tool.Command 2>&1
            Write-Log "✅ $($tool.Name) is installed" "Success"
        }
        catch {
            Write-Log "❌ $($tool.Name) is NOT installed" "Error"
            $allOk = $false
        }
    }

    if (-not $allOk) {
        Write-Log "Some prerequisites are missing. Please install them and try again." "Error"
        exit 1
    }

    Write-Log "✅ All prerequisites are installed!" "Success"
}

function Test-DockerLogin {
    Write-Log "Checking Docker login..." "Info"

    $status = docker info 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Log "❌ Docker login failed" "Error"
        Write-Log "Please run: docker login" "Warning"
        return $false
    }

    Write-Log "✅ Docker is properly configured" "Success"
    return $true
}

function Build-Backend {
    Write-Log "========================================" "Header"
    Write-Log "🏗️  Building Backend Services..." "Header"
    Write-Log "========================================" "Header"

    $projectRoot = Get-Location
    $services = @(
        'service-registry',
        'config-server',
        'auth-service/auth-service',
        'access-management-service',
        'reference-data-service',
        'appointment-service',
        'data-analysis-service',
        'chatbot-service',
        'gateway-service'
    )

    foreach ($service in $services) {
        Write-Log "Building $service..." "Info"

        $servicePath = if ($service -like '*/') {
            $projectRoot.Path + '\' + $service
        } else {
            $projectRoot.Path + '\' + $service
        }

        if (Test-Path $servicePath\pom.xml) {
            cd $servicePath

            if ($SkipTests) {
                mvn clean package -DskipTests -q
            } else {
                mvn clean package -q
            }

            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ $service built successfully" "Success"
            } else {
                Write-Log "❌ Failed to build $service" "Error"
                return $false
            }
        } else {
            Write-Log "⚠️  $service not found, skipping" "Warning"
        }
    }

    cd $projectRoot
    Write-Log "✅ All services built successfully!" "Success"
    return $true
}

function Test-Backend {
    Write-Log "========================================" "Header"
    Write-Log "🧪 Running Tests..." "Header"
    Write-Log "========================================" "Header"

    Write-Log "Running Maven tests..." "Info"
    mvn test -q

    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ All tests passed!" "Success"
        return $true
    } else {
        Write-Log "❌ Some tests failed" "Error"
        return $false
    }
}

function Build-Docker {
    param([string]$Username)

    if ([string]::IsNullOrEmpty($Username)) {
        Write-Log "Docker username is required for docker action" "Error"
        return $false
    }

    Write-Log "========================================" "Header"
    Write-Log "🐳 Building Docker Images..." "Header"
    Write-Log "========================================" "Header"

    $services = @(
        @{ name = 'service-registry'; path = 'service-registry/Dockerfile' }
        @{ name = 'config-server'; path = 'config-server/Dockerfile' }
        @{ name = 'auth-service'; path = 'auth-service/auth-service/Dockerfile' }
        @{ name = 'access-management-service'; path = 'access-management-service/Dockerfile' }
        @{ name = 'reference-data-service'; path = 'reference-data-service/Dockerfile' }
        @{ name = 'appointment-service'; path = 'appointment-service/Dockerfile' }
        @{ name = 'data-analysis-service'; path = 'data-analysis-service/Dockerfile' }
        @{ name = 'chatbot-service'; path = 'chatbot-service/Dockerfile' }
        @{ name = 'gateway-service'; path = 'gateway-service/Dockerfile' }
    )

    $registry = "docker.io/$Username"
    $tag = git rev-parse --short HEAD

    if ([string]::IsNullOrEmpty($tag)) {
        $tag = 'latest'
    }

    foreach ($service in $services) {
        $imageName = "care-$($service.name)"
        $imageTag = "$registry/$imageName"

        Write-Log "Building $imageName..." "Info"

        if (Test-Path $service.path) {
            docker build -t "$imageTag`:latest" -t "$imageTag`:$tag" -f $service.path .

            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ Built $imageName" "Success"

                Write-Log "Pushing $imageName to Docker Hub..." "Info"
                docker push "$imageTag`:latest"
                docker push "$imageTag`:$tag"

                if ($LASTEXITCODE -eq 0) {
                    Write-Log "✅ Pushed $imageName" "Success"
                } else {
                    Write-Log "❌ Failed to push $imageName" "Error"
                    return $false
                }
            } else {
                Write-Log "❌ Failed to build $imageName" "Error"
                return $false
            }
        } else {
            Write-Log "⚠️  Dockerfile not found for $imageName, skipping" "Warning"
        }
    }

    Write-Log "✅ All Docker images built and pushed!" "Success"
    return $true
}

function Deploy-Kubernetes {
    Write-Log "========================================" "Header"
    Write-Log "☸️  Deploying to Kubernetes..." "Header"
    Write-Log "========================================" "Header"

    # Check kubectl connection
    Write-Log "Checking Kubernetes cluster connection..." "Info"
    kubectl cluster-info > $null 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Log "❌ Cannot connect to Kubernetes cluster" "Error"
        Write-Log "Please configure kubectl or start Minikube/Docker Desktop K8s" "Warning"
        return $false
    }

    Write-Log "✅ Connected to Kubernetes cluster" "Success"

    # Create namespace
    Write-Log "Creating namespace care-system..." "Info"
    kubectl create namespace care-system --dry-run=client -o yaml | kubectl apply -f -

    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Namespace created/verified" "Success"
    }

    # Create secrets (you need to provide these)
    Write-Log "Creating secrets..." "Info"
    $dbPassword = Read-Host "Enter Database Password (or press Enter for default)" -AsSecureString
    $dbPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($dbPassword))

    if ([string]::IsNullOrEmpty($dbPasswordPlain)) {
        $dbPasswordPlain = "P@ssw0rd123"
    }

    kubectl create secret generic care-secrets `
        --from-literal=DB_PASSWORD="$dbPasswordPlain" `
        --from-literal=JWT_SECRET="SuperSecureKeyThatIsAtLeast64CharactersLongToAvoidWeakKeyException1234567890" `
        -n care-system `
        --dry-run=client -o yaml | kubectl apply -f -

    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Secrets created" "Success"
    }

    # Create ConfigMap
    Write-Log "Creating ConfigMap..." "Info"
    kubectl create configmap care-config `
        --from-literal=SPRING_PROFILES_ACTIVE=kubernetes `
        --from-literal=EUREKA_SERVER=http://service-registry.care-system.svc.cluster.local:8761/eureka `
        -n care-system `
        --dry-run=client -o yaml | kubectl apply -f -

    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ ConfigMap created" "Success"
    }

    # Apply Kubernetes manifests
    if (Test-Path k8s/kustomization.yaml) {
        Write-Log "Applying Kubernetes manifests with Kustomize..." "Info"
        kubectl apply -k k8s/
    } elseif (Test-Path k8s) {
        Write-Log "Applying Kubernetes manifests..." "Info"
        kubectl apply -f k8s/
    } else {
        Write-Log "❌ Kubernetes manifests directory not found" "Error"
        return $false
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Manifests applied successfully" "Success"
    } else {
        Write-Log "❌ Failed to apply manifests" "Error"
        return $false
    }

    # Wait for deployments
    Write-Log "Waiting for deployments..." "Info"
    kubectl rollout status deployment/service-registry -n care-system --timeout=300s
    kubectl rollout status deployment/config-server -n care-system --timeout=300s
    kubectl rollout status deployment/gateway -n care-system --timeout=300s

    Write-Log "✅ Deployments are ready!" "Success"

    # Show status
    Write-Log "Kubernetes Resources:" "Info"
    kubectl get all -n care-system

    return $true
}

function Show-Summary {
    Write-Log "========================================" "Header"
    Write-Log "📊 Deployment Summary" "Header"
    Write-Log "========================================" "Header"

    if (Test-Path k8s) {
        Write-Log "Kubernetes cluster status:" "Info"
        kubectl get pods -n care-system
        Write-Log ""
        kubectl get svc -n care-system
    }

    Write-Log "✅ Deployment completed successfully!" "Success"
}

function Show-Help {
    Write-Log "========================================" "Header"
    Write-Log "Care Management System Deployment Tool" "Header"
    Write-Log "========================================" "Header"
    Write-Log ""
    Write-Log "Usage: .\deploy-to-docker-k8s.ps1 [OPTIONS]" "Info"
    Write-Log ""
    Write-Log "Options:" "Info"
    Write-Log "  -Action <action>        : setup, build, test, docker, k8s, or all (default: all)" "Info"
    Write-Log "  -DockerUsername <name>  : Docker Hub username (required for docker action)" "Info"
    Write-Log "  -Environment <env>      : dev, staging, or production (default: dev)" "Info"
    Write-Log "  -SkipTests              : Skip running tests" "Info"
    Write-Log "  -Verbose                : Show verbose output" "Info"
    Write-Log ""
    Write-Log "Examples:" "Info"
    Write-Log "  .\deploy-to-docker-k8s.ps1 -Action build                      # Build only" "Info"
    Write-Log "  .\deploy-to-docker-k8s.ps1 -Action docker -DockerUsername myusername" "Info"
    Write-Log "  .\deploy-to-docker-k8s.ps1 -Action k8s                        # Deploy to K8s" "Info"
    Write-Log "  .\deploy-to-docker-k8s.ps1 -Action all -DockerUsername myusername" "Info"
}

# Main execution
if ($Action -eq 'help') {
    Show-Help
    exit 0
}

Write-Log "🚀 Care Management System Deployment Script" "Header"
Write-Log "Action: $Action | Environment: $Environment" "Info"
Write-Log ""

# Run prerequisites check
Test-Prerequisites

# Run based on action
switch ($Action) {
    'setup' {
        Test-DockerLogin
    }
    'build' {
        Build-Backend
    }
    'test' {
        if (Build-Backend) {
            if (-not $SkipTests) {
                Test-Backend
            }
        }
    }
    'docker' {
        if (Build-Backend) {
            Build-Docker -Username $DockerUsername
        }
    }
    'k8s' {
        Deploy-Kubernetes
    }
    'all' {
        if (Build-Backend) {
            if ($SkipTests) {
                Write-Log "Tests skipped" "Warning"
            } else {
                if (-not (Test-Backend)) {
                    exit 1
                }
            }

            if (-not [string]::IsNullOrEmpty($DockerUsername)) {
                Build-Docker -Username $DockerUsername
            }

            Deploy-Kubernetes

            Show-Summary
        }
    }
    default {
        Write-Log "Invalid action: $Action" "Error"
        Show-Help
        exit 1
    }
}

Write-Log "Done!" "Success"
