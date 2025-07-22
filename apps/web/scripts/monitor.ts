import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface ResourceMetrics {
  cpu: string
  memory: string
  pods: number
}

async function getResourceUsage(namespace: string = 'production'): Promise<ResourceMetrics> {
  try {
    // Get CPU and memory usage
    const { stdout: metricsOutput } = await execAsync(
      `kubectl top pods -n ${namespace} --containers`
    )
    
    const metrics = metricsOutput.split('\n').slice(1) // Skip header
    let totalCPU = 0
    let totalMemory = 0
    
    metrics.forEach(line => {
      const [, , cpu, memory] = line.split(/\s+/)
      totalCPU += parseInt(cpu)
      totalMemory += parseInt(memory)
    })
    
    // Get pod count
    const { stdout: podsOutput } = await execAsync(
      `kubectl get pods -n ${namespace} -l app=web-app --no-headers | wc -l`
    )
    
    return {
      cpu: `${totalCPU}m`,
      memory: `${totalMemory}Mi`,
      pods: parseInt(podsOutput),
    }
  } catch (error) {
    console.error('Error getting resource usage:', error)
    throw error
  }
}

async function checkDeploymentHealth(namespace: string = 'production') {
  try {
    // Check deployment status
    const { stdout: deploymentStatus } = await execAsync(
      `kubectl get deployment web-app -n ${namespace} -o json`
    )
    const deployment = JSON.parse(deploymentStatus)
    
    // Check HPA status
    const { stdout: hpaStatus } = await execAsync(
      `kubectl get hpa web-app-hpa -n ${namespace} -o json`
    )
    const hpa = JSON.parse(hpaStatus)
    
    // Get current resource usage
    const resources = await getResourceUsage(namespace)
    
    console.log('\n📊 Deployment Status:')
    console.log('-------------------')
    console.log(`Desired Replicas: ${deployment.spec.replicas}`)
    console.log(`Available Replicas: ${deployment.status.availableReplicas}`)
    console.log(`Updated Replicas: ${deployment.status.updatedReplicas}`)
    
    console.log('\n🔄 Auto-scaling Status:')
    console.log('-------------------')
    console.log(`Current Replicas: ${hpa.status.currentReplicas}`)
    console.log(`Target Replicas: ${hpa.status.desiredReplicas}`)
    console.log(`Current CPU Utilization: ${hpa.status.currentCPUUtilizationPercentage}%`)
    
    console.log('\n💻 Resource Usage:')
    console.log('-------------------')
    console.log(`Total CPU: ${resources.cpu}`)
    console.log(`Total Memory: ${resources.memory}`)
    console.log(`Active Pods: ${resources.pods}`)
    
  } catch (error) {
    console.error('Error checking deployment health:', error)
    throw error
  }
}

async function monitorDeployment(namespace: string = 'production', intervalSeconds: number = 30) {
  console.log(`🔍 Starting deployment monitoring (${namespace})...`)
  
  while (true) {
    try {
      await checkDeploymentHealth(namespace)
      console.log('\n⏳ Waiting for next check...')
      await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000))
    } catch (error) {
      console.error('❌ Monitoring failed:', error)
      process.exit(1)
    }
  }
}

// Export for use in other scripts
export { monitorDeployment, checkDeploymentHealth, getResourceUsage }

// Run if called directly
if (require.main === module) {
  monitorDeployment().catch(console.error)
} 