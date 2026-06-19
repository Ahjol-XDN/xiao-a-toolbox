import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Video from "./pages/Video";
import VideoToAudio from "./pages/VideoToAudio";
import Audio from "./pages/Audio";
import Document from "./pages/Document";
import Image from "./pages/Image";
import PDF from "./pages/PDF";
import Batch from "./pages/Batch";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Video />} />
        <Route path="/video" element={<Video />} />
        <Route path="/video-to-audio" element={<VideoToAudio />} />
        <Route path="/audio" element={<Audio />} />
        <Route path="/document" element={<Document />} />
        <Route path="/image" element={<Image />} />
        <Route path="/pdf" element={<PDF />} />
        <Route path="/batch" element={<Batch />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
