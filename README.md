# Excel2Mailer

Excel2Mailer is a Node.js application that allows you to upload an Excel file, convert its data to JSON, and send certificates to users via email.

## Features

- **User Management:** Add users to the database with their name and email.
- **Excel File Upload:** Upload an Excel file containing user data, convert it to JSON, and store it in MongoDB.
- **Generate Certificates:** Automatically generate PDF certificates for users who have not received one and send them via email.

## Prerequisites

Before running the application, make sure you have the following installed:

- Node.js
- MongoDB
- npm (Node Package Manager)

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/Excel2Mailer.git
    ```

2. Install dependencies:

    ```bash
    cd Excel2Mailer
    npm install
    ```

3. Set up a `.env` file in the project root with the following variables:

    ```
    MONGO_URL=your_mongo_db_url
    USER_EMAIL=your_gmail_email
    USER_PASS=your_gmail_password
    ```

    Note: Ensure that your Gmail account allows access to less secure apps. For production, consider using OAuth2.

## Usage

1. Start the application:

    ```bash
    npm start
    ```

2. Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to access the application.

3. Use the provided forms to add users, upload Excel files, and generate/send certificates.

## Routes

- `/`: Home page with the main interface.
- `/addUser`: Form to add a new user.
- `/upload`: Endpoint to upload an Excel file.
- `/getall`: Retrieve all users from the database.
- `/generate-certificates`: Generate and send certificates to users.

## Dependencies

- express
- mongoose
- dotenv
- multer
- convert-excel-to-json
- nodemailer
- puppeteer

