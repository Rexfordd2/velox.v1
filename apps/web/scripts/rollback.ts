import { exec } from 'child_process'
import { promisify } from 'util'
import { checkDeploymentHealth } from './monitor'

const execAsync = promisify(exec)

interface RollbackOptions {
  namespace: string
  revision?: number // Specific revision to rollback to
  wait: boolean // Whether to wait for rollback to complete
  timeout: number // Timeout in seconds
}

const defaultOptions: RollbackOptions = {
  namespace: 'production',
  wait: true,
  timeout: 300,
}

async function rollbackDeployment(options: RollbackOptions = defaultOptions) {
  const { namespace, revision, wait, timeout } = options

  try {
    console.log('🔄 Starting rollback process...')

    // Get deployment history
    const { stdout: history } = await execAsync(
      `kubectl rollout history deployment web-app -n ${namespace}`
    )
    console.log('\n📜 Deployment History:')
    console.log(history)

    // Perform rollback
    const rollbackCmd = revision
      ? `kubectl rollout undo deployment web-app -n ${namespace} --to-revision=${revision}`
      : `kubectl rollout undo deployment web-app -n ${namespace}`

    await execAsync(rollbackCmd)
    console.log('⏳ Rollback initiated...')

    if (wait) {
      // Wait for rollback to complete
      const waitCmd = `kubectl rollout status deployment web-app -n ${namespace} --timeout=${timeout}s`
      await execAsync(waitCmd)
      console.log('✅ Rollback completed successfully')

      // Check deployment health after rollback
      console.log('\n🔍 Checking deployment health...')
      await checkDeploymentHealth(namespace)
    }

  } catch (error) {
    console.error('❌ Rollback failed:', error)
    throw error
  }
}

async function listRevisions(namespace: string = 'production') {
  try {
    const { stdout } = await execAsync(
      `kubectl rollout history deployment web-app -n ${namespace}`
    )
    console.log('\n📋 Available Revisions:')
    console.log(stdout)
  } catch (error) {
    console.error('Error listing revisions:', error)
    throw error
  }
}

// Export for use in other scripts
export { rollbackDeployment, listRevisions }

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2)
  const options: RollbackOptions = {
    ...defaultOptions,
    revision: args[0] ? parseInt(args[0]) : undefined,
  }
  
  rollbackDeployment(options).catch(console.error)
} 