import React, { useEffect, useMemo } from 'react'
import { io } from 'socket.io-client'
const Home = () => {
    
    const socket = useMemo(() => io('http://localhost:3000'), [])

    useEffect(()=>{
  socket.on('connect',()=>{
console.log('Connected to server');
  })

  //disconnect from the server when the user leaves the page
  const handleBeforeunload=()=>{
    socket.disconnect();
  }
  window.addEventListener("beforeunload",handleBeforeunload);
    return ()=>{
      socket.disconnect();
      window.addEventListener("beforeunload",handleBeforeunload);
    }
    },[])
  return (
    <div className='flex justify-center items-center flex-col'>
        <h1 className='text-red-600 text-4xl font-bold'>Home</h1>
        <p className='text-blue-600 font-semibold mt-6'>Welcome to the home page</p>
    </div>
  )
}

export default Home
