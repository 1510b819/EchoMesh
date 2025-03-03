import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chat from "./pages/Chat";
function App() {
  return (
    <Router>
      <div className="flex justify-center items-center h-screen">
        <Routes>
          <Route path="/" element={<Chat />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
