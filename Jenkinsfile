pipeline {
  agent any

  environment {
    
    MANIFEST_REPO = "github.com/EAwangya/argocd-kubernetes.git"
    MANIFEST_DIR = "manifests"
    MANIFEST_FILE = "${MANIFEST_DIR}/deployment.yaml"
    TAG = "${env.BUILD_NUMBER}"
    DB_IMAGE = 'eawangya/myappweb'
    APP_IMAGE = 'eawangya/myapp'
    WEB_IMAGE = 'eawangya/myappweb'
    REPO = "EAwangya/argocd-kubernetes"
    BRANCH = "hotfix"
    BASE = "main"

  }

  stages {
    // stage('Connect to GitHub') {
    //   steps {
    //     git branch: 'main', credentialsId: 'github-cred', url: 'https://github.com/EAwangya/mysql-argocd-kubernetes.git'
    //   }
    // }
        stage('Check Existing Pull Request') {
            steps {
                script {
                    // Inject secret text into a variable
                    withCredentials([string(credentialsId: 'github-token', variable: 'TOKEN')]) {
                        
                        def prExists = sh(
                            script: """
                                PR_LIST=\$(curl -s \
                                    -H "Accept: application/vnd.github+json" \
                                    -H "Authorization: Bearer \$TOKEN" \
                                    -H "X-GitHub-Api-Version: 2022-11-28" \
                                    "https://api.github.com/repos/${REPO}/pulls?state=open&head=${BRANCH}&base=${BASE}")

                                echo \$(echo "\$PR_LIST" | jq 'length')
                            """,
                            returnStdout: true
                        ).trim()

                        if (prExists != "0") {
                            error "⚠️ Pull request already exists for branch '${BRANCH}' → exiting pipeline."
                        } else {
                            echo "✅ No existing PR found — continuing pipeline..."
                        }
                    }
                }
            }
        }
    stage('Build Docker Images') {
        steps {
            script {
                sh '''
                # Ensure buildx builder exists
                docker buildx create --use || true
    
                # Build multi-arch images for local usage
                docker buildx build --platform linux/amd64,linux/arm64 -t "${DB_IMAGE}:${TAG}" -f database/Dockerfile ./database --load
                docker buildx build --platform linux/amd64,linux/arm64 -t "${APP_IMAGE}:${TAG}" -f app/Dockerfile ./app --load
                docker buildx build --platform linux/amd64,linux/arm64 -t "${WEB_IMAGE}:${TAG}" -f web/Dockerfile ./web --load
                '''
            }
        }
    }
    
    stage('Docker Push') {
        steps {
            withDockerRegistry(credentialsId: 'dockerhub-creds', url: '') {
                sh "docker push ${DB_IMAGE}:${TAG}"
                sh "docker push ${APP_IMAGE}:${TAG}"
                sh "docker push ${WEB_IMAGE}:${TAG}"
            }
        }
    }
    stage('Clone or Pull GitHub Manifest Repo') {
        steps {
            script {
                if (!fileExists(MANIFEST_DIR)) {
                    sh "git clone -b hotfix https://${MANIFEST_REPO} ${MANIFEST_DIR}"
                } else {
                    dir(MANIFEST_DIR) {
                        sh "git pull"
                    }
                }
            }
        }
    }
    stage('Update Kubernetes Manifest File') {
        steps {
            script {
                dir(MANIFEST_DIR) {
                    sh 'sed -i "s#eawangya.*#${APP_IMAGE}:${TAG}#g" ${MANIFEST_FILE}'
                }
            }
        }
    }
    stage('Commit and Push Changes') {
        steps {
            script {
                dir(MANIFEST_DIR) {
                    withCredentials([usernamePassword(credentialsId: 'github-cred',
                                                    usernameVariable: 'GIT_USER',
                                                    passwordVariable: 'GIT_PASS')]) {
                        sh '''
                            git config user.email "ci-bot@example.com"
                            git config user.name "CI Bot"
                            git checkout -B hotfix
                            git add "${MANIFEST_FILE}"
                            git commit -m "Update App image" || echo "No changes to commit"
                            git remote set-url origin https://${GIT_USER}:${GIT_PASS}@github.com/EAwangya/argocd-kubernetes.git
                            git push -u origin hotfix --force-with-lease
                        '''
                    }
                }
            }
        }
    }
    stage('Create Pull Request') {
        steps {
            withCredentials([string(credentialsId: 'github-token', variable: 'TOKEN')]) {
                sh """
                    curl -L \
                    -X POST \
                    -H "Accept: application/vnd.github+json" \
                    -H "Authorization: Bearer ${TOKEN}" \
                    -H "X-GitHub-Api-Version: 2022-11-28" \
                    https://api.github.com/repos/EAwangya/argocd-kubernetes/pulls \
                    -d '{"title":"Amazing new feature - Application updated to v${TAG}","body":"Please pull these awesome changes in!","head":"hotfix","base":"main"}'
                 """

            }
        }
    }
}
  post {
    always {
      // --- Docker cleanup (safe for shared agents) ---
      sh '''#!/usr/bin/env bash
set -euo pipefail

# Prune dangling layers and builder cache
docker image prune -f || true
docker builder prune -af || true
'''

      // --- Preserve manifests but still clean the workspace ---
      // 1) Keep a copy on the build as artifacts (visible in Jenkins UI)
      archiveArtifacts artifacts: 'manifests/**,k8s/**', allowEmptyArchive: true, fingerprint: true

      // 2) Clean everything EXCEPT your manifests folders
      // Requires the "Workspace Cleanup" plugin (cleanWs step)
      cleanWs(
        deleteDirs: true,
        notFailBuild: true,
        patterns: [
          [pattern: 'manifests/**', type: 'EXCLUDE'],
          [pattern: 'k8s/**',       type: 'EXCLUDE']
        ]
      )
    }
  }
}
