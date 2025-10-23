import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import ForgetPass from "./pages/ForgetPass";
import Dashboard from "./pages/Dashboard";
import Classroom from "./pages/Classroom";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings"; 
import Learnmore from "./pages/Learnmore"; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/classroom" element={<Classroom />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/about" element={<Home />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/ForgetPass" element={<ForgetPass />} />
      <Route path="/learnmore" element={<Learnmore />} />

    </Routes>
  );
}
export default App;
