docker-compose down -v   
docker-compose up --build

DB_HOST=mysql
DB_USER=root
DB_PASSWORD=password
DB_NAME=myappdb

mysql -h 127.0.0.1 -P 3306 -u root -ppassword
USE myappdb
SELECT * FROM users;


``` 
docker run -d \
  --name mysql \
  --network charter-net \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=myappdb \
  -p 3306:3306 \
  eawangya/mysql:latest


docker run -d \
  --name myapp \
  --network charter-net \
  -e DB_HOST=mysql \
  -e DB_USER=root \
  -e DB_PASSWORD=password \
  -e DB_NAME=myappdb \
  -p 3000:3000 \
  eawangya/myapp:latest


docker run -d \
  --name nginx \
  --network charter-net \
  -p 8080:80 \
  eawangya/charter-nginx:latest

``` 


Yes, I have proven experience as a DevSecOps Engineer, with over 3 years integrating security into DevOps workflows across both cloud and on-prem environments. In my most recent roles at Econolite, Microsoft, and Charter Communications, I have:  Embedded DevSecOps practices into CI/CD pipelines using tools like GitLab CI, Jenkins, and Azure DevOps.  Integrated security tools such as:  SAST: SonarQube, Checkmarx, Semgrep, Checkstyle  DAST: OWASP ZAP, OWASP Dependency-Check  SCA: Snyk  Container & IaC scanning: Trivy, Checkov, Aqua Security, TerraScan  Centralized vulnerability management with DefectDojo to track and remediate issues across applications and infrastructure.  Secured secrets and credentials using tools like HashiCorp Vault, AWS Secrets Manager, and Azure Key Vault.  Applied policy-as-code and shift-left security approaches to enforce compliance early in the SDLC.  Designed and operated Kubernetes environments (EKS, AKS, RKE2) with strong security practices including RBAC, network policies, and admission webhooks.  Altogether, I bring 7+ years of DevOps experience and 3+ years with a focused DevSecOps approach to securing pipelines, infrastructure, and applications.