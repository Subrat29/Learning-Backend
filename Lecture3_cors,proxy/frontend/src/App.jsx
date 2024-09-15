import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios'

function App() {
  const [jokes, setJokes] = useState([])

  useEffect(() => {
    axios.get('/api/jokes')
      .then((res) => {
        setJokes(res.data)
      })
      .catch((err) => {
        console.log(err)
      })
  },[])

  return (
    <>
      <h1>Jokes Pitara</h1>
      <p>Jokes Length: {jokes.length}</p>
      {jokes.map((joke) => {
        return <p key={joke.id}>{joke.joke}</p>
      })}
    </>
  )
}

export default App
