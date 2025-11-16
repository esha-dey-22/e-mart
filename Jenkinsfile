pipeline {
    agent any

    environment {
        IMAGE = "emart-frontend"
        TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE}:${TAG} ."
                sh "docker tag ${IMAGE}:${TAG} ${IMAGE}:latest"
            }
        }

        stage('Deploy Container') {
            steps {
                sh "docker stop emart || true"
                sh "docker rm emart || true"
                sh "docker run -d --name emart --restart unless-stopped -p 80:80 ${IMAGE}:latest"
            }
        }
    }

    post {
        success {
            echo "Deployment successful: ${IMAGE}:${TAG}"
        }
        failure {
            echo "Deployment failed."
        }
    }
}
