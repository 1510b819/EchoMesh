import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import P2PChat from "./pages/P2PChat";
function App() {
  return (
    <Router>
      <div className="flex justify-center items-center h-screen">
        <Routes>
          <Route path="/" element={<P2PChat />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
