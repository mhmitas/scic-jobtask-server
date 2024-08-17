# This is a tech gadgets store website's backend. 

**This server is built to provide a robust user experience. users can find tech gadgets like smartphones, smartwatches, laptops, tablets, computers, etc.
Some features of this website are pagination, searching, categorization, and sorting of products.**

## Quick Start (Run Locally)
### Prerequisites
Make sure you have the following installed on your machine:
- Git
- Node.js
### Steps
1. Open the terminal and run.
   ```
   git clone https://github.com/mhmitas/scic-jobtask-server.git
   ```
3. Create a .env file and add these variables.
   ```bash
   DB_PASSWORD=
   DB_USER=
   ACCESS_TOKE_SECRET= 
   ```
   to generate the Access token secret, open your terminal, write node, and press enter. then run this command
   ```bash
   ('crypto').randomBytes(64).toString('hex')
   ```
5. Go to MongoDB and take your MongoDB connection URI, then go index.js file and add this URI.
6. run `npm i` and run `node index.js`
