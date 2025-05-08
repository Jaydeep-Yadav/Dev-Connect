# Dev-Connect

# Hosting MERN Stack Application on AWS EC2 Using Nginx and PM2

This guide provides a step-by-step process to deploy a MERN stack application on an AWS EC2 instance using Nginx for serving the frontend and PM2 for managing the backend server.

---

## ✅ **1. SSH into Your EC2 Instance:**

```bash
ssh -i /path/to/your-key.pem ec2-user@your-ec2-ip
```

---

## ✅ **2. Update and Install Required Packages:**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx -y
sudo apt install nodejs -y
sudo apt install npm -y
sudo npm install -g pm2
```

---

## ✅ **3. Clone Your Application to **\`\`** Directory:**

Navigate to the home directory and clone the repository:

```bash
cd ~

# frontend
git clone https://github.com/Jaydeep-Yadav/devConnect-frontend.git

# backend
git clone https://github.com/Jaydeep-Yadav/Dev-Connect.git
```

---

## ✅ **4. Install Dependencies:**

Navigate to the backend and frontend directories and install the dependencies:

```bash
# Backend
cd ~/your-mern-app/backend
npm install

# Frontend
cd ~/your-mern-app/frontend
npm install
```

---

## ✅ **5. Build the Frontend and Move to /var/www/ :**

1. **Build the Frontend:**

```bash
cd ~/your-mern-app/frontend
npm run build
```

2. **Move the **`** Folder to /var/www/ **`**:**

```bash
sudo mkdir -p /var/www/mern-frontend
sudo mv build/* /var/www/mern-frontend/
```

---

## ✅ **6. Configure Nginx:**

Open the Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/mern-app
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-ec2-ip; # Replace with your actual EC2 IP

    location / {
        root /var/www/mern-frontend;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;  # Ensure the trailing slash
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ✅ **7. Enable the Configuration:**

```bash
sudo ln -s /etc/nginx/sites-available/mern-app /etc/nginx/sites-enabled/
```

Disable the default configuration (optional but recommended):

```bash
sudo rm /etc/nginx/sites-enabled/default
```

---

## ✅ **8. Test Nginx Configuration:**

```bash
sudo nginx -t
```

If there are no errors, restart Nginx:

```bash
sudo systemctl restart nginx
```

---

## ✅ **9. Start the Backend Server with PM2:**

Navigate to the backend directory and start the server:

```bash
cd ~/your-mern-app/backend
pm2 start server.js --name mern-backend
```

Ensure PM2 restarts the server on reboot:

```bash
pm2 save
pm2 startup
```

---

## ✅ **10. Open Ports for Frontend and Backend in EC2:**

Go to the EC2 console → Select instance → Security Groups → Edit Inbound Rules.

Add rules for HTTP (Port 80) and Custom TCP (Port 8000) with source 0.0.0.0/0.

## ✅ **11. Verify Everything:**

* Visit `http://your-ec2-ip` to access the frontend.
* Visit `http://your-ec2-ip/api` to access the backend.

---
