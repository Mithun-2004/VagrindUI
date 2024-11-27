const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const valgrindRoutes = require('./routes/ValgrindRoutes');

app.use(cors({
    origin: process.env.FRONTEND_URL,
}));
app.use('/api', valgrindRoutes);

const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});