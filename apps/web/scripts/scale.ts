import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface ScalingConfig {
  minReplicas: number
  maxReplicas: number
  targetCPUUtilization: number
  targetMemoryUtilization: number
  cooldownPeriod: number // seconds
}

const defaultConfig: ScalingConfig = {
  minReplicas: 2,
  maxReplicas: 10,
  targetCPUUtilization: 70,
  targetMemoryUtilization: 80,
  cooldownPeriod: 300,
}

async function configureAutoScaling(config: ScalingConfig = defaultConfig) {
  try {
    // Configure HPA (Horizontal Pod Autoscaler)
    const hpaCommand = `kubectl apply -f - <<EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: ${config.minReplicas}
  maxReplicas: ${config.maxReplicas}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: ${config.targetCPUUtilization}
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: ${config.targetMemoryUtilization}
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: ${config.cooldownPeriod}
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
EOF`

    await execAsync(hpaCommand)
    console.log('✅ HPA configured successfully')

    // Configure VPA (Vertical Pod Autoscaler) for resource optimization
    const vpaCommand = `kubectl apply -f - <<EOF
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: '*'
      minAllowed:
        memory: "128Mi"
        cpu: "100m"
      maxAllowed:
        memory: "4Gi"
        cpu: "2"
EOF`

    await execAsync(vpaCommand)
    console.log('✅ VPA configured successfully')

  } catch (error) {
    console.error('❌ Error configuring auto-scaling:', error)
    process.exit(1)
  }
}

// Export for use in deployment scripts
export { configureAutoScaling }
export type { ScalingConfig }

// Run if called directly
if (require.main === module) {
  configureAutoScaling().catch(console.error)
} 