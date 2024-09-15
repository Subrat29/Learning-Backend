const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>')
})

app.get('/profile', (req, res) => {
    res.send('<h1>Name: Subrat</h1> <br> <h1>Age: 25</h1>')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})