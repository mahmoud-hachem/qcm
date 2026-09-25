import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import Profiles from './Profiles.jsx'
import './styles.css'
import './refined.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><Profiles><App /></Profiles></BrowserRouter></React.StrictMode>
)
