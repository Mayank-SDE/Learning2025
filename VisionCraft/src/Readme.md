API: http://localhost:8089

MinIO console: http://localhost:9001 (user: admin / pass: admin123)

RabbitMQ console: http://localhost:15672 (guest/guest)

Run this command for project setup :- 
Set-ExecutionPolicy Bypass -Scope Process -Force
.\setup-visioncraft.ps1

wsl -d Ubuntu

To run this application at the root level ->
```wsl
docker compose build
docker compose up
```
Go to the client
```powershell
$ cd vision-craft-client
$ npm i 
$ npm run dev
```