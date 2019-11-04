@Library('defra-library@add-deploy-trigger')
import uk.gov.defra.ffc.DefraUtils
def defraUtils = new DefraUtils()

def registry = '562955126301.dkr.ecr.eu-west-2.amazonaws.com'
def regCredsId = 'ecr:eu-west-2:ecr-user'
def kubeCredsId = 'awskubeconfig002'
def imageName = 'ffc-demo-api-gateway'
def testImageName = 'ffc-demo-api-gateway-test'
def repoName = 'ffc-demo-api-gateway'
def pr = ''
def mergedPrNo = ''
def containerTag = ''

def buildTestImage(name, suffix) {
  sh "docker-compose -p $name-$suffix -f docker-compose.test.yaml build --force-rm --no-cache --pull $name"
}

def runTests(name, suffix) {
  try {
    sh 'mkdir -p test-output'
    sh 'chmod 777 test-output'
    sh "docker-compose -p $name-$suffix -f docker-compose.test.yaml run $name"

  } finally {
    sh "docker-compose -p $name-$suffix -f docker-compose.test.yaml down -v"
    junit 'test-output/junit.xml'
    // clean up files created by node/ubuntu user that cannot be deleted by jenkins. Note: uses global environment variable
    sh "docker run -u node --mount type=bind,source='$WORKSPACE/test-output',target=/usr/src/app/test-output $name rm -rf test-output/*"
  }
}

node {
  checkout scm

  try {
    stage('Set branch, PR, and containerTag variables') {
      (pr, containerTag, mergedPrNo) = defraUtils.getVariables(repoName)
      defraUtils.updateGithubCommitStatus('Build started', 'PENDING')
    }
    stage('Build test image') {
      buildTestImage(testImageName, BUILD_NUMBER)
    }
    stage('Run tests') {
      runTests(testImageName, BUILD_NUMBER)
    }
    stage('Push container image') {
      defraUtils.pushContainerImage(regCredsId, registry, imageName, containerTag)
    }
    if (pr != '') {
      stage('Helm install') {
        def extraCommands = "--values ./helm/$repoName/jenkins-aws.yaml"
        defraUtils.deployChart(kubeCredsId, registry, imageName, containerTag, extraCommands)
      }
    }
    if (pr == '') {
      stage('Publish chart') {
        defraUtils.publishChart(registry, imageName, containerTag)
      }
    }
      stage('Trigger Deployment') {
        withCredentials([
          string(credentialsId: 'JenkinsDeployUrl', variable: 'jenkinsDeployUrl'),
          string(credentialsId: 'ffc-demo-user-service-deploy-token', variable: 'jenkinsToken')
        ]) {
          defraUtils.triggerDeploy(jenkinsDeployUrl, 'ffc-demo-user-service-deploy', jenkinsToken, ['chartVersion':'1.0.0'])
        }
      }
    // }
    if (mergedPrNo != '') {
      stage('Remove merged PR') {
        defraUtils.undeployChart(kubeCredsId, imageName, mergedPrNo)
      }
    }
    defraUtils.updateGithubCommitStatus('Build successful', 'SUCCESS')
  } catch(e) {
    defraUtils.updateGithubCommitStatus(e.message, 'FAILURE')
    throw error
  }
}
