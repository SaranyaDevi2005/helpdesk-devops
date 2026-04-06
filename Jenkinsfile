pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git 'https://github.com/SaranyaDevi2005/helpdesk-devops.git'
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    bat 'docker build -t frontend-app:latest .'
                }
            }
        }

    }
}