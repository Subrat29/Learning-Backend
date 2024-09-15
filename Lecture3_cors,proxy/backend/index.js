import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send('Hello World');
});

// get a list of 5 jokes
app.get('/api/jokes', (req, res) => {
    const jokes = [
        {
            id: 1,
            joke: 'What do you call a very small valentine? A valen-tiny!',
        },
        {
            id: 2,
            joke: 'What did the dog say when he rubbed his tail on the sandpaper? Ruff, Ruff!',
        },
        {
            id: 3,
            joke: 'Why don\'t sharks like to eat clowns? Because they taste funny!',
        },
        {
            id: 4,
            joke: 'What did i get when i asked for a buet in my room? A buet in my room!',
        },
    ]
    res.send(jokes);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})