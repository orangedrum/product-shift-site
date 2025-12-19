import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Styleguide from './pages/Styleguide';
import AiPoweredUxHealthtech from './pages/AiPoweredUxHealthtech';
import HomePage from './pages/HomePage';

function App() {
  return (
    <div className="bg-white text-gray-900">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/styleguide" element={<Styleguide />} />
          <Route path="/ai-powered-uxhealthtech" element={<AiPoweredUxHealthtech />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App