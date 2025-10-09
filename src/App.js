import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signin from "./pages/Signin";
import Register from "./pages/Register";
import ForgetPass from "./pages/ForgetPass";
import Dashboard from "./pages/Dashboard";
import Classroom from "./pages/Classroom";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";  

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
      <Route path="/register" element={<Register />} />
      <Route path="/ForgetPass" element={<ForgetPass />} />
    </Routes>
  );
}
export default App;
