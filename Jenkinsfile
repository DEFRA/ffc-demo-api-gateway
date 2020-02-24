@Library('defra-library@1.0.0')
import uk.gov.defra.ffc.DefraUtils
def defraUtils = new DefraUtils()

def containerSrcFolder = '\\/home\\/node'
def containerTag = ''
def deployJobName = 'ffc-demo-api-gateway-deploy'
def kubeCredsId = 'FFCLDNEKSAWSS001_KUBECONFIG'
def lcovFile = './test-output/lcov.info'
def localSrcFolder = '.'
def mergedPrNo = ''
def pr = ''
def repoName = 'ffc-demo-api-gateway'
def regCredsId = 'ecr:eu-west-2:ffcdev-user'
def registry = '171014905211.dkr.ecr.eu-west-2.amazonaws.com'
def sonarQubeEnv = 'SonarQube'
def sonarScanner = 'SonarScanner'
def testService = 'ffc-demo-api-gateway'
def timeoutInMinutes = 5

def getExtraCommands(pr) {
  def helmValues = [
    /container.redeployOnChange="$pr-$BUILD_NUMBER"/
  ].join(',')

  return [
    "--values ./helm/ffc-demo-api-gateway/jenkins-aws.yaml",
    "--set $helmValues"
  ].join(' ')
}

node {
  checkout scm

  try {
    stage('Set GitHub status as pending'){
      defraUtils.setGithubStatusPending()
    }
    stage('Set branch, PR, and containerTag variables') {
      (pr, containerTag, mergedPrNo) = defraUtils.getVariables(repoName, defraUtils.getPackageJsonVersion())
    }
    stage('Helm lint') {
      defraUtils.lintHelm(repoName)
    }
    stage('Build test image') {
      docker.withRegistry("https://$registry", regCredsId) {
        defraUtils.buildTestImage(repoName, BUILD_NUMBER)
      }
    }
    stage('Run tests') {
      defraUtils.runTests(repoName, testService, BUILD_NUMBER)
    }
    stage('Create Test Report JUnit'){
      defraUtils.createTestReportJUnit()
    }
    stage('Fix absolute paths in lcov file') {
      defraUtils.replaceInFile(containerSrcFolder, localSrcFolder, lcovFile)
    }
    stage('SonarQube analysis') {
      defraUtils.analyseCode(sonarQubeEnv, sonarScanner, ['sonar.projectKey' : repoName, 'sonar.sources' : '.'])
    }
    stage("Code quality gate") {
      defraUtils.waitForQualityGateResult(timeoutInMinutes)
    }
    stage('Push container image') {
      defraUtils.buildAndPushContainerImage(regCredsId, registry, repoName, containerTag)
    }
    if (pr != '') {
      stage('Verify version incremented') {
        defraUtils.verifyPackageJsonVersionIncremented()
      }
      stage('Helm install') {
        defraUtils.deployChart(kubeCredsId, registry, repoName, containerTag, getExtraCommands(pr))
      }
    }
    if (pr == '') {
      stage('Publish chart') {
        defraUtils.publishChart(registry, repoName, containerTag)
      }
      stage('Trigger GitHub release') {
        withCredentials([
          string(credentialsId: 'github_ffc_platform_repo', variable: 'gitToken')
        ]) {
          defraUtils.triggerRelease(containerTag, repoName, containerTag, gitToken)
        }
      }
      stage('Trigger Deployment') {
        withCredentials([
          string(credentialsId: 'JenkinsDeployUrl', variable: 'jenkinsDeployUrl'),
          string(credentialsId: 'ffc-demo-api-gateway-deploy-token', variable: 'jenkinsToken')
        ]) {
          defraUtils.triggerDeploy(jenkinsDeployUrl, deployJobName, jenkinsToken, ['chartVersion': containerTag])
        }
      }
    }
    if (mergedPrNo != '') {
      stage('Remove merged PR') {
        defraUtils.undeployChart(kubeCredsId, repoName, mergedPrNo)
      }
    }
    stage('Set GitHub status as success'){
      defraUtils.setGithubStatusSuccess()
    }
  } catch(e) {
    defraUtils.setGithubStatusFailure(e.message)
    defraUtils.notifySlackBuildFailure(e.message, "#generalbuildfailures")
    throw error
  } finally {
    defraUtils.deleteTestOutput(repoName, containerSrcFolder)
  }
}
