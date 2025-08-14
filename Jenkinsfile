pipeline{
    agent any
    
    stages{
        stage('Connect to GitHub'){
            steps{
                
            }
        }
        stage('Docker Build & Push'){
            steps{
                withDockerRegistry(credentialsId: 'dockerhub-creds', url: '') {
                    sh 'docker-compose build'
                    sh 'docker-compose push'
                }
            }
        }
    }
}