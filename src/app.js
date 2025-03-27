import express from 'express'

const app = express();


// Request Handler
app.use((req, res)=>{
    res.send("hello from server");
})

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
