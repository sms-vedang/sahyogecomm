Sahyog Medical E-Commerce Site (MongoDB Edition)

This project contains the full source code for a functional e-commerce website with a frontend, a Node.js backend, and a MongoDB database.

IMPORTANT: One-Time Setup

You will need to set up a few things on your computer to run this project. You only need to do this once.

Step 1: Install Node.js

If you don't have it, download and install Node.js from the official website: nodejs.org. This will also install npm, which is Node's package manager.

Step 2: Set Up a Free MongoDB Database

We will use MongoDB Atlas to get a free cloud database.

Create an Account: Go to mongodb.com/cloud/atlas/register and sign up.

Create a Free Cluster: Follow the on-screen instructions to create a new project and then build a database. Choose the M0 (Free) cluster option. Select a cloud provider and region (usually the defaults are fine).

Create a Database User:

In the left-hand menu, go to Database Access.

Click Add New Database User.

Enter a username and password. Remember these, you'll need them soon! Grant the user "Read and write to any database" privileges.

Allow Network Access:

In the left-hand menu, go to Network Access.

Click Add IP Address.

Click Allow Access From Anywhere. This is okay for development, but for a real application, you would restrict this to your server's IP.

Get Your Connection String:

Go back to Database.

Click the Connect button on your cluster.

Select Drivers.

You will see a connection string. It looks like this:
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

Copy this string.

Running the Application

Step 1: Set Up the Backend

Create a Folder: Create a new folder on your computer for this project.

Save Backend Files: Save server.js and package.json inside this folder.

Open a Terminal: Open your computer's terminal or command prompt and navigate into that folder.

Install Dependencies: Run this command. It will read package.json and download all the necessary code libraries into a node_modules folder.

npm install


Configure the Database Connection:

In the server.js file, find this line:

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sahyog-medical?retryWrites=true&w=majority';


Replace the example connection string with the one you copied from MongoDB Atlas.

Replace <username> and <password> with the database user credentials you created.

After the .net/ part, add a name for your database, like sahyog-medical. Your final string should look something like:
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/sahyog-medical?retryWrites=true&w=majority

Start the Server: Run this command in your terminal.

npm start


You should see the message Server is running on http://localhost:3000 and Successfully connected to MongoDB.. Your backend is now running! Keep this terminal window open.

Step 2: Run the Frontend

Save Frontend File: Save the sahyog_medical.html file anywhere on your computer.

Open in Browser: Simply open the sahyog_medical.html file in your web browser (like Chrome or Firefox).

Step 3: Use the Website!

The website is now fully functional.

The first user who registers will automatically be made an admin.

Log in as the admin to see the Admin Panel, where you can add, edit, and delete products, and view all orders.
