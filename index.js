import express from "express";
import mongoose from "mongoose";
import { dirname } from "path";
import dotenv from "dotenv";
import Users from "./models/users.js";
import multer from "multer";
import { fileURLToPath } from "url";
import excelToJson from "convert-excel-to-json";
import nodemailer from "nodemailer";
import puppeteer from "puppeteer";
import cors from "cors";

dotenv.config();

const app = express();
const port = 8080;
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(cors());

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URL)
    .then(() => { console.log("Database connected") })
    .catch(() => { console.log("Database error") })

// Set up multer for file uploading
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });



app.get('/', (req, res) => {
    res.sendFile(__dirname + 'index.html');
})

app.get('/addUser',(req,res)=>{
    res.sendFile(__dirname + '/addUserForm.html')
})

app.post('/addUser', async (req,res)=>{
    const data = req.body;
    //console.log(data);
    const user = Users(data);
    await user.save();
    res.redirect("/");
})

// Endpoint for uploading Excel file
app.post('/upload', upload.single('excelFile'), async (req, res) => {
    try {

        const filePath = req.file.path; // Get the path to the uploaded file
        console.log('File uploaded to: ' + filePath);

        // Convert Excel data to JSON
        const excelData = excelToJson({
            sourceFile: filePath,
            source: req.file.buffer,
            header: {
                rows: 1,
            },
            columnToKey: {
                A: 'name',
                B: 'email',
                C: 'marks',
                D: 'certificateGenerated'
            },
        });

        // Extract the sheet data (assuming there's only one sheet)
        const jsonData = excelData[Object.keys(excelData)[0]];
        //console.log(jsonData);
        // Store data in MongoDB
        await Users.insertMany(jsonData);
        res.status(200).send("Data saved successfully");

    } catch (error) {
        console.error(error);
        res.status(500);
    }
});


app.get('/getall', async (req, res) => {
    const users = await Users.find({});
    //console.log(users);
    // users.forEach(user => {
    //     console.log(`Name = ${user.name}`);
    // });
    res.status(200).json(users);
})

app.put('/updateUser/:email', async (req, res) => {
    const { email } = req.params;
    const newData = req.body;

    try {
        // Find the user by email
        const user = await Users.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user data
        Object.keys(newData).forEach(key => {
            if (key !== '_id' && key !== 'email') {
                user[key] = newData[key];
            }
        });

        // Save the updated user
        await user.save();

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.patch('/updateUser/:email', async (req, res) => {
    const { email } = req.params;
    const newData = req.body;

    try {
        // Find the user by email
        const user = await Users.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user data based on provided fields
        Object.keys(newData).forEach(key => {
            if (key !== '_id' && key !== 'email' && user[key] !== undefined) {
                user[key] = newData[key];
            }
        });

        // Save the updated user
        await user.save();

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/deleteUser/:email', async (req, res) => {
    const { email } = req.params;

    try {
        // Find and delete the user by email
        const result = await Users.deleteOne({ email });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Endpoint for generating and sending certificates
app.get('/generate-certificates', async (req, res) => {
    try {
        const certificates = await Users.find({ certificateGenerated: "FALSE" });

        for (const certificate of certificates) {

            const htmlContent = 
`
            
            <html>
    <head>
        <style type='text/css'>
            body, html {
                margin: 0;
                padding: 0;
            }
            body {
                color: black;
                display: table;
                font-family: Georgia, serif;
                font-size: 30px;
                text-align: center;
            }
            .container {
                border: 40px solid tan;
                width: 1056px;
                height: 816px;
                display: table-cell;
                vertical-align: middle;
                margin : 0 auto;
            }
            .logo {
                color: tan;
            }

            .marquee {
                color: tan;
                font-size: 52px;
                margin: 20px;
            }
            .assignment {
                margin: 20px;
            }
            .person {
                border-bottom: 2px solid black;
                font-size: 32px;
                font-style: italic;
                margin: 20px auto;
                width: 400px;
            }
            .reason {
                margin: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                Excel2Mailer
            </div>

            <div class="marquee">
                Certificate of Completion
            </div>

            <div class="assignment">
                This certificate is presented to
            </div>

            <div class="person">
                ${certificate.name}
            </div>

            <div class="reason">
                For Successfully completing the Course by securing ${certificate.marks}/100 <br/>
				On<br/>
                ${Date().substring(4, 15)}
            </div>
        </div>
    </body>
</html>
            `;

            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(htmlContent);
            const pdfBuffer = await page.pdf({ format: 'Letter', landscape:true });
            await browser.close();
            console.log(pdfBuffer);
            //Send email with PDF attachment
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                secure: true,
                port: 465,
                auth: {
                    user: process.env.USER_EMAIL,
                    pass: process.env.USER_PASS,
                },
            });
            console.log("Transporter done");
            const mailOptions = {
                from: process.env.USER_EMAIL,
                to: certificate.email,
                subject: 'Course Completion',
                text: `Dear ${certificate.name} , Congratulations on completing the course. You secured ${certificate.marks} / 100 `,
                attachments: [
                    {
                        filename: 'certificate.pdf',
                        content: pdfBuffer,
                    },
                ],
            };

            const info = await transporter.sendMail(mailOptions);

            console.log("Message Sent : " + info.messageId);
            // Update certificate status in MongoDB
            await Users.updateOne({ _id: certificate._id }, { $set: { certificateGenerated: "TRUE" } });
        }

        res.status(200).send("Emails sent successfully");
    } catch (error) {
        console.error(JSON.stringify(error));
        res.sendStatus(500);
    }
});


app.listen(port, () => {
    console.log(`Listening on port number : ${port}`);
})
