import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Students from './pages/Students';
import ImportCsv from './pages/ImportCsv';
import Trombi from './pages/Trombi';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="classes" element={<Classes />} />
          <Route path="students" element={<Students />} />
          <Route path="import" element={<ImportCsv />} />
          <Route path="trombi" element={<Trombi />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
