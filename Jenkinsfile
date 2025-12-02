pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "esha0629/e-mart-frontend"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('frontend') {
                    sh 'docker build -t $DOCKER_IMAGE:${BUILD_NUMBER} .'
                }
            }
        }

        stage('Login to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub',
                                                usernameVariable: 'DOCKER_USER',
                                                passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                      echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    '''
                }
            }
        }

        stage('Push Image') {
            steps {
                sh '''
                  docker tag $DOCKER_IMAGE:${BUILD_NUMBER} $DOCKER_IMAGE:latest
                  docker push $DOCKER_IMAGE:${BUILD_NUMBER}
                  docker push $DOCKER_IMAGE:latest
                '''
            }
        }

        stage('Deploy Container') {
            steps {
                // stop old container if exists, then run new one
                sh '''
                  docker rm -f emart-app || true
                  docker run -d --name emart-app -p 8081:80 $DOCKER_IMAGE:latest
                '''
            }
        }
    }
}
