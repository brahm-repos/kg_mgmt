import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { WorkflowPage } from './pages/WorkflowPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="workflow" element={<WorkflowPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
