pipeline {
    agent any
    
    stages {
        stage('Clone') {
            steps {
                git 'https://github.com/SaranyaDevi2005/helpdesk-devops.git'
            }
        }

        stage('Build') {
            steps {
                sh 'docker-compose build'
            }
        }

        stage('Run') {
            steps {
                sh 'docker-compose up -d'
            }
        }
    }
}