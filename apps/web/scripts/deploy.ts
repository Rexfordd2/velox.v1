import { exec } from 'child_process'
import { promisify } from 'util'
import { configureAutoScaling } from './scale'

const execAsync = promisify(exec)

interface DeploymentConfig {
  namespace: string
  replicas: number
  containerPort: number
  resources: {
    requests: {
      cpu: string
      memory: string
    }
    limits: {
      cpu: string
      memory: string
    }
  }
}

const defaultConfig: DeploymentConfig = {
  namespace: 'production',
  replicas: 2,
  containerPort: 3000,
  resources: {
    requests: {
      cpu: '100m',
      memory: '128Mi',
    },
    limits: {
      cpu: '2',
      memory: '4Gi',
    },
  },
}

async function deployApplication(config: DeploymentConfig = defaultConfig) {
  try {
    // Create namespace if it doesn't exist
    await execAsync(`kubectl create namespace ${config.namespace} --dry-run=client -o yaml | kubectl apply -f -`)
    console.log(`✅ Namespace ${config.namespace} configured`)

    // Deploy the application
    const deploymentCommand = `kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: ${config.namespace}
spec:
  replicas: ${config.replicas}
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web-app
        image: web-app:latest
        ports:
        - containerPort: ${config.containerPort}
        resources:
          requests:
            cpu: ${config.resources.requests.cpu}
            memory: ${config.resources.requests.memory}
          limits:
            cpu: ${config.resources.limits.cpu}
            memory: ${config.resources.limits.memory}
        readinessProbe:
          httpGet:
            path: /api/health
            port: ${config.containerPort}
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /api/health
            port: ${config.containerPort}
          initialDelaySeconds: 15
          periodSeconds: 20
EOF`

    await execAsync(deploymentCommand)
    console.log('✅ Deployment configured')

    // Configure service
    const serviceCommand = `kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
  namespace: ${config.namespace}
spec:
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: ${config.containerPort}
  type: LoadBalancer
EOF`

    await execAsync(serviceCommand)
    console.log('✅ Service configured')

    // Configure auto-scaling
    await configureAutoScaling()
    console.log('✅ Auto-scaling configured')

    // Configure ingress
    const ingressCommand = `kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-app-ingress
  namespace: ${config.namespace}
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
spec:
  rules:
  - host: app.example.com  # Replace with your domain
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app-service
            port:
              number: 80
EOF`

    await execAsync(ingressCommand)
    console.log('✅ Ingress configured')

    console.log('🚀 Deployment completed successfully!')

  } catch (error) {
    console.error('❌ Error during deployment:', error)
    process.exit(1)
  }
}

// Export for use in other scripts
export { deployApplication }
export type { DeploymentConfig }

// Run if called directly
if (require.main === module) {
  deployApplication().catch(console.error)
} 