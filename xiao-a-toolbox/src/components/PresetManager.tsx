import { useState } from "react";

interface Preset {
  name: string;
  data: Record<string, any>;
}

interface Props {
  presets: Preset[];
  onSave: (name: string, data: Record<string, any>) => void;
  onLoad: (preset: Preset) => void;
  onDelete: (name: string) => void;
  getCurrentData: () => Record<string, any>;
}

export default function PresetManager({ presets, onSave, onLoad, onDelete, getCurrentData }: Props) {
  const [name, setName] = useState("");
  const [showSave, setShowSave] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {presets.map((p) => (
        <div key={p.name} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
          <button onClick={() => onLoad(p)} className="text-xs text-gray-600 hover:text-purple-600">
            {p.name}
          </button>
          <button onClick={() => onDelete(p.name)} className="text-xs text-gray-400 hover:text-red-500">×</button>
        </div>
      ))}
      {showSave ? (
        <div className="flex items-center gap-1">
          <input
            className="w-20 px-2 py-0.5 text-xs border border-gray-300 rounded"
            placeholder="预设名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name) { onSave(name, getCurrentData()); setName(""); setShowSave(false); }
            }}
          />
          <button
            onClick={() => { if (name) { onSave(name, getCurrentData()); setName(""); setShowSave(false); } }}
            className="text-xs text-purple-600 hover:text-purple-700"
          >
            保存
          </button>
        </div>
      ) : (
        <button onClick={() => setShowSave(true)} className="text-xs text-gray-500 hover:text-purple-600 ml-2">
          + 存储预设
        </button>
      )}
    </div>
  );
}
