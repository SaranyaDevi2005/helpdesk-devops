pipeline {
    agent any

    stages {

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    bat 'docker build -t frontend-app:latest .'
                }
            }
        }

    }
}